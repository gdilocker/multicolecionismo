import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Store, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface StoreProfile {
  subdomain: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  products_count?: number;
}

export default function StoresDirectory() {
  const [stores, setStores] = useState<StoreProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      setLoading(true);

      // Get profiles with at least one published product
      const { data: storesData, error } = await supabase
        .from('user_profiles')
        .select(`
          subdomain,
          display_name,
          bio,
          avatar_url
        `)
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;

      // Get product counts for each store
      const storesWithCounts = await Promise.all(
        (storesData || []).map(async (store) => {
          const { count } = await supabase
            .from('store_products')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .eq('user_id', (await supabase
              .from('user_profiles')
              .select('user_id')
              .eq('subdomain', store.subdomain)
              .single()
            ).data?.user_id || '');

          return {
            ...store,
            products_count: count || 0
          };
        })
      );

      // Filter stores with products
      setStores(storesWithCounts.filter(s => s.products_count && s.products_count > 0));
    } catch (error) {
      console.error('Error loading stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store =>
    store.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.bio?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Diretório de Lojas
          </h1>
          <p className="text-xl text-gray-600">
            Descubra lojas e membros da comunidade
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar lojas..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchTerm ? 'Nenhuma loja encontrada' : 'Nenhuma loja disponível'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {filteredStores.length} loja{filteredStores.length !== 1 ? 's' : ''} encontrada{filteredStores.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStores.map((store) => (
                <Link
                  key={store.subdomain}
                  to={`/${store.subdomain}`}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    {store.avatar_url ? (
                      <img
                        src={store.avatar_url}
                        alt={store.display_name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-600">
                          {store.display_name[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Store Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">
                        {store.display_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        @{store.subdomain}
                      </p>
                      {store.bio && (
                        <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                          {store.bio}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store className="w-4 h-4" />
                        <span>{store.products_count} produto{store.products_count !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visit Store Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-blue-600 hover:text-blue-700 font-medium">
                      <span>Visitar Loja</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
