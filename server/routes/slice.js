const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const { uploadBuffer } = require('../config/supabaseStorage');

/**
 * Gera as bandas horizontais da imagem.
 *
 * Diferente da versão anterior (grade global), os cortes verticais (eixo X)
 * são aplicados SOMENTE dentro da banda horizontal que contém uma zona.
 * Bandas sem zona viram uma única fatia full-width — isso elimina as
 * linhas verticais que cortavam o e-mail inteiro quando o cliente de
 * e-mail (Gmail, Outlook) redimensionava as fatias com arredondamentos
 * diferentes.
 */
function buildGrid(zones, imgWidth, imgHeight) {
  // Cortes horizontais globais (limites superior/inferior de cada zona)
  const ySet = new Set([0, imgHeight]);
  zones.forEach((z) => {
    ySet.add(Math.max(0, Math.min(imgHeight, Math.round(z.y))));
    ySet.add(Math.max(0, Math.min(imgHeight, Math.round(z.y + z.height))));
  });
  const ys = [...ySet].sort((a, b) => a - b);

  const rows = [];
  for (let r = 0; r < ys.length - 1; r++) {
    const cy = ys[r];
    const ch = ys[r + 1] - ys[r];
    if (ch <= 0) continue;

    // Zonas que cobrem verticalmente esta banda por completo
    const bandZones = zones.filter(
      (z) => Math.round(z.y) <= cy && Math.round(z.y + z.height) >= cy + ch
    );

    // Cortes verticais apenas desta banda
    const xSet = new Set([0, imgWidth]);
    bandZones.forEach((z) => {
      xSet.add(Math.max(0, Math.min(imgWidth, Math.round(z.x))));
      xSet.add(Math.max(0, Math.min(imgWidth, Math.round(z.x + z.width))));
    });
    const xs = [...xSet].sort((a, b) => a - b);

    const cells = [];
    for (let c = 0; c < xs.length - 1; c++) {
      const cx = xs[c];
      const cw = xs[c + 1] - xs[c];
      if (cw <= 0) continue;

      const zone = bandZones.find(
        (z) =>
          Math.round(z.x) <= cx &&
          Math.round(z.x + z.width) >= cx + cw
      );

      cells.push({
        x: cx,
        y: cy,
        width: cw,
        height: ch,
        type: zone ? zone.type || 'image' : 'image',
        link: zone ? zone.link || null : null,
        alt: zone ? zone.alt || '' : '',
        variable: zone ? zone.variable || '' : '',
        fontSize: zone ? zone.fontSize || '16' : '16',
        fontColor: zone ? zone.fontColor || '#000000' : '#000000',
        fontFamily: zone ? zone.fontFamily || 'Arial, Helvetica, sans-serif' : 'Arial, Helvetica, sans-serif',
        textAlign: zone ? zone.textAlign || 'center' : 'center',
        fontWeight: zone ? zone.fontWeight || 'normal' : 'normal',
        backgroundColor: zone ? zone.backgroundColor || 'transparent' : 'transparent',
      });
    }
    rows.push(cells);
  }

  return rows;
}

/**
 * Converte a cor dominante de uma região da imagem em hex.
 * Usada como fundo automático das zonas de texto, para que qualquer
 * variação de altura do texto (nomes longos que quebram linha) apareça
 * na cor do layout em vez de branco.
 */
async function sampleDominantColor(inputBuffer, region) {
  try {
    const stats = await sharp(inputBuffer)
      .extract({ left: region.x, top: region.y, width: region.width, height: region.height })
      .stats();
    const { r, g, b } = stats.dominant;
    const hex = (n) => n.toString(16).padStart(2, '0');
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  } catch {
    return '#000000';
  }
}

/**
 * Gera o código HTML em formato de tabela compatível com e-mail.
 * Cada banda horizontal é uma <tr> com uma tabela aninhada própria,
 * permitindo números de colunas diferentes por banda sem que os
 * clientes de e-mail tentem alinhar colunas entre bandas.
 */
function generateEmailHTML(gridRows, totalWidth) {
  let html = `<!-- SlicerMail Pro - Gerado automaticamente -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="center" style="padding:0;margin:0;">
<table width="${totalWidth}" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:0 auto;">`;

  for (const row of gridRows) {
    html += `\n  <tr>\n    <td width="${totalWidth}" style="padding:0;margin:0;border:0;line-height:0;font-size:0;">`;
    html += `\n      <table width="${totalWidth}" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">\n        <tr>`;

    for (const cell of row) {
      if (cell.type === 'text') {
        const fontSizePx = parseInt(cell.fontSize, 10) || 16;
        // line-height proporcional à fonte (não à altura da célula):
        // se o texto quebrar em duas linhas, cresce ~20% de uma linha
        // em vez de dobrar a altura da banda inteira.
        const lineHeight = Math.round(fontSizePx * 1.2);
        const bg = cell.backgroundColor && cell.backgroundColor !== 'transparent'
          ? cell.backgroundColor
          : '#000000';
        html += `\n          <td width="${cell.width}" height="${cell.height}" valign="middle" bgcolor="${bg}" style="padding:0;background-color:${bg};font-family:${cell.fontFamily};font-size:${fontSizePx}px;font-weight:${cell.fontWeight};color:${cell.fontColor};text-align:${cell.textAlign};line-height:${lineHeight}px;mso-line-height-rule:exactly;">${cell.variable}</td>`;
      } else {
        const imgTag = `<img src="${cell.imageUrl}" width="${cell.width}" height="${cell.height}" alt="${cell.alt}" style="display:block;width:${cell.width}px;height:${cell.height}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;
        const content = cell.link
          ? `<a href="${cell.link}" target="_blank" style="display:block;text-decoration:none;border:0;">${imgTag}</a>`
          : imgTag;
        html += `\n          <td width="${cell.width}" height="${cell.height}" valign="top" style="padding:0;margin:0;border:0;line-height:0;font-size:0;">${content}</td>`;
      }
    }

    html += '\n        </tr>\n      </table>';
    html += '\n    </td>\n  </tr>';
  }

  html += '\n</table>\n    </td>\n  </tr>\n</table>';
  return html;
}

/**
 * POST /api/slice
 * Body: multipart/form-data
 *   - image: arquivo de imagem
 *   - zones: JSON string com array de { x, y, width, height, link, alt }
 */
router.post('/', async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }

    let zones = [];
    try {
      zones = JSON.parse(req.body.zones || '[]');
    } catch {
      return res.status(400).json({ error: 'Formato de zones inválido.' });
    }

    if (!zones.length) {
      return res.status(400).json({ error: 'Nenhuma zona definida.' });
    }

    const inputBuffer = req.file.buffer;
    const metadata = await sharp(inputBuffer).metadata();
    const imgWidth = metadata.width;
    const imgHeight = metadata.height;

    // Gera bandas horizontais com cortes verticais locais
    const gridRows = buildGrid(zones, imgWidth, imgHeight);

    // Processa cada célula: crop + upload para o Supabase Storage
    let uploadCount = 0;
    const totalCells = gridRows.reduce((sum, row) => sum + row.length, 0);

    for (const row of gridRows) {
      for (const cell of row) {
        if (cell.type === 'text') {
          cell.imageUrl = null;
          // Fundo automático: amostra a cor dominante da região original
          // quando o usuário deixou o fundo como "transparent".
          if (!cell.backgroundColor || cell.backgroundColor === 'transparent') {
            cell.backgroundColor = await sampleDominantColor(inputBuffer, cell);
          }
          uploadCount++;
          console.log(`Célula ${uploadCount}/${totalCells} é zona de texto — fundo ${cell.backgroundColor}, sem upload.`);
          continue;
        }
        const cropBuffer = await sharp(inputBuffer)
          .extract({
            left: cell.x,
            top: cell.y,
            width: cell.width,
            height: cell.height,
          })
          .png()
          .toBuffer();

        const uploadResult = await uploadBuffer(cropBuffer);
        cell.imageUrl = uploadResult.secure_url;
        uploadCount++;
        console.log(`Célula ${uploadCount}/${totalCells} enviada para o Supabase Storage.`);
      }
    }

    const htmlCode = generateEmailHTML(gridRows, imgWidth);

    res.json({
      success: true,
      html: htmlCode,
      imageWidth: imgWidth,
      imageHeight: imgHeight,
      totalCells,
      zones: zones.length,
    });
  } catch (err) {
    console.error('Erro ao processar imagem:', err);
    res.status(500).json({ error: 'Erro interno ao processar imagem.', details: err.message });
  }
});

module.exports = router;
