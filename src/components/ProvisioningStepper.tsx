import React from 'react';
import { CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

interface Step {
  label: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ProvisioningStepperProps {
  steps: Step[];
}

export const ProvisioningStepper: React.FC<ProvisioningStepperProps> = ({ steps }) => {
  return (
    <div className="w-full max-w-2xl mx-auto py-6">
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index} className="relative group">
            <div className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 ${
              step.status === 'completed'
                ? 'bg-green-500/10 border-2 border-green-500/30'
                : step.status === 'in_progress'
                ? 'bg-blue-500/10 border-2 border-blue-500/30'
                : step.status === 'failed'
                ? 'bg-red-500/10 border-2 border-red-500/30'
                : 'bg-white/5 border-2 border-white/10'
            }`}>
              <div className="flex-shrink-0">
                {step.status === 'completed' && (
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  </div>
                )}
                {step.status === 'in_progress' && (
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                )}
                {step.status === 'failed' && (
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-400" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border-2 border-white/20">
                    <Clock className="w-5 h-5 text-blue-300/50" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    step.status === 'completed'
                      ? 'text-green-300'
                      : step.status === 'in_progress'
                      ? 'text-blue-300'
                      : step.status === 'failed'
                      ? 'text-red-300'
                      : 'text-blue-200/50'
                  }`}
                >
                  {step.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
