import { motion } from 'framer-motion';

const ZONE_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6', '#e11d48', '#84cc16',
];

export default function Step5Settings({ settings, zones, imageUrl, imageDimensions, onSettingsChange, onNext, onBack }) {
  const totalWithLinks = zones.filter((z) => z.link).length;

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Confirmação Final</h2>
            <p className="text-slate-400 text-sm mt-1">
              Revise as configurações antes de processar a imagem.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={onBack} className="btn-secondary py-2 px-4 text-sm">
              ← Voltar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="btn-primary py-2 px-6 text-sm shadow-lg shadow-brand-500/20"
            >
              Processar imagem →
            </motion.button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Summary */}
          <div className="space-y-4">
            {/* Image Info */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 bg-brand-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                  </svg>
                </div>
                Imagem
              </h3>
              <div className="flex gap-3">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-20 h-16 object-cover rounded-lg border border-slate-700"
                />
                <div className="text-sm space-y-1">
                  <div className="text-slate-400">
                    Dimensões: <span className="text-slate-200 font-medium">{imageDimensions.width} × {imageDimensions.height}px</span>
                  </div>
                  <div className="text-slate-400">
                    Zonas: <span className="text-slate-200 font-medium">{zones.length}</span>
                  </div>
                  <div className="text-slate-400">
                    Com links: <span className="text-brand-400 font-medium">{totalWithLinks}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Zones Summary */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Zonas</h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {zones.map((zone, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-800 last:border-0">
                    <div
                      className="w-4 h-4 rounded shrink-0"
                      style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] + '44', border: `2px solid ${ZONE_COLORS[i % ZONE_COLORS.length]}` }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 font-medium">Zona {i + 1} — {zone.width}×{zone.height}px</p>
                      {zone.link ? (
                        <p className="text-xs text-brand-400 truncate">{zone.link}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">sem link (imagem estática)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Process Info */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                <div className="w-5 h-5 bg-brand-500/20 rounded-md flex items-center justify-center">
                  <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                O que vai acontecer
              </h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'A imagem será fatiada em células baseadas nas suas zonas', icon: '✂️' },
                  { step: '2', text: 'Cada fatia será enviada ao Cloudinary automaticamente', icon: '☁️' },
                  { step: '3', text: 'Um HTML com tabelas será gerado, compatível com Outlook', icon: '📧' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center text-xs font-bold text-brand-400 shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <p className="text-sm text-slate-400">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* HTML Rules */}
            <div className="card p-5 border-brand-500/20">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Regras do HTML gerado</h3>
              <div className="space-y-2">
                {[
                  'border="0" cellpadding="0" cellspacing="0"',
                  'display:block; nas imagens (padrão Outlook)',
                  'width em pixels absolutos por célula',
                  'Links com target="_blank"',
                ].map((rule) => (
                  <div key={rule} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    <code className="text-xs text-slate-400">{rule}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
