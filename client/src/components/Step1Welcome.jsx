import { motion } from 'framer-motion';

const features = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    ),
    title: 'Upload Inteligente',
    desc: 'Arraste qualquer imagem. Suporte a PNG, JPG e WEBP até 20MB.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    ),
    title: 'Editor de Zonas',
    desc: 'Desenhe retângulos sobre a imagem e adicione links a cada área.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    ),
    title: 'HTML Perfeito',
    desc: 'Código gerado com tabelas, compatível com Outlook e ActiveCampaign.',
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    ),
    title: 'Cloudinary Integrado',
    desc: 'Cada fatia é hospedada automaticamente na nuvem.',
  },
];

export default function Step1Welcome({ onStart }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-2xl"
      >
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
          Ferramenta Profissional de Email Marketing
        </div>

        <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
          Slice<span className="text-brand-500">Mail</span> Pro
        </h1>

        <p className="text-lg text-slate-400 mb-10 leading-relaxed">
          Transforme qualquer imagem em um email HTML profissional.
          Defina áreas clicáveis, adicione links e gere código compatível com{' '}
          <span className="text-slate-200 font-medium">Outlook e ActiveCampaign</span> em segundos.
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="btn-primary text-lg px-10 py-4 shadow-lg shadow-brand-500/25"
        >
          Começar agora →
        </motion.button>
      </motion.div>

      {/* Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl w-full"
      >
        {features.map((f, i) => (
          <div key={i} className="card p-5 text-center hover:border-slate-700 transition-colors">
            <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {f.icon}
              </svg>
            </div>
            <h3 className="font-semibold text-slate-100 text-sm mb-1">{f.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
