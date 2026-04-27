const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'email-assets';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase não configurado. Verifique SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Envia um buffer de imagem para o Supabase Storage
 * @param {Buffer} buffer - Buffer da imagem
 * @param {string} folder - Pasta de destino no Storage
 * @returns {Promise<Object>} Resultado com URL pública
 */
async function uploadBuffer(buffer, folder = 'slicermail-pro') {
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType: 'image/png',
      upsert: false,
      cacheControl: '31536000',
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    secure_url: publicUrlData.publicUrl,
    publicUrl: publicUrlData.publicUrl,
  };
}

module.exports = {
  supabase,
  uploadBuffer,
};
