import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface TestResult {
  domain: string;
  timestamp: string;
  request: any;
  response: any;
  error: any;
}

const DiagnosticTest: React.FC = () => {
  const { user, loading } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  const testDomain = async (domain: string) => {
    const timestamp = new Date().toISOString();
    setTesting(true);

    const requestData = {
      action: 'check',
      fqdn: domain
    };

    console.log(`[TEST] Testing ${domain}...`);
    console.log('[TEST] Request:', requestData);

    try {
      const apiUrl = `${SUPABASE_URL}/functions/v1/domains/availability`;
      console.log('[TEST] API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
        signal: AbortSignal.timeout(30000)
      });

      console.log('[TEST] Response status:', response.status);

      const responseData = await response.json();
      console.log('[TEST] Response data:', responseData);

      setResults(prev => [{
        domain,
        timestamp,
        request: requestData,
        response: {
          status: response.status,
          ok: response.ok,
          data: responseData
        },
        error: null
      }, ...prev]);

    } catch (error) {
      console.error('[TEST] Error:', error);
      setResults(prev => [{
        domain,
        timestamp,
        request: requestData,
        response: null,
        error: {
          message: error instanceof Error ? error.message : String(error),
          name: error instanceof Error ? error.name : 'Unknown'
        }
      }, ...prev]);
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    const loadUserInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading customer:', error);
          setUserInfo({ error: error.message });
        } else {
          setUserInfo(data);
        }
      } catch (err) {
        console.error('Exception:', err);
        setUserInfo({ error: String(err) });
      }
    };

    loadUserInfo();
  }, [user]);

  const forceAdminRole = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('customers')
        .upsert({
          user_id: user.id,
          email: user.email,
          role: 'admin',
          has_active_subscription: true,
          subscription_plan: 'supreme'
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        alert('Erro: ' + error.message);
      } else {
        alert('✅ Role atualizada para admin! Recarregue a página.');
        window.location.reload();
      }
    } catch (err) {
      alert('Erro: ' + err);
    }
  };

  const testAllScenarios = async () => {
    const domains = ['cidades.email', 'melissa.email', 'api.email'];
    for (const domain of domains) {
      await testDomain(domain);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Diagnostic Test - User Info</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current User (AuthContext)</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Data (Database)</h2>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
            {JSON.stringify(userInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Access Check</h2>
          <div className="space-y-2 text-sm mb-4">
            <div><strong>Is Admin:</strong> {user?.role === 'admin' ? '✅ YES' : '❌ NO'}</div>
            <div><strong>Has Active Subscription:</strong> {user?.hasActiveSubscription ? '✅ YES' : '❌ NO'}</div>
            <div><strong>Subscription Plan:</strong> {user?.subscriptionPlan || 'none'}</div>
            <div><strong>Can Access Dashboard:</strong> {(user?.role === 'admin' || user?.hasActiveSubscription) ? '✅ YES' : '❌ NO - Will redirect to /valores'}</div>
          </div>
          {user?.role !== 'admin' && (
            <button
              onClick={forceAdminRole}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              🔧 Force Admin Role (DEBUG)
            </button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment</h2>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>SUPABASE_URL:</strong> {SUPABASE_URL}</div>
            <div><strong>ANON_KEY:</strong> {SUPABASE_ANON_KEY?.substring(0, 50)}...</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="flex gap-4">
            <button
              onClick={() => testDomain('cidades.email')}
              disabled={testing}
              className="px-4 py-2 bg-slate-700 text-white rounded hover:bg-slate-800 disabled:bg-gray-400"
            >
              Test: cidades.email (Standard)
            </button>
            <button
              onClick={() => testDomain('melissa.email')}
              disabled={testing}
              className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 disabled:bg-gray-400"
            >
              Test: melissa.email (Premium)
            </button>
            <button
              onClick={() => testDomain('api.email')}
              disabled={testing}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
            >
              Test: api.email (Taken)
            </button>
            <button
              onClick={testAllScenarios}
              disabled={testing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              Test All
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {results.map((result, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{result.domain}</h3>
                <span className="text-sm text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Request:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(result.request, null, 2)}
                  </pre>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Response:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                    {result.error
                      ? JSON.stringify(result.error, null, 2)
                      : JSON.stringify(result.response, null, 2)
                    }
                  </pre>
                </div>
              </div>

              {result.response?.data && (
                <div className="mt-4 p-4 bg-slate-50 rounded">
                  <h4 className="font-semibold mb-2">Parsed Result:</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Available:</strong> {result.response.data.available ? '✅ YES' : '❌ NO'}</div>
                    <div><strong>Is Premium:</strong> {result.response.data.isPremium ? '⭐ YES' : 'NO'}</div>
                    <div><strong>Price USD:</strong> ${result.response.data.pricing?.salePriceUSD ?? 'null'}</div>
                    <div><strong>Renewal USD:</strong> ${result.response.data.pricing?.renewalSalePriceUSD ?? 'null'}</div>
                    <div><strong>Markup:</strong> {result.response.data.pricing?.markupApplied ?? 'none'}</div>
                    <div><strong>Source:</strong> {result.response.data.source ?? 'unknown'}</div>
                    {result.response.data.error && (
                      <div className="text-red-600"><strong>Error:</strong> {result.response.data.error}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {results.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            Click a button above to test domain availability checking
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticTest;
