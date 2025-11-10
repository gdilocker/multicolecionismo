import React from 'react';
import { Shield, AlertTriangle, Ban, Clock, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LinkSecurityStatusProps {
  linkId: string;
  status?: 'safe' | 'suspicious' | 'malicious' | 'pending' | 'under_review';
  isBlocked?: boolean;
  blockReason?: string;
  showDetails?: boolean;
  onReviewRequest?: () => void;
}

export default function LinkSecurityStatus({
  linkId,
  status = 'pending',
  isBlocked = false,
  blockReason,
  showDetails = false,
  onReviewRequest
}: LinkSecurityStatusProps) {
  const [isRequesting, setIsRequesting] = React.useState(false);

  const requestReview = async () => {
    if (!onReviewRequest) return;

    setIsRequesting(true);
    try {
      const { data, error } = await supabase.rpc('request_link_review', {
        p_link_id: linkId,
        p_user_message: 'Solicitação de revisão do usuário'
      });

      if (error) throw error;

      onReviewRequest();
    } catch (error) {
      console.error('Erro ao solicitar revisão:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const getStatusInfo = () => {
    if (isBlocked || status === 'malicious') {
      return {
        icon: Ban,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: '🚫 Bloqueado',
        description: blockReason || 'Link identificado como malicioso'
      };
    }

    switch (status) {
      case 'safe':
        return {
          icon: CheckCircle,
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          label: '✅ Seguro',
          description: 'Link verificado e aprovado'
        };
      case 'suspicious':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: '⚠️ Sob revisão',
          description: 'Link com padrão suspeito em análise'
        };
      case 'under_review':
        return {
          icon: Clock,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: '🔍 Em revisão',
          description: 'Aguardando revisão manual da equipe'
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          label: '⏳ Verificando...',
          description: 'Aguardando verificação de segurança'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  if (!showDetails) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{statusInfo.label}</span>
      </div>
    );
  }

  return (
    <div className={`border ${statusInfo.borderColor} ${statusInfo.bgColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${statusInfo.color} mb-1`}>
            {statusInfo.label}
          </h4>
          <p className="text-sm text-slate-600 mb-3">
            {statusInfo.description}
          </p>

          {isBlocked && onReviewRequest && (
            <button
              onClick={requestReview}
              disabled={isRequesting || status === 'under_review'}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Solicitando...
                </>
              ) : status === 'under_review' ? (
                <>
                  <Clock className="w-4 h-4" />
                  Revisão solicitada
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Solicitar revisão manual
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
