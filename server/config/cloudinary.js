const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Envia um buffer de imagem para o Cloudinary
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} folder - Pasta de destino no Cloudinary
 * @returns {Promise<Object>} Resultado do upload
 */
const uploadBuffer = (buffer, folder = 'slicermail-pro') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        format: 'png',
        quality: 'auto:best',
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

module.exports = { cloudinary, uploadBuffer };
