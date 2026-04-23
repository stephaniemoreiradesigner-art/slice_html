import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';

const ACCEPTED_TYPES = { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/gif': [] };

export default function Step2Upload({ onUploaded }) {
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingDims, setPendingDims] = useState(null);

  const handleFile = useCallback((file) => {
    setError('');
    if (file.size > 20 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 20MB.');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPendingDims({ width: img.naturalWidth, height: img.naturalHeight });
      setPreview(url);
      setPendingFile(file);
    };
    img.src = url;
  }, []);

  const onDrop = useCallback(
    (accepted, rejected) => {
      if (rejected.length) {
        setError('Formato não suportado. Use JPG, PNG, WEBP ou GIF.');
        return;
      }
      if (accepted.length) handleFile(accepted[0]);
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple: false,
    maxSize: 20 * 1024 * 1024,
  });

  const confirm = () => {
    if (pendingFile && pendingDims) {
      onUploaded(pendingFile, preview, pendingDims);
    }
  };

  const reset = () => {
    setPreview(null);
    setPendingFile(null);
    setPendingDims(null);
    setError('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <h2 className="text-3xl font-bold text-white mb-2 text-center">Faça o upload da imagem</h2>
        <p className="text-slate-400 text-center mb-8">
          Arraste ou clique para selecionar. Formatos: JPG, PNG, WEBP · Máx. 20MB
        </p>

        {!preview ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? 'border-brand-500 bg-brand-500/5 scale-[1.02]'
                : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
            }`}
          >
            <input {...getInputProps()} />
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-colors ${
                isDragActive ? 'bg-brand-500/20' : 'bg-slate-800'
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${isDragActive ? 'text-brand-400' : 'text-slate-500'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            {isDragActive ? (
              <p className="text-brand-400 font-semibold text-lg">Solte a imagem aqui!</p>
            ) : (
              <>
                <p className="text-slate-200 font-semibold text-lg mb-1">Arraste a imagem ou clique para selecionar</p>
                <p className="text-slate-500 text-sm">JPG, PNG, WEBP ou GIF até 20MB</p>
              </>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="relative bg-slate-950/50 flex items-center justify-center" style={{ maxHeight: 400 }}>
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-96 object-contain"
              />
            </div>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="text-sm text-slate-400">
                <span className="text-slate-200 font-medium">{pendingFile?.name}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span>{pendingDims?.width} × {pendingDims?.height}px</span>
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="btn-secondary py-2 px-4 text-sm">
                  Trocar
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirm}
                  className="btn-primary py-2 px-5 text-sm"
                >
                  Usar esta imagem →
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
