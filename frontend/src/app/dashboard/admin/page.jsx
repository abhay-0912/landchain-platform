'use client';
import { useEffect, useState } from 'react';
import { Users, Shield, BarChart3, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import api from '@/lib/api';
import { formatDate, getRoleLabel } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.allSettled([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/audit/logs'),
      ]);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data.users || []);
      if (logsRes.status === 'fulfilled') setLogs(logsRes.value.data.logs || []);
    } catch {
      toast.error('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleUserStatus(userId, currentStatus) {
    try {
      const action = currentStatus === 'active' ? 'suspend' : 'activate';
      await api.patch(`/admin/users/${userId}/${action}`);
      toast.success(`User ${action}d.`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed.');
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">System-wide overview and management</p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" className="py-20" /> : (
        <>
          {/* Stats */}
          <div id="stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Users', value: stats?.users?.total ?? users.length, icon: Users, color: 'bg-primary-50 text-primary-700' },
              { label: 'Properties', value: stats?.properties?.total ?? '—', icon: Shield, color: 'bg-accent-50 text-accent-700' },
              { label: 'Transactions', value: stats?.transactions?.total ?? '—', icon: BarChart3, color: 'bg-blue-50 text-blue-700' },
              { label: 'Pending KYC', value: stats?.kyc?.pending ?? '—', icon: AlertTriangle, color: 'bg-yellow-50 text-yellow-700' },
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

          {/* Role Breakdown */}
          {stats?.users?.byRole && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {Object.entries(stats.users.byRole).map(([role, count]) => (
                <div key={role} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{getRoleLabel(role)}</p>
                </div>
              ))}
            </div>
          )}

          {/* User Management */}
          <div id="users" className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-primary-600" /> User Management
            </h2>
            {users.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">No users found.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">KYC</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          <Badge variant="primary">{getRoleLabel(u.role)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.kycStatus === 'verified' ? 'accent' : u.kycStatus === 'pending' ? 'warning' : 'default'}>
                            {u.kycStatus || 'N/A'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={u.status === 'active' ? 'accent' : 'danger'} dot>
                            {u.status || 'active'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleUserStatus(u._id, u.status)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                              u.status === 'active'
                                ? 'text-red-700 bg-red-50 hover:bg-red-100'
                                : 'text-accent-700 bg-accent-50 hover:bg-accent-100'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Logs */}
          <div id="logs">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-600" /> Audit Logs
            </h2>
            {logs.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">No audit logs.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Timestamp</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Resource</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.slice(0, 20).map((log, i) => (
                      <tr key={log._id || i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(log.createdAt)}</td>
                        <td className="px-4 py-3 text-gray-700">{log.user?.name || 'System'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={log.severity === 'error' ? 'danger' : log.severity === 'warn' ? 'warning' : 'info'}>
                            {log.action}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{log.resource || '—'}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs font-mono">{log.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
