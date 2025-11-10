import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  showBackButton?: boolean;
}

export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  description,
  onRefresh,
  refreshing = false,
  showBackButton = true
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-white rounded-lg transition-colors border border-gray-300 bg-white"
              title="Voltar ao Painel Admin"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-black">{title}</h1>
            {description && <p className="text-gray-600 mt-1">{description}</p>}
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        )}
      </div>
    </div>
  );
};
