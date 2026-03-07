'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, ArrowRightLeft, CreditCard, FileText, Plus, ChevronRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PropertyCard from '@/components/property/PropertyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/components/auth/AuthProvider';
import api from '@/lib/api';
import { formatDate, formatCurrency, shortenHash } from '@/lib/utils';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [propsRes, txRes] = await Promise.allSettled([
          api.get('/properties/my'),
          api.get('/transfers/my'),
        ]);
        setData({
          properties: propsRes.status === 'fulfilled' ? propsRes.value.data.properties || [] : [],
          transactions: txRes.status === 'fulfilled' ? txRes.value.data.transfers || [] : [],
        });
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = [
    { label: 'My Properties', value: data?.properties?.length ?? '—', icon: Home, color: 'bg-primary-50 text-primary-700' },
    { label: 'Pending Transfers', value: data?.transactions?.filter(t => t.status === 'pending')?.length ?? '—', icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Documents', value: data?.properties?.reduce((acc, p) => acc + (p.documents?.length || 0), 0) ?? '—', icon: FileText, color: 'bg-blue-50 text-blue-700' },
    { label: 'Transactions', value: data?.transactions?.length ?? '—', icon: ArrowRightLeft, color: 'bg-accent-50 text-accent-700' },
  ];

  return (
    <DashboardLayout>
      {/* Welcome */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0] || 'Citizen'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Here's an overview of your land records.</p>
        </div>
        <Link
          href="/property/register"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Register Property
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="stat-card">
                  <div className={`stat-icon ${s.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="stat-value">{s.value}</p>
                    <p className="stat-label">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Properties */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Properties</h2>
              <Link href="/search" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
                Search all <ChevronRight size={14} />
              </Link>
            </div>
            {data?.properties?.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <Home size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium mb-2">No properties registered yet</p>
                <p className="text-sm text-gray-400 mb-6">Register your first property to get started.</p>
                <Link
                  href="/property/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={16} /> Register Property
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.properties.map((p) => (
                  <PropertyCard key={p._id} property={p} />
                ))}
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            {data?.transactions?.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No transactions found.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.transactions.slice(0, 8).map((tx) => (
                      <tr key={tx._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          <Link href={`/property/${tx.property?._id || tx.propertyId}`} className="hover:text-primary-600">
                            {tx.property?.surveyNumber || shortenHash(tx.propertyId)}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{tx.type || 'Transfer'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={tx.status === 'completed' ? 'accent' : tx.status === 'pending' ? 'warning' : 'danger'}
                            dot
                          >
                            {tx.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-primary-600">
                          {tx.txHash ? shortenHash(tx.txHash) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { href: '/property/register', icon: Plus, label: 'Register Property', color: 'bg-primary-50 border-primary-200 text-primary-700' },
              { href: '/property/transfer', icon: ArrowRightLeft, label: 'Transfer Property', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { href: '/search', icon: FileText, label: 'Search Records', color: 'bg-accent-50 border-accent-200 text-accent-700' },
            ].map(({ href, icon: Icon, label, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-4 rounded-xl border ${color} hover:opacity-80 transition-opacity`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{label}</span>
                <ChevronRight size={16} className="ml-auto" />
              </Link>
            ))}
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
