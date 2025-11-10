import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  TrendingDown,
  Crown,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface PremiumDomain {
  fqdn: string;
  price_usd: number;
}

interface PlanDowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPlan: string;
  newPlan: string;
  premiumDomains: PremiumDomain[];
  loading?: boolean;
}

export const PlanDowngradeModal: React.FC<PlanDowngradeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPlan,
  newPlan,
  premiumDomains,
  loading = false,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!confirmed) return;
    onConfirm();
  };

  const totalValue = premiumDomains.reduce((sum, d) => sum + d.price_usd, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 relative">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      Confirmação de Downgrade
                    </h2>
                    <p className="text-white/90 text-sm">
                      {currentPlan} → {newPlan}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Warning Box */}
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-amber-900 mb-2">
                        Atenção: Domínios Premium Serão Suspensos
                      </h3>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        Você possui <strong>{premiumDomains.length} domínio(s) premium</strong> da
                        Galeria Exclusiva. Ao fazer downgrade para o plano {newPlan}, estes
                        domínios serão <strong>automaticamente suspensos</strong> e seus links
                        pararão de funcionar.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Premium Domains List */}
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Domínios Afetados ({premiumDomains.length})
                  </h3>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {premiumDomains.map((domain) => (
                      <div
                        key={domain.fqdn}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                          <div>
                            <p className="font-semibold text-slate-800">{domain.fqdn}</p>
                            <p className="text-xs text-slate-500">Domínio Premium</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800">
                            ${domain.price_usd.toLocaleString()}/ano
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 p-3 bg-slate-100 rounded-lg flex items-center justify-between">
                    <span className="font-medium text-slate-700">Valor total dos domínios:</span>
                    <span className="text-xl font-bold text-slate-900">
                      ${totalValue.toLocaleString()}/ano
                    </span>
                  </div>
                </div>

                {/* What Happens */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-500" />
                      Você Perderá:
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Acesso aos domínios premium (suspensos)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Acesso futuro à Galeria Premium</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Comissões de afiliado (50% → 25%)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Suporte prioritário Elite</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      Você Mantém:
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Domínio principal (.com.rich)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Domínios regulares ($100/ano)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Sistema completo de links</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        <span>Analytics e QR codes</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Reactivation Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-1">Posso reativar depois?</p>
                      <p className="text-blue-800">
                        <strong>Sim!</strong> Seus domínios premium ficarão "congelados" mas não
                        serão perdidos. Você pode reativá-los a qualquer momento fazendo upgrade
                        de volta para o plano Elite.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="border-t border-slate-200 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 w-5 h-5 text-slate-600 border-slate-300 rounded focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                      Eu entendo que meus <strong>{premiumDomains.length} domínio(s) premium</strong>
                      {' '}serão suspensos e que posso reativá-los fazendo upgrade para Elite novamente.
                      Confirmo que desejo prosseguir com o downgrade.
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-200 p-6 flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-6 py-3 text-slate-700 hover:bg-slate-200 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!confirmed || loading}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processando...
                    </span>
                  ) : (
                    'Confirmar Downgrade'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
