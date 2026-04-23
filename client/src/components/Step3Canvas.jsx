import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ZONE_COLORS = [
  '#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ec4899',
  '#8b5cf6', '#f97316', '#14b8a6', '#e11d48', '#84cc16',
];

const MAX_CANVAS_WIDTH = 860;
const MAX_CANVAS_HEIGHT = 560;

export default function Step3Canvas({ imageFile, imageUrl, imageDimensions, initialZones, onDone, onBack }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const isDrawingRef = useRef(true); // começa true pois drawMode inicia como true
  const startPosRef = useRef({ x: 0, y: 0 });
  const currentRectRef = useRef(null);
  const scaleRef = useRef(1);
  const containerRef = useRef(null);

  const [zones, setZones] = useState(initialZones || []);
  const [pendingZone, setPendingZone] = useState(null);   // rect aguardando link input
  const [linkInput, setLinkInput] = useState('');
  const [altInput, setAltInput] = useState('');
  const [drawMode, setDrawMode] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);
  const [linkInputPos, setLinkInputPos] = useState({ x: 0, y: 0 });

  // Inicializa Fabric.js
  useEffect(() => {
    let canvas;

    const init = async () => {
      const { fabric } = await import('fabric');

      const scale = Math.min(
        MAX_CANVAS_WIDTH / imageDimensions.width,
        MAX_CANVAS_HEIGHT / imageDimensions.height,
        1
      );
      scaleRef.current = scale;

      const cw = Math.round(imageDimensions.width * scale);
      const ch = Math.round(imageDimensions.height * scale);

      canvas = new fabric.Canvas(canvasRef.current, {
        width: cw,
        height: ch,
        selection: false,
        renderOnAddRemove: true,
      });

      fabricRef.current = canvas;

      // Carrega imagem de fundo
      fabric.Image.fromURL(
        imageUrl,
        (img) => {
          img.scaleToWidth(cw);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          setCanvasReady(true);
        },
        { crossOrigin: 'anonymous' }
      );

      // Redraw zones já existentes
      initialZones?.forEach((z, i) => {
        drawZoneRect(fabric, canvas, z, i, scale);
      });

      // Mouse events para desenho
      canvas.on('mouse:down', (opt) => {
        if (!isDrawingRef.current) return;
        const pointer = canvas.getPointer(opt.e);
        startPosRef.current = { x: pointer.x, y: pointer.y };

        const rect = new fabric.Rect({
          left: pointer.x,
          top: pointer.y,
          width: 1,
          height: 1,
          fill: 'rgba(99,102,241,0.15)',
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeDashArray: [6, 3],
          selectable: false,
          evented: false,
          _isDrawing: true,
        });

        currentRectRef.current = rect;
        canvas.add(rect);
      });

      canvas.on('mouse:move', (opt) => {
        if (!currentRectRef.current) return;
        const pointer = canvas.getPointer(opt.e);
        const start = startPosRef.current;
        const rect = currentRectRef.current;

        const w = pointer.x - start.x;
        const h = pointer.y - start.y;

        if (w < 0) {
          rect.set({ left: pointer.x, width: Math.abs(w) });
        } else {
          rect.set({ width: w });
        }
        if (h < 0) {
          rect.set({ top: pointer.y, height: Math.abs(h) });
        } else {
          rect.set({ height: h });
        }
        canvas.renderAll();
      });

      canvas.on('mouse:up', (opt) => {
        const rect = currentRectRef.current;
        if (!rect) return;

        const w = rect.width || 0;
        const h = rect.height || 0;

        if (w < 15 || h < 15) {
          canvas.remove(rect);
          currentRectRef.current = null;
          return;
        }

        // Congela o retângulo de preview
        rect.set({ strokeDashArray: [] });
        canvas.renderAll();
        currentRectRef.current = null;

        const scale = scaleRef.current;
        const newZone = {
          x: Math.round(rect.left / scale),
          y: Math.round(rect.top / scale),
          width: Math.round(rect.width / scale),
          height: Math.round(rect.height / scale),
          link: '',
          alt: '',
          _fabricRect: rect,
        };

        // Posição do painel de link (relativo ao canvas container)
        const canvasEl = canvas.getElement();
        const canvasRect = canvasEl.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };

        const panelX = Math.min(rect.left + rect.width + 10, (rect.left / scale) < imageDimensions.width * 0.7 ? rect.left + rect.width + 10 : rect.left - 300);
        const panelY = rect.top;
        setLinkInputPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height });

        setLinkInput('');
        setAltInput('');
        setPendingZone(newZone);
      });
    };

    init();

    return () => {
      if (fabricRef.current) {
        fabricRef.current.dispose();
        fabricRef.current = null;
      }
    };
  }, [imageUrl, imageDimensions]);

  // Sync drawMode com o cursor do canvas
  useEffect(() => {
    // isDrawingRef atualiza sempre, independente do canvas estar pronto
    isDrawingRef.current = drawMode;
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.defaultCursor = drawMode ? 'crosshair' : 'default';
    canvas.hoverCursor = drawMode ? 'crosshair' : 'default';
  }, [drawMode]);

  function drawZoneRect(fabric, canvas, zone, index, scale) {
    const s = scale || scaleRef.current;
    const color = ZONE_COLORS[index % ZONE_COLORS.length];

    const rect = new fabric.Rect({
      left: zone.x * s,
      top: zone.y * s,
      width: zone.width * s,
      height: zone.height * s,
      fill: `${color}22`,
      stroke: color,
      strokeWidth: 2,
      selectable: false,
      evented: false,
    });

    const label = new fabric.Text(`${index + 1}`, {
      left: zone.x * s + 6,
      top: zone.y * s + 4,
      fontSize: 14,
      fontWeight: 'bold',
      fill: color,
      selectable: false,
      evented: false,
    });

    canvas.add(rect, label);
    return { rect, label };
  }

  const confirmLink = useCallback(() => {
    if (!pendingZone) return;
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove o retângulo de preview (sem cor/label definitivo)
    canvas.remove(pendingZone._fabricRect);

    const { fabric } = window.__fabric__ || {};
    const newIndex = zones.length;
    const color = ZONE_COLORS[newIndex % ZONE_COLORS.length];
    const s = scaleRef.current;

    // Importa fabric novamente (já carregado)
    import('fabric').then(({ fabric: fab }) => {
      const rect = new fab.Rect({
        left: pendingZone.x * s,
        top: pendingZone.y * s,
        width: pendingZone.width * s,
        height: pendingZone.height * s,
        fill: `${color}22`,
        stroke: color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      const label = new fab.Text(`${newIndex + 1}`, {
        left: pendingZone.x * s + 6,
        top: pendingZone.y * s + 4,
        fontSize: 14,
        fontWeight: 'bold',
        fill: color,
        selectable: false,
        evented: false,
      });

      canvas.add(rect, label);
      canvas.renderAll();
    });

    const confirmedZone = {
      x: pendingZone.x,
      y: pendingZone.y,
      width: pendingZone.width,
      height: pendingZone.height,
      link: linkInput.trim(),
      alt: altInput.trim(),
    };

    setZones((prev) => [...prev, confirmedZone]);
    setPendingZone(null);
    setLinkInput('');
    setAltInput('');
  }, [pendingZone, zones, linkInput, altInput]);

  const cancelLink = useCallback(() => {
    if (pendingZone && fabricRef.current) {
      fabricRef.current.remove(pendingZone._fabricRect);
      fabricRef.current.renderAll();
    }
    setPendingZone(null);
    setLinkInput('');
    setAltInput('');
  }, [pendingZone]);

  const removeZone = (index) => {
    setZones((prev) => prev.filter((_, i) => i !== index));
    // Redesenha o canvas do zero com as zonas restantes
    redrawCanvas(zones.filter((_, i) => i !== index));
  };

  const redrawCanvas = async (newZones) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    const { fabric } = await import('fabric');
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        img.scaleToWidth(canvas.width);
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        newZones.forEach((z, i) => drawZoneRect(fabric, canvas, z, i, scaleRef.current));
        canvas.renderAll();
      },
      { crossOrigin: 'anonymous' }
    );
  };

  const handleDone = () => {
    if (zones.length === 0) return;
    onDone(zones);
  };

  return (
    <div className="flex flex-col min-h-full px-4 py-6">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Editor de Zonas</h2>
            <p className="text-slate-400 text-sm mt-1">
              Clique e arraste para desenhar áreas clicáveis sobre a imagem.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={onBack} className="btn-secondary py-2 px-4 text-sm">
              ← Voltar
            </button>
            <button
              onClick={handleDone}
              disabled={zones.length === 0}
              className="btn-primary py-2 px-5 text-sm"
            >
              Continuar ({zones.length} zona{zones.length !== 1 ? 's' : ''}) →
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Canvas Area */}
          <div className="flex-1 min-w-0 relative">
            {/* Toolbar */}
            <div className="card p-3 mb-3 flex items-center gap-3">
              <button
                onClick={() => setDrawMode(true)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  drawMode
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Desenhar zona
              </button>
              <span className="text-slate-600 text-xs">
                {drawMode ? 'Clique e arraste para criar uma área' : 'Modo de visualização'}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-slate-500">Zoom: 1:1</span>
              </div>
            </div>

            {/* Canvas — sem overflow-hidden para o popup não ser cortado */}
            <div
              ref={containerRef}
              className="relative card"
              style={{ display: 'inline-block', maxWidth: '100%' }}
            >
              {!canvasReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10 rounded-2xl">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <canvas ref={canvasRef} className="rounded-2xl" />
            </div>

            {/* Floating Link Input Panel — fora do card para não ser cortado */}
            <AnimatePresence>
              {pendingZone && (() => {
                const cw = fabricRef.current?.width || 600;
                const ch = fabricRef.current?.height || 500;
                const s = scaleRef.current;
                const rectLeft = pendingZone.x * s;
                const rectTop = pendingZone.y * s;
                const rectRight = rectLeft + pendingZone.width * s;
                const rectBottom = rectTop + pendingZone.height * s;
                const PANEL_W = 288; // w-72
                const PANEL_H = 220;
                const TOOLBAR_H = 60; // altura da toolbar + mb

                // Horizontal: preferir à direita, senão à esquerda
                let left = rectRight + 8;
                if (left + PANEL_W > cw) left = Math.max(0, rectLeft - PANEL_W - 8);

                // Vertical: preferir abaixo, senão acima
                let top = rectBottom + TOOLBAR_H + 8;
                if (rectBottom + TOOLBAR_H + PANEL_H + 8 > ch + TOOLBAR_H + 80) {
                  top = Math.max(TOOLBAR_H, rectTop + TOOLBAR_H - PANEL_H - 8);
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 w-72"
                    style={{ left, top }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                      <p className="text-sm font-semibold text-slate-100">Zona {zones.length + 1}</p>
                      <span className="ml-auto text-xs text-slate-500">
                        {pendingZone.width} × {pendingZone.height}px
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          URL do link <span className="text-slate-600">(opcional)</span>
                        </label>
                        <input
                          autoFocus
                          type="url"
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmLink();
                            if (e.key === 'Escape') cancelLink();
                          }}
                          placeholder="https://seusite.com/pagina"
                          className="input-field text-sm py-2"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">
                          Alt text <span className="text-slate-600">(acessibilidade)</span>
                        </label>
                        <input
                          type="text"
                          value={altInput}
                          onChange={(e) => setAltInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmLink();
                            if (e.key === 'Escape') cancelLink();
                          }}
                          placeholder="Descrição da imagem"
                          className="input-field text-sm py-2"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={cancelLink}
                        className="flex-1 py-1.5 px-3 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={confirmLink}
                        className="flex-1 py-1.5 px-3 text-xs rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium transition-colors"
                      >
                        Confirmar ✓
                      </button>
                    </div>
                    <p className="text-center text-xs text-slate-600 mt-2">Enter confirma · Esc cancela</p>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>

          {/* Zones Sidebar */}
          <div className="w-64 shrink-0">
            <div className="card p-4 h-full">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                Zonas desenhadas
                <span className="ml-2 bg-brand-500/20 text-brand-400 text-xs px-1.5 py-0.5 rounded-full">
                  {zones.length}
                </span>
              </h3>

              {zones.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p className="text-xs text-slate-500">Nenhuma zona ainda.<br />Desenhe sobre a imagem.</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-96">
                  {zones.map((z, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-800/50 rounded-lg p-3 border border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }}
                          />
                          <span className="text-xs font-semibold text-slate-200">Zona {i + 1}</span>
                        </div>
                        <button
                          onClick={() => removeZone(i)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {z.width} × {z.height}px
                      </p>
                      {z.link ? (
                        <p className="text-xs text-brand-400 truncate mt-0.5">{z.link}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic mt-0.5">sem link</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
