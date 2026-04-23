require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sliceRouter = require('./routes/slice');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — aceita localhost em dev e a URL do Vercel em produção
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL, // ex: https://slicermail.vercel.app
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: Postman, curl)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origem não permitida: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json());

// Multer: armazena imagem em memória (RAM) para processamento com Sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato não suportado. Use JPG, PNG, WEBP ou GIF.'));
    }
  },
});

// Rotas
app.use('/api/slice', upload.single('image'), sliceRouter);

// Health check
app.get('/api/health', (req, res) => {
  const configured =
    process.env.CLOUDINARY_CLOUD_NAME !== 'seu_cloud_name_aqui' &&
    !!process.env.CLOUDINARY_CLOUD_NAME;

  res.json({
    status: 'online',
    cloudinary: configured ? 'configurado' : 'aguardando configuração',
    version: '1.0.0',
  });
});

// Erro de multer
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`\n🚀 SlicerMail Pro Server rodando em http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
});
