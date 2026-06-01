import { useState } from 'react';
import { motion } from 'framer-motion';

const ZONE_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6', '#e11d48', '#84cc16',
];

export default function Step4ZoneReview({ zones, imageUrl, onZonesChange, onNext, onBack }) {
  const [editIndex, setEditIndex] = useState(null);
  const [editValues, setEditValues] = useState({
    link: '', alt: '',
    variable: '', fontSize: '18', fontColor: '#ffffff',
    textAlign: 'center', fontWeight: 'bold', backgroundColor: 'transparent',
  });

  const startEdit = (i) => {
    setEditIndex(i);
    const z = zones[i];
    setEditValues({
      link: z.link || '',
      alt: z.alt || '',
      variable: z.variable || '{{primeiro_nome}}',
      fontSize: z.fontSize || '18',
      fontColor: z.fontColor || '#ffffff',
      textAlign: z.textAlign || 'center',
      fontWeight: z.fontWeight || 'bold',
      backgroundColor: z.backgroundColor || 'transparent',
    });
  };

  const saveEdit = (i) => {
    const z = zones[i];
    const updated = zones.map((zone, idx) =>
      idx === i
        ? z.type === 'text'
          ? { ...zone, variable: editValues.variable, fontSize: editValues.fontSize, fontColor: editValues.fontColor, textAlign: editValues.textAlign, fontWeight: editValues.fontWeight, backgroundColor: editValues.backgroundColor }
          : { ...zone, link: editValues.link.trim(), alt: editValues.alt.trim() }
        : zone
    );
    onZonesChange(updated);
    setEditIndex(null);
  };

  const removeZone = (i) => {
    onZonesChange(zones.filter((_, idx) => idx !== i));
  };

  const totalWithLinks = zones.filter((z) => z.type !== 'text' && z.link).length;
  const totalText = zones.filter((z) => z.type === 'text').length;

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
            { label: 'Texto/personaliz.', value: totalText, color: 'text-amber-400' },
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
                      {zone.type === 'text' ? (
                        <>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Variável de personalização</label>
                            <input
                              autoFocus
                              type="text"
                              value={editValues.variable}
                              onChange={(e) => setEditValues((v) => ({ ...v, variable: e.target.value }))}
                              placeholder="{{primeiro_nome}}"
                              className="input-field text-sm font-mono"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Tamanho (px)</label>
                              <input type="number" value={editValues.fontSize} min="10" max="72"
                                onChange={(e) => setEditValues((v) => ({ ...v, fontSize: e.target.value }))}
                                className="input-field text-sm w-full" />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Cor do texto</label>
                              <div className="flex items-center gap-2">
                                <input type="color" value={editValues.fontColor}
                                  onChange={(e) => setEditValues((v) => ({ ...v, fontColor: e.target.value }))}
                                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                                <span className="text-xs text-slate-400 font-mono">{editValues.fontColor}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-end gap-3">
                            <div className="flex-1">
                              <label className="text-xs text-slate-400 mb-1 block">Alinhamento</label>
                              <div className="flex rounded-lg bg-slate-800 p-0.5">
                                {[['left','←'],['center','≡'],['right','→']].map(([val, icon]) => (
                                  <button key={val} type="button"
                                    onClick={() => setEditValues((v) => ({ ...v, textAlign: val }))}
                                    className={`flex-1 py-1.5 rounded text-xs font-medium transition-all ${editValues.textAlign === val ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Negrito</label>
                              <button type="button"
                                onClick={() => setEditValues((v) => ({ ...v, fontWeight: v.fontWeight === 'bold' ? 'normal' : 'bold' }))}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editValues.fontWeight === 'bold' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                B
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Cor de fundo</label>
                            <div className="flex items-center gap-2">
                              <input type="color"
                                value={editValues.backgroundColor === 'transparent' ? '#1e293b' : editValues.backgroundColor}
                                onChange={(e) => setEditValues((v) => ({ ...v, backgroundColor: e.target.value }))}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                              <button type="button"
                                onClick={() => setEditValues((v) => ({ ...v, backgroundColor: 'transparent' }))}
                                className={`text-xs px-2 py-1 rounded transition-all ${editValues.backgroundColor === 'transparent' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                                Transparente
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">URL do link</label>
