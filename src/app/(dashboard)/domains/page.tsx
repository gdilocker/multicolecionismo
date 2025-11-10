import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { DomainCard } from '../../../components/DomainCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { dbQueries } from '../../../lib/db/queries';

interface Domain {
  id: string;
  fqdn: string;
  status: string;
  expiresAt?: string;
}

const DomainsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, [user]);

  const loadDomains = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const customerId = await dbQueries.getCustomerId(user.id);
      if (!customerId) return;

      const data = await dbQueries.getDomains(customerId);
      setDomains(data.map(d => ({
        id: d.id,
        fqdn: d.fqdn,
        status: d.registrar_status || 'active',
        expiresAt: d.expires_at
      })));
    } catch (error) {
      console.error('Failed to load domains:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24 flex items-center justify-center">
        <p className="text-gray-600">Carregando domínios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Meus Domínios</h1>
          <button
            onClick={() => navigate('/wizard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Adicionar Domínio
          </button>
        </div>

        {domains.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {domains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onClick={() => navigate(`/domains/${domain.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 mb-4">Nenhum domínio ainda</p>
            <button
              onClick={() => navigate('/wizard')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Registrar Seu Primeiro Domínio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DomainsPage;
