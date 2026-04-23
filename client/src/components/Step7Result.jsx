import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Step7Result({ html, onNext, onBack }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('code'); // 'code' | 'preview'

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback para navegadores antigos
      const textarea = document.createElement('textarea');
      textarea.value = html;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const lineCount = html.split('\n').length;
  const charCount = html.length;

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
        <div className="flex gap-4 mb-4">
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
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3 bg-slate-900 rounded-xl p-1 border border-slate-800 inline-flex">
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
                <code>{html}</code>
              </pre>
            </div>
          ) : (
            <div className="p-4 overflow-auto bg-white" style={{ maxHeight: 480 }}>
              <div dangerouslySetInnerHTML={{ __html: html }} />
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
