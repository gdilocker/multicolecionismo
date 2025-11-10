import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TrendingUp, Eye, MousePointerClick, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsDashboardProps {
  profileId: string;
  totalViews: number;
}

interface LinkStats {
  link_id: string;
  link_title: string;
  clicks: number;
}

export default function AnalyticsDashboard({ profileId, totalViews }: AnalyticsDashboardProps) {
  const [linkStats, setLinkStats] = useState<LinkStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, [profileId]);

  const loadAnalytics = async () => {
    try {
      // Get link clicks from profile_links table
      const { data: links, error: linksError } = await supabase
        .from('profile_links')
        .select('id, title, click_count')
        .eq('profile_id', profileId)
        .order('click_count', { ascending: false });

      if (linksError) throw linksError;

      if (links) {
        const stats = links.map(link => ({
          link_id: link.id,
          link_title: link.title,
          clicks: link.click_count || 0,
        }));

        setLinkStats(stats);
        setTotalClicks(stats.reduce((sum, stat) => sum + stat.clicks, 0));
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm font-medium mb-1">Total de Visualizações</p>
          <p className="text-white text-3xl font-bold">{totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <MousePointerClick className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm font-medium mb-1">Total de Clicks</p>
          <p className="text-white text-3xl font-bold">{totalClicks.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-white text-opacity-90 text-sm font-medium mb-1">Taxa de Conversão</p>
          <p className="text-white text-3xl font-bold">
            {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : '0.0'}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Performance por Link</h3>
            <p className="text-sm text-slate-600">Veja quais links são mais populares</p>
          </div>
        </div>

        {linkStats.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600">Nenhum dado disponível ainda</p>
            <p className="text-sm text-slate-500 mt-1">Os dados aparecerão quando seus links forem clicados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {linkStats.map((stat, index) => {
              const maxClicks = Math.max(...linkStats.map(s => s.clicks), 1);
              const percentage = (stat.clicks / maxClicks) * 100;

              return (
                <motion.div
                  key={stat.link_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-800 font-medium">{stat.link_title}</span>
                    <span className="text-slate-600 text-sm">{stat.clicks} clicks</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
