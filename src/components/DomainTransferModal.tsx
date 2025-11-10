import { useState } from 'react';
import { X, AlertCircle, ArrowRight, DollarSign, Mail, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DomainTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  domain: {
    id: string;
    fqdn: string;
  };
  onTransferInitiated: () => void;
}

export default function DomainTransferModal({
  isOpen,
  onClose,
  domain,
  onTransferInitiated
}: DomainTransferModalProps) {
  const [step, setStep] = useState<'form' | 'confirm' | 'processing'>('form');
  const [toEmail, setToEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const TRANSFER_FEE = 50;
  const ANNUAL_FEE = 100;
  const TOTAL = TRANSFER_FEE + ANNUAL_FEE;

  const handleInitiate = async () => {
    if (!toEmail || !confirmEmail) {
      setError('Preencha todos os campos');
      return;
    }

    if (toEmail !== confirmEmail) {
      setError('Os e-mails não correspondem');
      return;
    }

    if (!agreed) {
      setError('Você deve concordar com os termos');
      return;
    }

    setStep('confirm');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError('');

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domain-transfer`;
      const token = (await import('../lib/supabase')).supabase.auth.session()?.access_token;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'initiate',
          domainId: domain.id,
          toUserEmail: toEmail
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar transferência');
      }

      const transferId = data.transfer.id;

      const paymentResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-payment',
          transferId,
          returnUrl: `${window.location.origin}/transfer/success?transferId=${transferId}`,
          cancelUrl: `${window.location.origin}/transfer/cancel`
        })
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Erro ao criar pagamento');
      }

      window.location.href = paymentData.approveUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar transferência');
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setToEmail('');
    setConfirmEmail('');
    setAgreed(false);
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-slate-800">
                Transferir Domínio
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6">
              {step === 'form' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Sobre a Transferência</p>
                        <p>
                          O domínio <strong>{domain.fqdn}</strong> será transferido para o e-mail indicado.
                          O novo titular precisará pagar a taxa de transferência e a nova anuidade.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Custos da Transferência
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Taxa de Transferência</span>
                        <span className="font-bold text-slate-800">US$ {TRANSFER_FEE.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600">Nova Anuidade Integral</span>
                        <span className="font-bold text-slate-800">US$ {ANNUAL_FEE.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-slate-300 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">Total</span>
                          <span className="text-2xl font-bold text-slate-900">US$ {TOTAL.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-mail do Novo Titular
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={toEmail}
                        onChange={(e) => setToEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirme o E-mail
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-semibold mb-1">Política de Não Reembolso</p>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>Esta transferência é irreversível após o pagamento</li>
                          <li>Não há reembolso em nenhuma circunstância</li>
                          <li>Verifique cuidadosamente o e-mail do destinatário</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-slate-600 border-slate-300 rounded focus:ring-2 focus:ring-slate-500"
                    />
                    <span className="text-sm text-slate-700">
                      Concordo com a <a href="/domain-transfer-policy" target="_blank" className="text-blue-600 hover:underline">Política de Transferência</a> e entendo que não há reembolso após a conclusão do pagamento
                    </span>
                  </label>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleInitiate}
                      disabled={!toEmail || !confirmEmail || !agreed}
                      className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      Continuar
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">
                      Confirme a Transferência
                    </h3>
                    <p className="text-slate-600">
                      Você está prestes a transferir <strong>{domain.fqdn}</strong> para:
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-2">{toEmail}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                    <p className="text-sm text-slate-700 mb-4">
                      Ao confirmar, o destinatário receberá uma notificação e será direcionado para o pagamento de <strong>US$ {TOTAL.toFixed(2)}</strong>.
                    </p>
                    <p className="text-sm text-slate-700">
                      Após a confirmação do pagamento, o domínio será automaticamente transferido.
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('form')}
                      disabled={loading}
                      className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Processando...' : 'Confirmar Transferência'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
