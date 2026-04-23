import { useState } from 'react';
import { motion } from 'framer-motion';

const ZONE_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6', '#e11d48', '#84cc16',
];

export default function Step4ZoneReview({ zones, imageUrl, onZonesChange, onNext, onBack }) {
  const [editIndex, setEditIndex] = useState(null);
  const [editValues, setEditValues] = useState({ link: '', alt: '' });

  const startEdit = (i) => {
    setEditIndex(i);
    setEditValues({ link: zones[i].link || '', alt: zones[i].alt || '' });
  };

  const saveEdit = (i) => {
    const updated = zones.map((z, idx) =>
      idx === i ? { ...z, link: editValues.link.trim(), alt: editValues.alt.trim() } : z
    );
    onZonesChange(updated);
    setEditIndex(null);
  };

  const removeZone = (i) => {
    onZonesChange(zones.filter((_, idx) => idx !== i));
  };

  const totalWithLinks = zones.filter((z) => z.link).length;

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Revisão de Zonas</h2>
            <p className="text-slate-400 text-sm mt-1">
              Confira e edite os links de cada zona antes de processar.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={onBack} className="btn-secondary py-2 px-4 text-sm">
              ← Editar canvas
            </button>
            <button
              onClick={onNext}
              disabled={zones.length === 0}
              className="btn-primary py-2 px-5 text-sm"
            >
              Continuar →
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total de zonas', value: zones.length, color: 'text-slate-200' },
            { label: 'Com link', value: totalWithLinks, color: 'text-brand-400' },
            { label: 'Sem link', value: zones.length - totalWithLinks, color: 'text-slate-400' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className={`text-3xl font-bold mb-1 ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Image preview with overlays */}
          <div className="w-64 shrink-0 hidden md:block">
            <div className="card overflow-hidden">
              <div className="relative">
                <img src={imageUrl} alt="Preview" className="w-full" />
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox={`0 0 100 ${(100 * 1) || 100}`}
                  preserveAspectRatio="none"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                >
                  {/* overlays são gerados em porcentagem */}
                </svg>
              </div>
              <div className="p-3 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center">Pré-visualização</p>
              </div>
            </div>
          </div>

          {/* Zone List */}
          <div className="flex-1 min-w-0 space-y-3">
            {zones.length === 0 && (
              <div className="card p-12 text-center">
                <p className="text-slate-500">Nenhuma zona definida. Volte e desenhe sobre a imagem.</p>
              </div>
            )}

            {zones.map((zone, i) => (
              <motion.div
                key={i}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card p-4"
              >
                {editIndex === i ? (
                  /* Edit mode */
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }}
                      />
                      <span className="text-sm font-semibold text-slate-100">Editando Zona {i + 1}</span>
                      <span className="ml-auto text-xs text-slate-500 font-mono">
                        {zone.width} × {zone.height}px @ ({zone.x}, {zone.y})
                      </span>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">URL do link</label>
                        <input
                          autoFocus
                          type="url"
                          value={editValues.link}
                          onChange={(e) => setEditValues((v) => ({ ...v, link: e.target.value }))}
                          placeholder="https://seusite.com/pagina"
                          className="input-field text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">Alt text</label>
                        <input
                          type="text"
                          value={editValues.alt}
                          onChange={(e) => setEditValues((v) => ({ ...v, alt: e.target.value }))}
                          placeholder="Descrição da imagem para acessibilidade"
                          className="input-field text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditIndex(null)}
                        className="btn-secondary py-1.5 px-4 text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => saveEdit(i)}
                        className="btn-primary py-1.5 px-4 text-xs"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View mode */
                  <div className="flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] + '33', color: ZONE_COLORS[i % ZONE_COLORS.length] }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-slate-200">Zona {i + 1}</span>
                        <span className="text-xs text-slate-600 font-mono">
                          {zone.width} × {zone.height}px
                        </span>
                      </div>
                      {zone.link ? (
                        <p className="text-sm text-brand-400 truncate">{zone.link}</p>
                      ) : (
                        <p className="text-sm text-slate-600 italic">Nenhum link definido</p>
                      )}
                      {zone.alt && (
                        <p className="text-xs text-slate-500 truncate">Alt: {zone.alt}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {zone.link ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          com link
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-800 text-slate-500 border border-slate-700 px-2 py-0.5 rounded-full">
                          sem link
                        </span>
                      )}
                      <button
                        onClick={() => startEdit(i)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => removeZone(i)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
