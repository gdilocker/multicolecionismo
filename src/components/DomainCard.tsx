import React from 'react';
import { Globe, Calendar, CheckCircle } from 'lucide-react';

interface Domain {
  id: string;
  fqdn: string;
  status: string;
  expiresAt?: string;
}

interface DomainCardProps {
  domain: Domain;
  onClick?: () => void;
}

export const DomainCard: React.FC<DomainCardProps> = ({ domain, onClick }) => {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-[#2B2D42] transition-all duration-200 cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 rounded-xl bg-[#FAFAFA] flex items-center justify-center group-hover:bg-black transition-colors">
            <Globe className="w-6 h-6 text-black group-hover:text-white transition-colors" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-black truncate">{domain.fqdn}</h3>
            <div className="flex items-center gap-2 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-sm text-[#6B7280]">{domain.status}</span>
            </div>
          </div>
        </div>
      </div>
      {domain.expiresAt && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm text-[#6B7280]">
          <Calendar className="w-4 h-4" />
          <span>Expires: {new Date(domain.expiresAt).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
};
