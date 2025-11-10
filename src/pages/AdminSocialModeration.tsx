import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Eye, Trash2, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { AdminPageHeader } from '../components/AdminPageHeader';
import PageLayout from '../components/PageLayout';
import { useScrollToTop } from '../hooks/useScrollToTop';

interface Report {
  id: string;
  reporter_id: string;
  reported_post_id?: string;
  reported_comment_id?: string;
  reported_user_id?: string;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
  reporter?: {
    email: string;
  };
  reported_post?: {
    caption: string;
    user_id: string;
  };
  reported_comment?: {
    content: string;
  };
}

export default function AdminSocialModeration() {
  useScrollToTop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadReports();
  }, [user?.id, user?.role, filter]);

  const loadReports = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('social_reports')
        .select(`
          *,
          reporter:customers!social_reports_reporter_id_fkey(email),
          reported_post:social_posts(caption, user_id),
          reported_comment:social_comments(content)
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewReport = async (reportId: string, action: 'dismiss' | 'resolve', deactivateContent: boolean = false) => {
    try {
      setProcessing(true);

      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      if (deactivateContent) {
        if (report.reported_post_id) {
          await supabase
            .from('social_posts')
            .update({ is_active: false })
            .eq('id', report.reported_post_id);
        } else if (report.reported_comment_id) {
          await supabase
            .from('social_comments')
            .update({ is_active: false })
            .eq('id', report.reported_comment_id);
        }
      }

      const { error } = await supabase
        .from('social_reports')
        .update({
          status: action === 'dismiss' ? 'dismissed' : 'resolved',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          resolution_notes: deactivateContent ? 'Content deactivated' : 'No action taken'
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.filter(r => r.id !== reportId));
      setSelectedReport(null);
    } catch (err) {
      console.error('Error reviewing report:', err);
      alert('Failed to process report');
    } finally {
      setProcessing(false);
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      harassment: 'Harassment',
      misleading: 'False Information',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-800',
      inappropriate: 'bg-red-100 text-red-800',
      harassment: 'bg-orange-100 text-orange-800',
      misleading: 'bg-slate-100 text-slate-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[reason] || colors.other;
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#F5F5F5] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AdminPageHeader
            title="Moderação Social"
            description="Revise e modere conteúdo reportado por usuários"
            onRefresh={loadReports}
            refreshing={loading}
          />

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Total</p>
              <p className="text-3xl font-bold text-black">{reports.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Em Análise</p>
              <p className="text-3xl font-bold text-blue-600">{reports.filter(r => r.status === 'reviewing').length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
              <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Resolvidos</p>
              <p className="text-3xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</p>
            </div>
          </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {['all', 'pending', 'reviewing', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-slate-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-slate-900" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No reports to review</p>
              </div>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(report.reason)}`}>
                          {getReasonLabel(report.reason)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {report.description && (
                        <p className="text-sm text-gray-700 mb-2">{report.description}</p>
                      )}

                      {report.reported_post && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Reported Post:</p>
                          <p className="text-sm text-gray-900">{report.reported_post.caption}</p>
                        </div>
                      )}

                      {report.reported_comment && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Reported Comment:</p>
                          <p className="text-sm text-gray-900">{report.reported_comment.content}</p>
                        </div>
                      )}

                      <p className="text-xs text-gray-500 mt-2">
                        Reported by: {report.reporter?.email || 'Unknown'}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReviewReport(report.id, 'dismiss', false)}
                        disabled={processing}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleReviewReport(report.id, 'resolve', true)}
                        disabled={processing}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-1 text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove & Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </div>
      </div>
    </PageLayout>
  );
}
