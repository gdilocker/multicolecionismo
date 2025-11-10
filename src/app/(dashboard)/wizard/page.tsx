import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProvisioningStepper } from '../../../components/ProvisioningStepper';
import { useAuth } from '../../../contexts/AuthContext';
import { dbQueries } from '../../../lib/db/queries';
import { createNamecheap } from '../../../server/adapters/namecheap';
import { createCloudflare } from '../../../server/adapters/cloudflare';
import { createEmailProvider } from '../../../server/adapters/emailProvider';

const WizardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [provisioning, setProvisioning] = useState(false);
  const [steps, setSteps] = useState<Array<{ label: string; status: string }>>([]);

  const checkAvailability = async () => {
    if (!domain) return;

    setLoading(true);
    setAvailable(null);

    try {
      const nc = createNamecheap();
      const result = await nc.checkAvailability(domain);
      setAvailable(result.available);
    } catch (error) {
      console.error('Error checking availability:', error);
      alert('Failed to check availability');
    } finally {
      setLoading(false);
    }
  };

  const handleProvision = async () => {
    if (!user) {
      alert('Please login first');
      navigate('/login');
      return;
    }

    setProvisioning(true);
    setSteps([
      { label: 'Processando pagamento', status: 'in_progress' },
      { label: 'Registrando domínio', status: 'pending' },
      { label: 'Provisionando e-mail', status: 'pending' },
      { label: 'Configurando DNS', status: 'pending' }
    ]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSteps([
        { label: 'Processando pagamento', status: 'completed' },
        { label: 'Registrando domínio', status: 'in_progress' },
        { label: 'Provisionando e-mail', status: 'pending' },
        { label: 'Configurando DNS', status: 'pending' }
      ]);

      const customerId = await dbQueries.getCustomerId(user.id);
      if (!customerId) throw new Error('Customer not found');

      const nc = createNamecheap();
      const reg = await nc.registerDomain(domain, 1);
      if (!reg.success) throw new Error('Domain registration failed');

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const domainRecord = await dbQueries.createDomain({
        customerId,
        fqdn: domain,
        registrarStatus: 'active',
        expiresAt: expiresAt.toISOString()
      });

      await dbQueries.createOrder({
        customerId,
        fqdn: domain,
        years: 1,
        plan: 'basic',
        totalCents: 12000,
        status: 'completed'
      });

      setSteps([
        { label: 'Processando pagamento', status: 'completed' },
        { label: 'Registrando domínio', status: 'completed' },
        { label: 'Provisionando e-mail', status: 'in_progress' },
        { label: 'Configurando DNS', status: 'pending' }
      ]);

      const ep = createEmailProvider();
      const emailDom = await ep.createDomain(domain);

      const mailDomain = await dbQueries.createMailDomain({
        domainId: domainRecord.id,
        providerRef: emailDom.providerRef,
        status: 'active'
      });

      await dbQueries.createMailbox({
        mailDomainId: mailDomain.id,
        localpart: 'admin',
        quotaMb: 5120,
        providerRef: 'mock-admin',
        status: 'active'
      });

      setSteps([
        { label: 'Processando pagamento', status: 'completed' },
        { label: 'Registrando domínio', status: 'completed' },
        { label: 'Provisionando e-mail', status: 'completed' },
        { label: 'Configurando DNS', status: 'in_progress' }
      ]);

      const cf = createCloudflare();
      await cf.applyDefaults({
        fqdn: domain,
        mxHost: 'mail..com.rich',
        spfInclude: '_spf..com.rich',
        dkimTxt: emailDom.dkim,
        dmarcPolicy: 'v=DMARC1; p=none; pct=100'
      });

      if (emailDom.dkim) {
        await dbQueries.createDNSRecord({
          domainId: domainRecord.id,
          type: 'TXT',
          name: `${emailDom.dkim.selector}._domainkey`,
          value: emailDom.dkim.value
        });
      }

      setSteps([
        { label: 'Processando pagamento', status: 'completed' },
        { label: 'Registrando domínio', status: 'completed' },
        { label: 'Provisionando e-mail', status: 'completed' },
        { label: 'Configurando DNS', status: 'completed' }
      ]);

      setProvisioning(false);
      alert(`${domain} provisionado com sucesso!\n\nCaixa inicial: admin@${domain}\nSenha: Temp#12345\n\nVocê já pode visualizar seus domínios.`);

      setTimeout(() => navigate('/domains'), 2000);
    } catch (error) {
      console.error('Provisioning error:', error);
      alert('Falha no provisionamento: ' + (error as Error).message);
      setSteps(prev => prev.map((step, idx) =>
        idx === prev.findIndex(s => s.status === 'in_progress')
          ? { ...step, status: 'failed' }
          : step
      ));
      setProvisioning(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 pt-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Assistente de Domínio</h1>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4">Busque seu domínio .email</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="meudominio.email"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && checkAvailability()}
            />
            <button
              onClick={checkAvailability}
              disabled={loading || !domain}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              Verificar
            </button>
          </div>

          {available !== null && (
            <div className="mt-4">
              {available ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700 font-medium">
                    {domain} está disponível!
                  </p>
                  <button
                    onClick={handleProvision}
                    disabled={provisioning}
                    className="mt-3 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {provisioning ? 'Provisionando...' : 'Comprar e Provisionar'}
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 font-medium">
                    {domain} não está disponível.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {steps.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-xl font-semibold mb-4">Status do Provisionamento</h2>
            <ProvisioningStepper steps={steps} />
          </div>
        )}

      </div>
    </div>
  );
};

export default WizardPage;
