import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, ArrowDown } from 'lucide-react';

interface AffiliateTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function AffiliateTermsModal({ isOpen, onClose, onAccept }: AffiliateTermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setHasScrolledToBottom(false);
      setIsAccepting(false);
    }
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[9999] p-4"
          >
            <div className="bg-gradient-to-br from-[#1F1F1F] via-[#252525] to-[#1F1F1F] rounded-2xl max-w-4xl w-full max-h-[90vh] border border-[#D4AF37]/20 shadow-2xl relative flex flex-col">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#D4AF37] to-[#C6941E] rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Termos do Programa de Afiliados</h2>
                    <p className="text-gray-400 text-sm">Leia atentamente antes de aceitar</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                ref={contentRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-300 custom-scrollbar"
              >
                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Comissões e Pagamentos
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • <strong className="text-white">Plano Prime:</strong> Comissão de 25% sobre o valor da assinatura mensal
                    </p>
                    <p className="leading-relaxed">
                      • <strong className="text-white">Plano Elite:</strong> Comissão de 50% sobre o valor da assinatura mensal
                    </p>
                    <p className="leading-relaxed">
                      • As comissões são <strong className="text-white">recorrentes mensais</strong> enquanto o cliente mantiver a assinatura ativa
                    </p>
                    <p className="leading-relaxed">
                      • Os valores ficam disponíveis para saque <strong className="text-white">30 dias após cada recebimento confirmado</strong>
                    </p>
                    <p className="leading-relaxed">
                      • Saque mínimo de <strong className="text-white">US$ 200 (duzentos dólares americanos)</strong>
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Responsabilidades do Afiliado
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • Você deve divulgar o programa de forma <strong className="text-white">ética e transparente</strong>
                    </p>
                    <p className="leading-relaxed">
                      • Não é permitido fazer <strong className="text-white">promessas falsas</strong> ou exagerar benefícios
                    </p>
                    <p className="leading-relaxed">
                      • É proibido usar <strong className="text-white">spam, técnicas enganosas</strong> ou violar políticas de terceiros
                    </p>
                    <p className="leading-relaxed">
                      • Você deve ter um <strong className="text-white">plano ativo pago</strong> (Prime ou Elite) para participar
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">3</span>
                    Tracking e Atribuição
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • Cada afiliado recebe um <strong className="text-white">código único</strong> para rastreamento
                    </p>
                    <p className="leading-relaxed">
                      • O sistema usa <strong className="text-white">cookies com validade de 30 dias</strong>
                    </p>
                    <p className="leading-relaxed">
                      • A atribuição segue o modelo <strong className="text-white">first-touch</strong> (primeiro clique ganha)
                    </p>
                    <p className="leading-relaxed">
                      • Não é permitido <strong className="text-white">auto-referenciamento</strong> ou manipulação do sistema
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">4</span>
                    Cancelamentos e Reembolsos
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • Se um cliente solicitar <strong className="text-white">reembolso</strong>, a comissão correspondente será <strong className="text-white">estornada</strong>
                    </p>
                    <p className="leading-relaxed">
                      • Comissões de <strong className="text-white">assinaturas canceladas</strong> não são mais geradas
                    </p>
                    <p className="leading-relaxed">
                      • Valores já sacados de comissões estornadas podem ser <strong className="text-white">deduzidos de futuros pagamentos</strong>
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">5</span>
                    Suspensão e Terminação
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • Podemos <strong className="text-white">suspender ou encerrar</strong> sua conta de afiliado a qualquer momento por:
                    </p>
                    <p className="leading-relaxed ml-4">
                      - Violação destes termos
                    </p>
                    <p className="leading-relaxed ml-4">
                      - Práticas fraudulentas ou antiéticas
                    </p>
                    <p className="leading-relaxed ml-4">
                      - Cancelamento do seu plano pago
                    </p>
                    <p className="leading-relaxed">
                      • Em caso de terminação, comissões pendentes serão <strong className="text-white">pagas conforme cronograma</strong>, exceto em casos de fraude
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                    <span className="w-8 h-8 bg-[#D4AF37] text-black rounded-full flex items-center justify-center text-sm font-bold">6</span>
                    Alterações nos Termos
                  </h3>
                  <div className="space-y-3 pl-10">
                    <p className="leading-relaxed">
                      • Podemos <strong className="text-white">alterar estes termos a qualquer momento</strong>
                    </p>
                    <p className="leading-relaxed">
                      • Alterações significativas serão <strong className="text-white">notificadas por email</strong>
                    </p>
                    <p className="leading-relaxed">
                      • Continuar no programa após alterações implica <strong className="text-white">aceitação dos novos termos</strong>
                    </p>
                  </div>
                </section>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mt-6">
                  <p className="text-yellow-500 text-sm font-medium flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Ao aceitar estes termos, você confirma que leu, entendeu e concorda em cumprir todas as condições do Programa de Afiliados .com.rich
                    </span>
                  </p>
                </div>
              </div>

              {/* Scroll indicator */}
              {!hasScrolledToBottom && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute bottom-32 left-1/2 transform -translate-x-1/2 pointer-events-none"
                >
                  <div className="bg-[#D4AF37] text-black px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
                    <ArrowDown className="w-4 h-4 animate-bounce" />
                    <span className="text-sm font-medium">Role até o final</span>
                  </div>
                </motion.div>
              )}

              {/* Footer with actions */}
              <div className="p-6 border-t border-white/10 flex items-center justify-between gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-400 hover:text-white font-medium rounded-xl transition-colors"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleAccept}
                  disabled={!hasScrolledToBottom || isAccepting}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    hasScrolledToBottom
                      ? 'bg-gradient-to-r from-[#F4D03F] via-[#D4AF37] to-[#C6941E] text-black hover:shadow-lg hover:scale-105'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isAccepting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : hasScrolledToBottom ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Aceito os Termos</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5" />
                      <span>Leia até o final para aceitar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #D4AF37;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: #F4D03F;
            }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
}
