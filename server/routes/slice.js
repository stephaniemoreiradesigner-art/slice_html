const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const { uploadBuffer } = require('../config/supabaseStorage');

/**
 * Dado um array de zonas, gera uma grade de células
 * baseada nos limites de cada zona (x, y, width, height).
 */
function buildGrid(zones, imgWidth, imgHeight) {
  const xSet = new Set([0, imgWidth]);
  const ySet = new Set([0, imgHeight]);

  zones.forEach((z) => {
    xSet.add(Math.round(z.x));
    xSet.add(Math.round(z.x + z.width));
    ySet.add(Math.round(z.y));
    ySet.add(Math.round(z.y + z.height));
  });

  const xs = [...xSet].sort((a, b) => a - b);
  const ys = [...ySet].sort((a, b) => a - b);

  const rows = [];
  for (let r = 0; r < ys.length - 1; r++) {
    const cells = [];
    for (let c = 0; c < xs.length - 1; c++) {
      const cx = xs[c];
      const cy = ys[r];
      const cw = xs[c + 1] - xs[c];
      const ch = ys[r + 1] - ys[r];

      // Encontra a zona que contém esta célula completamente
      const zone = zones.find(
        (z) =>
          z.x <= cx &&
          z.y <= cy &&
          z.x + z.width >= cx + cw &&
          z.y + z.height >= cy + ch
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
 * Gera o código HTML em formato de tabela compatível com email
 */
function generateEmailHTML(gridRows, totalWidth) {
  let html = `<!-- SlicerMail Pro - Gerado automaticamente -->
<table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">
  <tr>
    <td align="center" style="padding:0;margin:0;">
<table width="${totalWidth}" align="center" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;margin:0 auto;">`;

  for (const row of gridRows) {
    html += '\n  <tr>';
    for (const cell of row) {
      if (cell.type === 'text') {
        const bgStyle = cell.backgroundColor && cell.backgroundColor !== 'transparent'
          ? `background-color:${cell.backgroundColor};`
          : '';
        html += `\n    <td width="${cell.width}" height="${cell.height}" valign="middle" style="padding:10px 15px;${bgStyle}font-family:${cell.fontFamily};font-size:${cell.fontSize}px;font-weight:${cell.fontWeight};color:${cell.fontColor};text-align:${cell.textAlign};line-height:1.3;">${cell.variable}</td>`;
      } else {
        const imgTag = `<img src="${cell.imageUrl}" width="${cell.width}" height="${cell.height}" alt="${cell.alt}" style="display:block;width:${cell.width}px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;
        const content = cell.link
          ? `<a href="${cell.link}" target="_blank" style="display:block;text-decoration:none;border:0;">${imgTag}</a>`
          : imgTag;
        html += `\n    <td width="${cell.width}" height="${cell.height}" valign="top" style="padding:0;margin:0;border:0;line-height:0;font-size:0;">${content}</td>`;
      }
    }
    html += '\n  </tr>';
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

    // Gera grade de células
    const gridRows = buildGrid(zones, imgWidth, imgHeight);

    // Processa cada célula: crop + upload para o Supabase Storage
    let uploadCount = 0;
    const totalCells = gridRows.reduce((sum, row) => sum + row.length, 0);

    for (const row of gridRows) {
      for (const cell of row) {
        if (cell.type === 'text') {
          cell.imageUrl = null;
          uploadCount++;
          console.log(`Célula ${uploadCount}/${totalCells} é zona de texto — sem upload.`);
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
