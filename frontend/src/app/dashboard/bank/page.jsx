'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Search, Plus, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import api from '@/lib/api';
import { formatDate, formatCurrency, shortenHash } from '@/lib/utils';

export default function BankDashboard() {
  const [mortgages, setMortgages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMortgageModal, setShowMortgageModal] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: searchReg, handleSubmit: handleSearch } = useForm();

  useEffect(() => { fetchMortgages(); }, []);

  async function fetchMortgages() {
    try {
      const { data } = await api.get('/mortgages/bank');
      setMortgages(data.mortgages || []);
    } catch {
      toast.error('Failed to load mortgages.');
    } finally {
      setLoading(false);
    }
  }

  async function onRegisterMortgage(data) {
    try {
      await api.post('/mortgages', data);
      toast.success('Mortgage registered on blockchain.');
      reset();
      setShowMortgageModal(false);
      fetchMortgages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register mortgage.');
    }
  }

  async function onSearchTitle({ propertyId }) {
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const { data } = await api.get(`/properties/${propertyId}`);
      setSearchResult(data.property);
    } catch (err) {
      toast.error('Property not found.');
    } finally {
      setSearchLoading(false);
    }
  }

  async function releaseMortgage(mortgageId) {
    setReleaseLoading(prev => ({ ...prev, [mortgageId]: true }));
    try {
      await api.patch(`/mortgages/${mortgageId}/release`);
      toast.success('Mortgage released successfully.');
      fetchMortgages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release mortgage.');
    } finally {
      setReleaseLoading(prev => ({ ...prev, [mortgageId]: false }));
    }
  }

  const active = mortgages.filter(m => m.status === 'active');

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage mortgages and title verifications</p>
        </div>
        <button
          onClick={() => setShowMortgageModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Register Mortgage
        </button>
      </div>

      {loading ? <LoadingSpinner size="lg" className="py-20" /> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Active Mortgages', value: active.length, color: 'bg-primary-50 text-primary-700' },
              { label: 'Total Mortgages', value: mortgages.length, color: 'bg-blue-50 text-blue-700' },
              { label: 'Released', value: mortgages.filter(m => m.status === 'released').length, color: 'bg-accent-50 text-accent-700' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl p-5 border ${s.color} border-current/20`}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm font-medium mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Title Verification Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Search size={18} className="text-primary-600" /> Title Verification
            </h2>
            <form onSubmit={handleSearch(onSearchTitle)} className="flex gap-3">
              <input
                {...searchReg('propertyId', { required: true })}
                placeholder="Enter Property ID or Survey Number"
                className="form-input flex-1"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {searchLoading ? <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Search size={16} />}
                Verify
              </button>
            </form>
            {searchResult && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{searchResult.surveyNumber}</p>
                  <Badge variant={searchResult.status === 'active' ? 'accent' : 'warning'} dot>
                    {searchResult.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{searchResult.city}, {searchResult.state}</p>
                <p className="text-sm text-gray-600">Owner: {searchResult.currentOwner?.name}</p>
                {searchResult.mortgage && (
                  <p className="text-sm text-red-600 mt-1">⚠ Property has an existing mortgage</p>
                )}
              </div>
            )}
          </div>

          {/* Active Mortgages Table */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard size={20} className="text-primary-600" /> Active Mortgages
            </h2>
            {mortgages.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500 text-sm">
                No mortgages registered yet.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Property</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Borrower</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {mortgages.map((m) => (
                      <tr key={m._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">
                          {m.property?.surveyNumber || shortenHash(m.propertyId)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.borrower?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-700">{formatCurrency(m.amount)}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(m.createdAt)}</td>
                        <td className="px-4 py-3">
                          <Badge variant={m.status === 'active' ? 'warning' : 'accent'} dot>{m.status}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {m.status === 'active' && (
                            <button
                              onClick={() => releaseMortgage(m._id)}
                              disabled={!!releaseLoading[m._id]}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                            >
                              {releaseLoading[m._id] ? (
                                <span className="h-3 w-3 border border-white/40 border-t-white rounded-full animate-spin" />
                              ) : <Unlock size={13} />}
                              Release
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Register Mortgage Modal */}
      <Modal
        isOpen={showMortgageModal}
        onClose={() => setShowMortgageModal(false)}
        title="Register Mortgage"
        footer={
          <button
            form="mortgage-form"
            type="submit"
            className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Register on Blockchain
          </button>
        }
      >
        <form id="mortgage-form" onSubmit={handleSubmit(onRegisterMortgage)} className="space-y-4">
          <div>
            <label className="form-label">Property ID</label>
            <input {...register('propertyId', { required: 'Required' })} className="form-input" placeholder="Property ID" />
            {errors.propertyId && <p className="form-error">{errors.propertyId.message}</p>}
          </div>
          <div>
            <label className="form-label">Borrower Wallet Address</label>
            <input {...register('borrowerAddress', { required: 'Required' })} className="form-input" placeholder="0x..." />
            {errors.borrowerAddress && <p className="form-error">{errors.borrowerAddress.message}</p>}
          </div>
          <div>
            <label className="form-label">Loan Amount (₹)</label>
            <input {...register('amount', { required: 'Required', min: 1 })} type="number" className="form-input" placeholder="e.g. 5000000" />
            {errors.amount && <p className="form-error">{errors.amount.message}</p>}
          </div>
          <div>
            <label className="form-label">Interest Rate (%)</label>
            <input {...register('interestRate', { required: 'Required' })} type="number" step="0.01" className="form-input" placeholder="e.g. 8.5" />
          </div>
          <div>
            <label className="form-label">Tenure (months)</label>
            <input {...register('tenure', { required: 'Required' })} type="number" className="form-input" placeholder="e.g. 240" />
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
