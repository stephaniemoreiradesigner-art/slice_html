const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const { uploadBuffer } = require('../config/cloudinary');

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
        link: zone ? zone.link || null : null,
        alt: zone ? zone.alt || '' : '',
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
<table width="${totalWidth}" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;">`;

  for (const row of gridRows) {
    html += '\n  <tr>';
    for (const cell of row) {
      const imgTag = `<img src="${cell.cloudinaryUrl}" width="${cell.width}" height="${cell.height}" alt="${cell.alt}" style="display:block;width:${cell.width}px;height:auto;border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;" />`;

      const content = cell.link
        ? `<a href="${cell.link}" target="_blank" style="display:block;text-decoration:none;border:0;">${imgTag}</a>`
        : imgTag;

      html += `\n    <td width="${cell.width}" height="${cell.height}" valign="top" style="padding:0;margin:0;border:0;line-height:0;font-size:0;">${content}</td>`;
    }
    html += '\n  </tr>';
  }

  html += '\n</table>';
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

    // Processa cada célula: crop + upload para Cloudinary
    let uploadCount = 0;
    const totalCells = gridRows.reduce((sum, row) => sum + row.length, 0);

    for (const row of gridRows) {
      for (const cell of row) {
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
        cell.cloudinaryUrl = uploadResult.secure_url;
        uploadCount++;
        console.log(`Célula ${uploadCount}/${totalCells} enviada para Cloudinary.`);
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
