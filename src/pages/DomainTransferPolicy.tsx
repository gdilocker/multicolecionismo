import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Shield, RefreshCw, DollarSign, Calendar } from 'lucide-react';

const DomainTransferPolicy: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#F5F5F5] overflow-hidden">
      <div className="relative pt-32 pb-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16"
        >
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-6 shadow-lg shadow-sm">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-4">
              Política de Domínios Premium
            </h1>
            <p className="text-xl text-[#6B7280]/70 mb-4">.com.rich</p>
            <div className="inline-flex items-center gap-2 text-[#6B7280]/80">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Última atualização: 13 de novembro de 2025</span>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="relative group mb-8">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
            <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <Shield className="w-6 h-6 text-[#3B82F6] flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-xl font-semibold text-black mb-2">Global Digital Identity LTD</h2>
                  <p className="text-[#6B7280]/80 leading-relaxed mb-2">
                    Empresa registrada na Inglaterra e País de Gales sob o número <strong>Company No. 16339013</strong>
                  </p>
                  <p className="text-[#6B7280]/70 text-sm">
                    71–75 Shelton Street, Covent Garden, Londres, WC2H 9JQ, Reino Unido
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Section 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
              <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-blue-500" />
                  1. Natureza Premium
                </h2>
                <div className="text-[#6B7280]/80 space-y-4">
                  <p>
                    Os domínios <strong>.com.rich</strong> são ativos digitais exclusivos e não se
                    destinam ao uso genérico ou massivo. Cada registro é analisado e aprovado
                    individualmente pela Global Digital Identity LTD.
                  </p>
                  <p>
                    Ao adquirir um domínio .com.rich, você recebe uma <strong>licença exclusiva e
                    pessoal de uso</strong>, condicionada ao pagamento regular e conformidade com
                    nossos Termos de Uso.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Section 2 - Lifecycle Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
              <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-blue-500" />
                  2. Ciclo de Vida do Domínio
                </h2>
                <div className="text-[#6B7280]/80 space-y-4">
                  <p className="mb-4">
                    Todos os domínios .com.rich seguem um ciclo de vida estruturado para proteger
                    tanto o titular quanto a integridade da rede.
                  </p>

                  <div className="overflow-x-auto">
                    <table className="w-full border-2 border-slate-200 rounded-lg overflow-hidden">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900">Fase</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900">Dias</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-900">Descrição</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr className="bg-green-50">
                          <td className="px-4 py-3 font-medium">Ativo</td>
                          <td className="px-4 py-3">0</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                              Normal
                            </span>
                          </td>
                          <td className="px-4 py-3">Domínio ativo e renovado</td>
                        </tr>
                        <tr className="bg-amber-50">
                          <td className="px-4 py-3 font-medium">Grace (Graça)</td>
                          <td className="px-4 py-3">1–15</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded-full font-medium">
                              Atrasado
                            </span>
                          </td>
                          <td className="px-4 py-3">Ainda pode renovar sem multa</td>
                        </tr>
                        <tr className="bg-red-50">
                          <td className="px-4 py-3 font-medium">Redemption (Resgate)</td>
                          <td className="px-4 py-3">16–45</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-sm rounded-full font-medium">
                              Suspenso
                            </span>
                          </td>
                          <td className="px-4 py-3">Requer taxa de recuperação ($25)</td>
                        </tr>
                        <tr className="bg-purple-50">
                          <td className="px-4 py-3 font-medium">Registry Hold</td>
                          <td className="px-4 py-3">46–60</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                              Protegido
                            </span>
                          </td>
                          <td className="px-4 py-3">Não pode ser registrado por terceiros</td>
                        </tr>
                        <tr className="bg-orange-50">
                          <td className="px-4 py-3 font-medium">Auction (Leilão)</td>
                          <td className="px-4 py-3">61–75</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                              Leilão
                            </span>
                          </td>
                          <td className="px-4 py-3">Pode ser adquirido por outro membro</td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="px-4 py-3 font-medium">Pending Delete</td>
                          <td className="px-4 py-3">76–80</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-slate-200 text-slate-800 text-sm rounded-full font-medium">
                              Exclusão final
                            </span>
                          </td>
                          <td className="px-4 py-3">Sem possibilidade de restauração</td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3 font-medium">Released</td>
                          <td className="px-4 py-3">81+</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                              Liberado
                            </span>
                          </td>
                          <td className="px-4 py-3">Volta ao pool ou se torna premium</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>Importante:</strong> Durante todo o ciclo, você recebe notificações
                      automáticas nos marcos D-14, D-7, D-3, D-1, D+1, D+10, D+16, D+30, D+45 e D+60.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 3 - Recovery Fees */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
              <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  3. Resgate e Taxas
                </h2>
                <div className="text-[#6B7280]/80 space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Período de Graça (Dias 1-15)</h4>
                    <p>
                      Sem taxa adicional. Você pode renovar pagando apenas a mensalidade normal ($70 USD).
                      Todos os serviços permanecem ativos durante este período.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Período de Resgate (Dias 16-45)</h4>
                    <p>
                      Taxa de recuperação: <strong>$25 USD</strong> + mensalidade ($70 USD).
                      Total: <strong>$95 USD</strong>.
                    </p>
                    <p className="text-sm text-slate-600 mt-2">
                      O domínio está suspenso e todos os serviços (DNS, perfil) estão inativos até o pagamento.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Registry Hold (Dias 46-60)</h4>
                    <p>
                      Taxa de recuperação elevada: <strong>$50 USD</strong> + mensalidade ($70 USD).
                      Total: <strong>$120 USD</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 4 - Transfers */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
              <div className="relative bg-white backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-black mb-4 flex items-center gap-3">
                  <RefreshCw className="w-6 h-6 text-purple-500" />
                  4. Transferências e Bloqueio
                </h2>
                <div className="text-[#6B7280]/80 space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Bloqueio de 60 Dias</h4>
                    <p>
                      Todos os domínios recém-registrados ou recuperados ficam <strong>bloqueados
                      contra transferência por 60 dias</strong>. Esta é uma medida de segurança para
                      prevenir fraude e transações não autorizadas.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Transferência Autorizada</h4>
                    <p>Transferências de licença são permitidas mediante:</p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-slate-700">
                      <li>Aprovação da Global Digital Identity LTD</li>
                      <li>Pagamento de taxa administrativa</li>
                      <li>Verificação de identidade de ambas as partes</li>
                      <li>Ausência de pagamentos pendentes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-700 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-500" />
              <div className="relative bg-slate-50 backdrop-blur-xl border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-slate-900 mb-3">Dúvidas ou Disputas?</h3>
                <p className="text-slate-700 mb-4">
                  Para questões relacionadas a domínios, prazos ou recuperação, entre em contato:
                </p>
                <div className="space-y-2 text-sm">
                  <p><strong>Suporte Geral:</strong> support@com.rich</p>
                  <p><strong>Questões Jurídicas:</strong> legal@com.rich</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default DomainTransferPolicy;
