import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, TrendingUp } from 'lucide-react';

interface CommissionInfo {
  plan: string;
  rate: number;
  price: number;
}

interface AffiliateROICalculatorProps {
  commissionRates: CommissionInfo[];
}

export const AffiliateROICalculator: React.FC<AffiliateROICalculatorProps> = ({ commissionRates }) => {
  const [referrals, setReferrals] = useState<Record<string, number>>({
    Starter: 0,
    Prime: 10,
    Elite: 5,
    Supreme: 2
  });

  const calculateMonthlyEarnings = () => {
    let total = 0;
    commissionRates.forEach(info => {
      const count = referrals[info.plan] || 0;
      total += count * info.price * info.rate;
    });
    return total;
  };

  const monthlyTotal = calculateMonthlyEarnings();
  const annualTotal = monthlyTotal * 12;

  return (
    <div className="bg-gradient-to-br from-[#1F1F1F] to-[#252525] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-brand-gold to-brand-gold-dark rounded-xl flex items-center justify-center">
          <Calculator className="w-6 h-6 text-black" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-white">
            Calculadora de Ganhos
          </h3>
          <p className="text-sm text-gray-400">
            Simule seus ganhos mensais e anuais
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {commissionRates.filter(info => info.plan !== 'Starter').map((info) => (
          <div key={info.plan} className="bg-black/40 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-white font-semibold">{info.plan}</div>
                <div className="text-xs text-gray-500">
                  R$ {info.price.toFixed(2)}/mês • {(info.rate * 100).toFixed(0)}% comissão
                </div>
              </div>
              <div className="text-brand-gold text-sm font-bold">
                R$ {(info.price * info.rate).toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="50"
                value={referrals[info.plan] || 0}
                onChange={(e) => setReferrals({
                  ...referrals,
                  [info.plan]: parseInt(e.target.value)
                })}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #FFD700 0%, #FFD700 ${((referrals[info.plan] || 0) / 50) * 100}%, #333 ${((referrals[info.plan] || 0) / 50) * 100}%, #333 100%)`
                }}
              />
              <div className="w-16 h-10 bg-black border border-brand-gold/30 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-brand-gold">{referrals[info.plan] || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-gold/20 to-brand-gold-dark/20 border-2 border-brand-gold rounded-xl p-6"
      >
        <h4 className="font-bold text-white mb-4 text-center text-lg">Suas Comissões Recorrentes Projetadas</h4>

        <div className="mb-4 space-y-2 text-sm">
          {commissionRates.filter(info => info.plan !== 'Starter').map((info) => {
            const count = referrals[info.plan] || 0;
            const earnings = count * info.price * info.rate;
            if (count === 0) return null;
            return (
              <div key={info.plan} className="flex justify-between items-center">
                <span className="text-gray-400">
                  {count} × {info.plan} (R$ {(info.price * info.rate).toFixed(2)}):
                </span>
                <span className="font-bold text-brand-gold">R$ {earnings.toFixed(2)}</span>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t-2 border-brand-gold/30">
          <div className="text-center p-4 bg-black/60 rounded-lg border border-brand-gold/30">
            <div className="text-sm text-brand-gold-light font-medium mb-1">
              Comissão Mensal Total
            </div>
            <div className="text-3xl font-bold text-brand-gold">
              R$ {monthlyTotal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">recorrente todo mês</div>
          </div>

          <div className="text-center p-4 bg-black/60 rounded-lg border border-brand-gold/30">
            <div className="text-sm text-brand-gold-light font-medium mb-1">
              Projeção Anual
            </div>
            <div className="text-3xl font-bold text-brand-gold">
              R$ {annualTotal.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-1">por ano (12 meses)</div>
          </div>
        </div>

        {monthlyTotal > 0 && (
          <div className="mt-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg p-3 border border-emerald-500/30">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">
                Potencial de ganho passivo mensal: R$ {monthlyTotal.toFixed(2)}!
              </span>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-blue-300 leading-relaxed text-center">
          💡 <strong>Dica:</strong> Quanto mais alto o plano do seu referido, maior sua comissão recorrente!
          Focando em planos Elite e Supreme, você maximiza seus ganhos mensais.
        </p>
      </div>

      <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-xs text-yellow-300 leading-relaxed text-center">
          ⚡ <strong>Comissões Recorrentes:</strong> Você recebe todo mês enquanto seus referidos mantiverem a assinatura ativa no <strong>Multicolecionismo</strong>!
        </p>
      </div>
    </div>
  );
};
