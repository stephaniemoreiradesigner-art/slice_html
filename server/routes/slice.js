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

// Abaixo do qual o desvio-padrão médio dos canais RGB é considerado "cor
// lisa/uniforme" (região sem detalhe visual real, só preenchimento).
const FLAT_STDEV_THRESHOLD = 6;

/**
 * Analisa uma região e devolve a cor dominante + se ela é "lisa"
 * (uniforme o suficiente para não precisar virar um <img> de verdade).
 *
 * Motivação: fatias muito estreitas (colunas de margem/enquadramento ao
 * lado de botões e textos) tendem a ser só preenchimento de cor sólida.
 * Nos testes em campo, exatamente essas fatias finas e uniformes vinham
 * aparecendo como caixas brancas no Gmail mobile — a imagem falha ao
 * carregar (provavelmente o proxy de imagens trata PNGs muito pequenos/
 * uniformes de forma inconsistente) mesmo com o bgcolor de segurança no
 * <td>. Em vez de tentar mascarar a falha, a fatia lisa deixa de ser uma
 * imagem: vira uma célula de cor sólida, sem nenhuma dependência de rede,
 * com a mesma largura/altura exatas — o layout não muda em nada.
 */
async function analyzeRegion(inputBuffer, region) {
  try {
    const stats = await sharp(inputBuffer)
      .extract({ left: region.x, top: region.y, width: region.width, height: region.height })
      .stats();
    const { r, g, b } = stats.dominant;
    const hex = (n) => n.toString(16).padStart(2, '0');
    const avgStdev =
      (stats.channels[0].stdev + stats.channels[1].stdev + stats.channels[2].stdev) / 3;
    return {
      color: `#${hex(r)}${hex(g)}${hex(b)}`,
      isFlat: avgStdev < FLAT_STDEV_THRESHOLD,
    };
  } catch {
    return { color: '#000000', isFlat: false };
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
        // bgcolor de segurança: em navegadores/clientes que arredondam
        // pixels de forma independente por célula (Chrome/Gmail em zoom
        // ou telas HiDPI), pode sobrar um hairline de até 1px entre
        // colunas adjacentes. Preenchendo o <td> com a cor dominante da
        // fatia, esse gap fica invisível em vez de aparecer branco.
        //
        // IMPORTANTE: o background-color também precisa ir na própria tag
        // <img>, não só no <td>. Quando a imagem falha de verdade (em vez
        // de só demorar) em alguns webviews — inclusive o do Gmail para
        // Android — a caixa do <img> quebrado é pintada de branco por
        // cima, escondendo o fundo do <td> que está atrás dela. Sem o
        // background-color na própria <img>, a "caixa branca" reaparece
        // mesmo com o <td> corrigido.
        const bg = cell.backgroundColor || '#000000';

        // Fatia lisa (cor uniforme, sem link): nem tenta virar <img>.
        // Sem upload, sem URL externa, sem chance de "falhar ao carregar" —
        // é só um <td> da cor certa, com a mesma largura/altura de sempre.
        //
        // IMPORTANTE: como não há mais <img> pra forçar a altura da célula,
        // não dá pra confiar só no atributo HTML `height` (clientes como o
        // Gmail nem sempre respeitam esse atributo legado sem reforço via
        // CSS) nem no `&nbsp;` com font-size:0 (o texto zerado pode colapsar
        // a altura da linha a zero). Por isso a altura também vai explícita
        // no `style` (height + line-height iguais à altura da célula), com
        // o `&nbsp;` num font-size mínimo em vez de zerado.
        if (cell.isFlat) {
          html += `\n          <td width="${cell.width}" height="${cell.height}" valign="top" bgcolor="${bg}" style="padding:0;margin:0;border:0;width:${cell.width}px;height:${cell.height}px;line-height:${cell.height}px;font-size:1px;mso-line-height-rule:exactly;background-color:${bg};">&nbsp;</td>`;
          continue;
        }

        const imgTag = `<img src="${cell.imageUrl}" width="${cell.width}" height="${cell.height}" alt="${cell.alt}" style="display:block;width:${cell.width}px;height:${cell.height}px;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;background-color:${bg};" />`;
        const content = cell.link
          ? `<a href="${cell.link}" target="_blank" style="display:block;text-decoration:none;border:0;">${imgTag}</a>`
          : imgTag;
        html += `\n          <td width="${cell.width}" height="${cell.height}" valign="top" bgcolor="${bg}" style="padding:0;margin:0;border:0;line-height:0;font-size:0;background-color:${bg};">${content}</td>`;
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
        // Analisa a região ANTES de decidir se vale a pena virar upload:
        // fatia lisa (sem link) não precisa de imagem nenhuma.
        const { color, isFlat } = await analyzeRegion(inputBuffer, cell);
        cell.backgroundColor = color;

        // Reforço empírico: em campo, TODA coluna que quebrou no Gmail
        // mobile tinha ≤97px de largura (49, 50, 63, 90, 91, 97) — mesmo
        // quando o desvio-padrão de cor não era baixo o bastante pra ser
        // pega pelo critério de "lisa" (textura/vinheta sutil no fundo
        // escuro). Nenhuma coluna ≥114px jamais quebrou. Por segurança,
        // qualquer coluna de margem sem link e com até 100px de largura
        // também vira <td> de cor sólida, independente da variação de cor.
        const NARROW_WIDTH_THRESHOLD = 100;
        const treatAsFlat = isFlat || cell.width <= NARROW_WIDTH_THRESHOLD;

        if (treatAsFlat && !cell.link) {
          cell.imageUrl = null;
          cell.isFlat = true;
          uploadCount++;
          const motivo = isFlat ? 'região lisa' : `largura ${cell.width}px ≤ ${NARROW_WIDTH_THRESHOLD}px`;
          console.log(`Célula ${uploadCount}/${totalCells} é ${motivo} (${color}) — vira <td> de cor sólida, sem upload.`);
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
