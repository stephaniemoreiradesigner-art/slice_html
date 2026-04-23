import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STAGES = [
  { id: 'upload', label: 'Enviando imagem ao servidor...', icon: '📤' },
  { id: 'slice', label: 'Calculando grade de fatiamento...', icon: '📐' },
  { id: 'crop', label: 'Cortando as fatias com Sharp...', icon: '✂️' },
  { id: 'cloud', label: 'Enviando fatias ao Cloudinary...', icon: '☁️' },
  { id: 'html', label: 'Gerando código HTML...', icon: '💻' },
  { id: 'done', label: 'Processamento concluído!', icon: '✅' },
];

export default function Step6Processing({ imageFile, zones, settings, onDone, onError }) {
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const process = async () => {
      try {
        // Anima os estágios visuais enquanto aguarda o backend
        const stageInterval = setInterval(() => {
          setCurrentStage((prev) => {
            const next = Math.min(prev + 1, STAGES.length - 2);
            setProgress(Math.round((next / (STAGES.length - 1)) * 90));
            return next;
          });
        }, 1200);

        const formData = new FormData();
        formData.append('image', imageFile);

        const zonesWithAlt = zones.map((z) => ({
          ...z,
          alt: z.alt || settings?.altText || '',
        }));
        formData.append('zones', JSON.stringify(zonesWithAlt));

        // Em produção usa a URL do Railway; em dev usa o proxy do Vite
        const apiBase = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiBase}/api/slice`, {
          method: 'POST',
          body: formData,
        });

        clearInterval(stageInterval);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Erro do servidor: ${response.status}`);
        }

        const data = await response.json();

        if (cancelled) return;

        setCurrentStage(STAGES.length - 1);
        setProgress(100);

        setTimeout(() => {
          if (!cancelled) onDone(data.html);
        }, 800);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    };

    process();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full card p-8 text-center border-red-500/20"
        >
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-red-400 mb-2">Erro no processamento</h3>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <div className="text-xs text-slate-500 bg-slate-800 rounded-lg p-3 mb-6 text-left font-mono">
            <p className="text-slate-400 mb-1">Verifique:</p>
            <p>• Servidor rodando em localhost:3001</p>
            <p>• Chaves do Cloudinary no .env</p>
            <p>• Conexão com a internet</p>
          </div>
          <button onClick={onError} className="btn-secondary py-2 px-6 text-sm">
            ← Voltar e tentar novamente
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <div className="max-w-md w-full text-center">
        {/* Animated Logo */}
        <motion.div
          className="relative w-24 h-24 mx-auto mb-8"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500" style={{ animation: 'spin 1s linear infinite' }} />
          <div className="absolute inset-3 rounded-full bg-brand-500/10 flex items-center justify-center">
            <span className="text-2xl">{STAGES[currentStage]?.icon}</span>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white mb-2">Processando...</h2>
        <p className="text-slate-400 text-sm mb-8">
          Aguarde enquanto sua imagem é fatiada e enviada para a nuvem.
        </p>

        {/* Progress Bar */}
        <div className="bg-slate-800 rounded-full h-2 mb-6 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Stages */}
        <div className="space-y-2 text-left">
          {STAGES.map((stage, i) => (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: i <= currentStage ? 1 : 0.3,
                x: 0,
              }}
              className="flex items-center gap-3 py-1"
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  i < currentStage
                    ? 'bg-emerald-500'
                    : i === currentStage
                    ? 'bg-brand-500'
                    : 'bg-slate-800'
                }`}
              >
                {i < currentStage ? (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : i === currentStage ? (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  i === currentStage ? 'text-slate-100 font-medium' : i < currentStage ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {stage.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
