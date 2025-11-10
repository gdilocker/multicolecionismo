import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DNSRecord {
  ok: boolean;
  value?: string;
  error?: string;
}

interface DNSStatusCardProps {
  records: {
    [key: string]: DNSRecord;
  };
}

export const DNSStatusCard: React.FC<DNSStatusCardProps> = ({ records }) => {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-black mb-4">DNS Status</h3>
      <div className="space-y-3">
        {Object.entries(records).map(([type, record]) => (
          <div key={type} className="flex items-start gap-3 p-3 rounded-lg bg-[#FAFAFA]">
            <div className="flex-shrink-0 mt-0.5">
              {record.ok ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : record.error ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-black">{type}</p>
              {record.value && (
                <p className="text-xs text-[#6B7280] mt-1 break-all font-mono">{record.value}</p>
              )}
              {record.error && (
                <p className="text-xs text-red-600 mt-1">{record.error}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
