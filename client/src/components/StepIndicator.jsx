export default function StepIndicator({ currentStep, totalSteps, labels }) {
  return (
    <div className="flex items-center gap-2 max-w-2xl mx-auto">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isDone
                    ? 'bg-brand-500 text-white'
                    : isActive
                    ? 'bg-brand-500 text-white ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-950'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block transition-colors ${
                  isActive ? 'text-slate-100' : isDone ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div
                className={`flex-1 h-px mx-2 transition-colors duration-300 ${
                  isDone ? 'bg-brand-500' : 'bg-slate-800'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
