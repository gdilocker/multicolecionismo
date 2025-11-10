import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Calculator, TrendingUp, ArrowRight } from 'lucide-react';

export const AffiliateROICalculator: React.FC = () => {
  const [primeReferrals, setPrimeReferrals] = useState(10);
  const [eliteReferrals, setEliteReferrals] = useState(10);

  // Prime member commissions (25%)
  const primeMemberPrimeCommission = 12.50; // 25% of $50
  const primeMemberEliteCommission = 17.50; // 25% of $70

  // Elite member commissions (50%)
  const eliteMemberPrimeCommission = 25.00; // 50% of $50
  const eliteMemberEliteCommission = 35.00; // 50% of $70

  // As Prime Member calculations
  const primeMemberMonthly = (primeReferrals * primeMemberPrimeCommission) + (eliteReferrals * primeMemberEliteCommission);
  const primeMemberAnnual = primeMemberMonthly * 12;

  // As Elite Member calculations
  const eliteMemberMonthly = (primeReferrals * eliteMemberPrimeCommission) + (eliteReferrals * eliteMemberEliteCommission);
  const eliteMemberAnnual = eliteMemberMonthly * 12;

  return (
    <div className="w-full space-y-8">
      {/* Prime Member Calculator */}
      <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl border-2 border-emerald-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-lg mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm font-bold text-green-900">
              Receba em dólar — uma das moedas mais fortes e estáveis do mundo
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Calculadora Membro Prime
            </h3>
            <p className="text-sm text-gray-600 font-semibold">
              25% de Comissão: $12.50 (Prime) | $17.50 (Elite)
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vendas do Plano Prime/mês
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={primeReferrals}
                onChange={(e) => setPrimeReferrals(parseInt(e.target.value))}
                className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(16 185 129) 0%, rgb(16 185 129) ${(primeReferrals / 50) * 100}%, rgb(209 250 229) ${(primeReferrals / 50) * 100}%, rgb(209 250 229) 100%)`
                }}
              />
              <div className="w-16 h-12 bg-white border-2 border-emerald-300 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{primeReferrals}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vendas do Plano Elite/mês
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={eliteReferrals}
                onChange={(e) => setEliteReferrals(parseInt(e.target.value))}
                className="flex-1 h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(16 185 129) 0%, rgb(16 185 129) ${(eliteReferrals / 50) * 100}%, rgb(209 250 229) ${(eliteReferrals / 50) * 100}%, rgb(209 250 229) 100%)`
                }}
              />
              <div className="w-16 h-12 bg-white border-2 border-emerald-300 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{eliteReferrals}</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-emerald-300"
        >
          <h4 className="font-bold text-gray-900 mb-4 text-center">Sua Comissão Recorrente como Membro Prime</h4>

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{primeReferrals} vendas Prime × $12.50:</span>
              <span className="font-bold text-emerald-700">${(primeReferrals * primeMemberPrimeCommission).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{eliteReferrals} vendas Elite × $17.50:</span>
              <span className="font-bold text-yellow-700">${(eliteReferrals * primeMemberEliteCommission).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t-2 border-emerald-100">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200">
              <div className="text-sm text-emerald-700 font-medium mb-1">
                Comissão Mensal Total
              </div>
              <div className="text-3xl font-bold text-emerald-900">
                ${primeMemberMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-600 mt-1">por mês</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 font-medium mb-1">
                Comissão Anual Total
              </div>
              <div className="text-3xl font-bold text-green-900">
                ${primeMemberAnnual.toFixed(2)}
              </div>
              <div className="text-xs text-green-600 mt-1">por ano</div>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs text-gray-700 leading-relaxed text-center">
            ✓ Comissão de 25% em todas as vendas. Valores em USD, pagos sobre o valor líquido.
          </p>
        </div>
      </div>

      {/* Elite Member Calculator */}
      <div className="bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-50 rounded-2xl p-8 shadow-xl border-2 border-yellow-300">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-lg mb-4">
            <DollarSign className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-bold text-amber-900">
              Dobre suas comissões como Membro Elite — 50%!
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Calculadora Membro Elite
            </h3>
            <p className="text-sm text-gray-600 font-semibold">
              50% de Comissão: $25.00 (Prime) | $35.00 (Elite)
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vendas do Plano Prime/mês
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={primeReferrals}
                onChange={(e) => setPrimeReferrals(parseInt(e.target.value))}
                className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${(primeReferrals / 50) * 100}%, rgb(254 243 199) ${(primeReferrals / 50) * 100}%, rgb(254 243 199) 100%)`
                }}
              />
              <div className="w-16 h-12 bg-white border-2 border-yellow-300 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">{primeReferrals}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Vendas do Plano Elite/mês
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={eliteReferrals}
                onChange={(e) => setEliteReferrals(parseInt(e.target.value))}
                className="flex-1 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(245 158 11) 0%, rgb(245 158 11) ${(eliteReferrals / 50) * 100}%, rgb(254 243 199) ${(eliteReferrals / 50) * 100}%, rgb(254 243 199) 100%)`
                }}
              />
              <div className="w-16 h-12 bg-white border-2 border-yellow-300 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-yellow-600">{eliteReferrals}</span>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-lg border-2 border-yellow-300"
        >
          <h4 className="font-bold text-gray-900 mb-4 text-center">Sua Comissão Recorrente como Membro Elite</h4>

          <div className="mb-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{primeReferrals} vendas Prime × $25.00:</span>
              <span className="font-bold text-emerald-700">${(primeReferrals * eliteMemberPrimeCommission).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{eliteReferrals} vendas Elite × $35.00:</span>
              <span className="font-bold text-yellow-700">${(eliteReferrals * eliteMemberEliteCommission).toFixed(2)}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t-2 border-yellow-100">
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
              <div className="text-sm text-yellow-700 font-medium mb-1">
                Comissão Mensal Total
              </div>
              <div className="text-3xl font-bold text-yellow-900">
                ${eliteMemberMonthly.toFixed(2)}
              </div>
              <div className="text-xs text-yellow-600 mt-1">por mês</div>
            </div>

            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
              <div className="text-sm text-amber-700 font-medium mb-1">
                Comissão Anual Total
              </div>
              <div className="text-3xl font-bold text-amber-900">
                ${eliteMemberAnnual.toFixed(2)}
              </div>
              <div className="text-xs text-amber-600 mt-1">por ano</div>
            </div>
          </div>

          <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-300">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-bold text-green-900">
                Você ganha ${(eliteMemberMonthly - primeMemberMonthly).toFixed(2)}/mês a mais como Elite!
              </span>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-gray-700 leading-relaxed text-center">
            ✓ Comissão de 50% em todas as vendas. Valores em USD, pagos sobre o valor líquido.
          </p>
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <a
          href="/afiliados/termos"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold rounded-xl hover:shadow-2xl transition-all transform hover:scale-105"
        >
          Ver Termos Completos
          <ArrowRight className="w-5 h-5" />
        </a>

        <div className="mt-6 bg-gradient-to-r from-blue-50 to-slate-50 border-2 border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-900 mb-2 text-center">
            Documento Oficial Registrado
          </p>
          <p className="text-xs text-gray-700 leading-relaxed text-center">
            Os Termos de Afiliados do .com.rich são documentos oficiais registrados na <strong className="text-black">Companies House</strong> (Reino Unido), garantindo transparência jurídica e autenticidade internacional.
          </p>
          <p className="text-xs text-gray-600 mt-2 text-center">
            <strong className="text-black">Global Digital Identity LTD</strong> — Companies House – England & Wales
          </p>
        </div>
      </motion.div>
    </div>
  );
};
