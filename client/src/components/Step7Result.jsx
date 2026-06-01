import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const AC_TAGS = [
  // ActiveCampaign
  '%FIRSTNAME%', '%LASTNAME%', '%EMAIL%', '%PHONE%', '%ORGNAME%',
  // Mailchimp
  '*|FNAME|*', '*|LNAME|*', '*|EMAIL|*', '*|COMPANY|*',
  // RD Station
  '*|PRIMEIRO_NOME|*', '*|NOME|*', '*|EMPRESA|*',
];

const API_URL = import.meta.env.VITE_API_URL || '';

export default function Step7Result({ html: initialHtml, settings, onHtmlChange, onNext, onBack }) {
  const [currentHtml, setCurrentHtml] = useState(initialHtml);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'preview'

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // [{role, content}] for API
  const [chatMessages, setChatMessages] = useState([]); // [{from, text, pendingHtml}] for UI
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    setCurrentHtml(initialHtml);
  }, [initialHtml]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;

    setChatInput('');
    setChatMessages((prev) => [...prev, { from: 'user', text: msg }]);
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: currentHtml,
          message: msg,
          history: chatHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

      setChatMessages((prev) => [
        ...prev,
        { from: 'ai', text: data.text, pendingHtml: data.html },
      ]);
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: `HTML atual:\n${currentHtml}\n\nPedido: ${msg}` },
        { role: 'assistant', content: data.text },
      ]);
    } catch (err) {
      setChatMessages((prev) => [...prev, { from: 'error', text: err.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const applyHtmlChange = (newHtml) => {
    setCurrentHtml(newHtml);
    onHtmlChange?.(newHtml);
    setChatMessages((prev) =>
      prev.map((m) => (m.pendingHtml === newHtml ? { ...m, pendingHtml: null, applied: true } : m))
    );
  };

  const headerHtml = settings?.headerHtml?.trim() || '';
  const footerHtml = settings?.footerHtml?.trim() || '';
  const finalHtml = [headerHtml, currentHtml, footerHtml].filter(Boolean).join('\n');

  // Preview substitui variáveis por dados de exemplo para visualização real
  const previewHtml = finalHtml
    .replace(/%FIRSTNAME%/g, 'João')
    .replace(/%LASTNAME%/g, 'Silva')
    .replace(/%EMAIL%/g, 'joao@exemplo.com')
    .replace(/%PHONE%/g, '(11) 99999-9999')
    .replace(/%ORGNAME%/g, 'Empresa Exemplo')
    .replace(/\*\|FNAME\|\*/g, 'João')
    .replace(/\*\|LNAME\|\*/g, 'Silva')
    .replace(/\*\|EMAIL\|\*/g, 'joao@exemplo.com')
    .replace(/\*\|COMPANY\|\*/g, 'Empresa Exemplo')
    .replace(/\*\|PRIMEIRO_NOME\|\*/g, 'João')
    .replace(/\*\|NOME\|\*/g, 'João Silva')
    .replace(/\*\|EMPRESA\|\*/g, 'Empresa Exemplo');

  const hasLayout = headerHtml || footerHtml;
  const tagsUsed = AC_TAGS.filter((t) => finalHtml.includes(t));

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(finalHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = finalHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const lineCount = finalHtml.split('\n').length;
  const charCount = finalHtml.length;

  return (
    <div className="flex flex-col min-h-full px-6 py-8">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Código HTML Gerado</h2>
            <p className="text-slate-400 text-sm mt-1">
              Pronto para colar no ActiveCampaign, Mailchimp ou qualquer editor de email.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={onBack} className="btn-secondary py-2 px-4 text-sm">
              ← Ajustar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNext}
              className="btn-primary py-2 px-6 text-sm"
            >
              Concluir ✓
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-4">
          {[
            { label: 'Linhas', value: lineCount },
            { label: 'Caracteres', value: charCount.toLocaleString('pt-BR') },
            { label: 'Compatibilidade', value: 'Outlook + AC' },
          ].map((s) => (
            <div key={s.label} className="card px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-sm font-bold text-slate-100">{s.value}</span>
              <span className="text-xs text-slate-500">{s.label}</span>
            </div>
          ))}
          {hasLayout && (
            <div className="card px-4 py-2.5 flex items-center gap-2 border-brand-500/30">
              <svg className="w-3.5 h-3.5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span className="text-xs text-brand-400 font-medium">Layout personalizado</span>
            </div>
          )}
          {tagsUsed.length > 0 && (
            <div className="card px-4 py-2.5 flex items-center gap-2 border-emerald-500/20">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-emerald-400 font-medium">{tagsUsed.length} tag{tagsUsed.length > 1 ? 's' : ''} de personalização</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="inline-flex gap-1 mb-3 bg-slate-900 rounded-xl p-1 border border-slate-800">
          {[
            { id: 'code', label: 'Código HTML' },
            { id: 'preview', label: 'Pré-visualização' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Code Editor */}
        <div className="card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-xs text-slate-500 ml-2">email-template.html</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-brand-500 hover:bg-brand-600 text-white'
              }`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Copiado!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copiar código
                </>
              )}
            </motion.button>
          </div>

          {activeTab === 'code' ? (
            <div className="overflow-auto" style={{ maxHeight: 480 }}>
              <pre className="p-5 text-sm text-slate-300 font-mono leading-relaxed whitespace-pre-wrap break-all">
                <code>{finalHtml}</code>
              </pre>
            </div>
          ) : (
            <div className="overflow-auto bg-white" style={{ maxHeight: 480 }}>
              <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                <span className="text-xs text-amber-400">👤 Preview com dados de exemplo — as variáveis aparecem substituídas como no envio real.</span>
              </div>
              <div className="p-4">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          )}
        </div>

        {/* AI Chat */}
        <div className="mt-4">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
              chatOpen
                ? 'bg-brand-500/10 border-brand-500/40 text-brand-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-brand-500/40 hover:text-brand-400'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Ajustar layout com IA
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${chatOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {chatOpen && (
            <div className="mt-2 card overflow-hidden">
              {/* Chat messages */}
              <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 320 }}>
                {chatMessages.length === 0 && (
                  <p className="text-xs text-slate-600 text-center py-4">
                    Descreva o que deseja ajustar no HTML — ex: "muda a cor do cabeçalho para azul" ou "aumenta a fonte do rodapé"
                  </p>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex flex-col gap-1 ${msg.from === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.from === 'user' && (
                      <div className="max-w-[80%] bg-brand-500/20 border border-brand-500/30 rounded-xl px-3 py-2 text-sm text-slate-200">
                        {msg.text}
                      </div>
                    )}
                    {msg.from === 'ai' && (
                      <div className="max-w-[90%] space-y-2">
                        <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-300">
                          {msg.text}
                        </div>
                        {msg.pendingHtml && !msg.applied && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => applyHtmlChange(msg.pendingHtml)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-medium hover:bg-emerald-500/30 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            Aplicar alteração
                          </motion.button>
                        )}
                        {msg.applied && (
                          <span className="text-xs text-emerald-500">Alteração aplicada</span>
                        )}
                      </div>
                    )}
                    {msg.from === 'error' && (
                      <div className="max-w-[90%] bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400">
                        Erro: {msg.text}
                      </div>
                    )}
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex items-start">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">Ajustando HTML...</span>
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input */}
              <div className="border-t border-slate-800 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ex: muda a cor do cabeçalho para azul..."
                  disabled={chatLoading}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-brand-500 disabled:opacity-50"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={sendChatMessage}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Enviar
                </motion.button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 card p-4 border-brand-500/10">
          <h4 className="text-sm font-semibold text-slate-300 mb-2">Como usar no ActiveCampaign</h4>
          <ol className="text-sm text-slate-500 space-y-1">
            <li>1. Clique em <strong className="text-slate-400">"Copiar código"</strong> acima</li>
            <li>2. No editor do ActiveCampaign, adicione um bloco <strong className="text-slate-400">"HTML personalizado"</strong></li>
            <li>3. Cole o código e salve — pronto! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
