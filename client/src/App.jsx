import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StepIndicator from './components/StepIndicator';
import Step1Welcome from './components/Step1Welcome';
import Step2Upload from './components/Step2Upload';
import Step3Canvas from './components/Step3Canvas';
import Step4ZoneReview from './components/Step4ZoneReview';
import Step5Settings from './components/Step5Settings';
import Step6Processing from './components/Step6Processing';
import Step7Result from './components/Step7Result';
import Step8Done from './components/Step8Done';

const STEP_LABELS = [
  'Início',
  'Upload',
  'Editor',
  'Revisão',
  'Confirmar',
  'Processando',
  'Código',
  'Pronto',
];

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function App() {
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [zones, setZones] = useState([]);
  const [settings, setSettings] = useState({ altText: '', campaign: '' });
  const [htmlResult, setHtmlResult] = useState('');

  const goTo = (n) => setStep(n);
  const next = () => setStep((s) => Math.min(s + 1, 8));
  const back = () => setStep((s) => Math.max(s - 1, 1));
  const restart = () => {
    setStep(1);
    setImageFile(null);
    setImageUrl(null);
    setImageDimensions({ width: 0, height: 0 });
    setZones([]);
    setSettings({ altText: '', campaign: '' });
    setHtmlResult('');
  };

  const handleImageUploaded = (file, url, dimensions) => {
    setImageFile(file);
    setImageUrl(url);
    setImageDimensions(dimensions);
    next();
  };

  const handleZonesDone = (newZones) => {
    setZones(newZones);
    next();
  };

  const handleProcessingDone = (html) => {
    setHtmlResult(html);
    next();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Welcome onStart={next} />;
      case 2:
        return <Step2Upload onUploaded={handleImageUploaded} />;
      case 3:
        return (
          <Step3Canvas
            imageFile={imageFile}
            imageUrl={imageUrl}
            imageDimensions={imageDimensions}
            initialZones={zones}
            onDone={handleZonesDone}
            onBack={back}
          />
        );
      case 4:
        return (
          <Step4ZoneReview
            zones={zones}
            imageUrl={imageUrl}
            onZonesChange={setZones}
            onNext={next}
            onBack={back}
          />
        );
      case 5:
        return (
          <Step5Settings
            settings={settings}
            zones={zones}
            imageUrl={imageUrl}
            imageDimensions={imageDimensions}
            onSettingsChange={setSettings}
            onNext={next}
            onBack={back}
          />
        );
      case 6:
        return (
          <Step6Processing
            imageFile={imageFile}
            zones={zones}
            settings={settings}
            onDone={handleProcessingDone}
            onError={back}
          />
        );
      case 7:
        return (
          <Step7Result
            html={htmlResult}
            onNext={next}
            onBack={() => goTo(5)}
          />
        );
      case 8:
        return <Step8Done html={htmlResult} onRestart={restart} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-white tracking-tight">SlicerMail Pro</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">v1.0.0</span>
      </header>

      {/* Step Indicator */}
      {step > 1 && step < 8 && (
        <div className="border-b border-slate-800 px-6 py-3">
          <StepIndicator currentStep={step - 1} totalSteps={6} labels={STEP_LABELS.slice(1, 7)} />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
