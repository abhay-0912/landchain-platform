'use client';
import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/components/auth/AuthProvider';
import api from '@/lib/api';
import { formatDate, shortenHash } from '@/lib/utils';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [transfersRes, activityRes] = await Promise.allSettled([
        api.get('/transfers/pending'),
        api.get('/audit/recent'),
      ]);
      const transfers = transfersRes.status === 'fulfilled' ? transfersRes.value.data.transfers || [] : [];
      const activity = activityRes.status === 'fulfilled' ? activityRes.value.data.logs || [] : [];
      setPendingTransfers(transfers);
      setActivityFeed(activity.slice(0, 10));
      setStats({
        pending: transfers.filter(t => t.status === 'pending').length,
        approved: transfers.filter(t => t.status === 'approved').length,
        rejected: transfers.filter(t => t.status === 'rejected').length,
      });
    } catch {
      toast.error('Failed to load officer dashboard.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(transferId, action) {
    setActionLoading(prev => ({ ...prev, [transferId]: action }));
    try {
      await api.patch(`/transfers/${transferId}/${action}`);
      toast.success(`Transfer ${action === 'approve' ? 'approved' : 'rejected'} successfully.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} transfer.`);
    } finally {
      setActionLoading(prev => ({ ...prev, [transferId]: null }));
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Officer Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve property transactions</p>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
              { label: 'Approved', value: stats.approved, icon: CheckCircle, color: 'bg-accent-50 text-accent-700' },
              { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'bg-red-50 text-red-700' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card">
                  <div className={`stat-icon ${s.color}`}><Icon size={22} /></div>
                  <div>
                    <p className="stat-value">{s.value}</p>
                    <p className="stat-label">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Transfers */}
          <div id="approvals" className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList size={20} className="text-primary-600" />
              Pending Transfer Approvals
            </h2>
            {pendingTransfers.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No pending transfers. 🎉
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">From</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">To</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingTransfers.map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {tx.property?.surveyNumber || shortenHash(tx.propertyId)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{tx.from?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{tx.to?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="warning" dot>{tx.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(tx._id, 'approve')}
                              disabled={!!actionLoading[tx._id]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                            >
                              {actionLoading[tx._id] === 'approve' ? (
                                <span className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin" />
                              ) : <CheckCircle size={13} />}
                              Approve
                            </button>
                            <button
                              onClick={() => handleAction(tx._id, 'reject')}
                              disabled={!!actionLoading[tx._id]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                            >
                              {actionLoading[tx._id] === 'reject' ? (
                                <span className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin" />
                              ) : <XCircle size={13} />}
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div id="activity">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-primary-600" />
              Recent Activity
            </h2>
            {activityFeed.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No recent activity.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {activityFeed.map((log, i) => (
                  <div key={log._id || i} className="flex items-start gap-4 px-5 py-4">
                    <div className="h-2 w-2 rounded-full bg-primary-500 mt-2 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{log.action || log.message}</p>
                      {log.user && <p className="text-xs text-gray-500 mt-0.5">by {log.user.name}</p>}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
