import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DomainLimits {
  plan_name: string;
  plan_type: string;
  max_domains: number | null;
  current_domains: number;
  can_purchase_more: boolean;
  remaining_domains: number | null;
  is_unlimited: boolean;
}

export function DomainLimitIndicator() {
  const { user } = useAuth();
  const [limits, setLimits] = useState<DomainLimits | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchLimits();
    }
  }, [user?.id]);

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_my_domain_limits');

      if (error) throw error;

      if (data && !data.error) {
        setLimits(data);
      }
    } catch (error) {
      console.error('Error fetching domain limits:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-200 rounded-lg h-24"></div>
    );
  }

  if (!limits) return null;

  const getStatusColor = () => {
    if (limits.is_unlimited) return 'text-green-600';
    if (!limits.can_purchase_more) return 'text-red-600';
    if (limits.remaining_domains === 1) return 'text-amber-600';
    return 'text-blue-600';
  };

  const getStatusIcon = () => {
    if (limits.is_unlimited) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (!limits.can_purchase_more) return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Globe className="w-5 h-5 text-blue-500" />;
  };

  const getBgColor = () => {
    if (limits.is_unlimited) return 'bg-green-50 border-green-200';
    if (!limits.can_purchase_more) return 'bg-red-50 border-red-200';
    if (limits.remaining_domains === 1) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border-2 rounded-xl p-4 ${getBgColor()}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${getStatusColor()}`}>
              Limite de Domínios
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {limits.is_unlimited ? (
                <>
                  <span className="font-semibold text-green-700">Ilimitado</span> no plano {limits.plan_name}
                </>
              ) : (
                <>
                  <span className="font-semibold">{limits.current_domains}</span> de{' '}
                  <span className="font-semibold">{limits.max_domains}</span> domínio(s) usado(s)
                </>
              )}
            </p>

            {/* Progress Bar (only if not unlimited) */}
            {!limits.is_unlimited && limits.max_domains && (
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    !limits.can_purchase_more
                      ? 'bg-red-500'
                      : limits.remaining_domains === 1
                      ? 'bg-amber-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${(limits.current_domains / limits.max_domains) * 100}%`
                  }}
                />
              </div>
            )}

            {/* Status Message */}
            {!limits.can_purchase_more && !limits.is_unlimited && (
              <p className="text-xs text-red-700 mt-2 font-medium">
                ⚠️ Limite atingido. Faça upgrade para Elite para domínios ilimitados.
              </p>
            )}

            {limits.remaining_domains === 1 && !limits.is_unlimited && (
              <p className="text-xs text-amber-700 mt-2 font-medium">
                ⚠️ Apenas {limits.remaining_domains} domínio restante
              </p>
            )}
          </div>
        </div>

        {/* Upgrade Button */}
        {!limits.is_unlimited && !limits.can_purchase_more && (
          <a
            href="/valores"
            className="flex-shrink-0 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Upgrade
          </a>
        )}
      </div>
    </motion.div>
  );
}

interface DomainLimitWarningProps {
  onUpgrade?: () => void;
}

export function DomainLimitWarning({ onUpgrade }: DomainLimitWarningProps) {
  const { user } = useAuth();
  const [limits, setLimits] = useState<DomainLimits | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchLimits();
    }
  }, [user?.id]);

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_my_domain_limits');

      if (error) throw error;

      if (data && !data.error) {
        setLimits(data);
      }
    } catch (error) {
      console.error('Error fetching domain limits:', error);
    }
  };

  if (!limits || limits.can_purchase_more || limits.is_unlimited) {
    return null; // Don't show warning if can still purchase
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6"
    >
      <div className="flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-bold text-red-900 mb-2">
            Limite de Domínios Atingido
          </h3>
          <p className="text-red-800 mb-4">
            Você atingiu o limite de <strong>{limits.max_domains} domínio(s)</strong> do plano{' '}
            <strong>{limits.plan_name}</strong>.
          </p>
          <div className="bg-white rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-700 mb-2">
              💡 <strong>Faça upgrade para o plano Elite</strong> e tenha:
            </p>
            <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
              <li>Domínios <strong>ilimitados</strong></li>
              <li>Identidade física exclusiva</li>
              <li>Acesso a lugares premium</li>
              <li>Comissões de afiliados mais altas</li>
            </ul>
          </div>
          <button
            onClick={onUpgrade || (() => window.location.href = '/valores')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-xl transition-all flex items-center gap-2"
          >
            <TrendingUp className="w-5 h-5" />
            Fazer Upgrade para Elite
          </button>
        </div>
      </div>
    </motion.div>
  );
}
