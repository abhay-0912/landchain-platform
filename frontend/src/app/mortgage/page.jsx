'use client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CreditCard, Plus, Unlock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatCurrency, shortenHash } from '@/lib/utils';

export default function MortgagePage() {
  const [mortgages, setMortgages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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

  async function onSubmit(data) {
    setSubmitLoading(true);
    try {
      await api.post('/mortgages', data);
      toast.success('Mortgage registered successfully.');
      reset();
      fetchMortgages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register mortgage.');
    } finally {
      setSubmitLoading(false);
    }
  }

  async function releaseMortgage(id) {
    setReleaseLoading(prev => ({ ...prev, [id]: true }));
    try {
      await api.patch(`/mortgages/${id}/release`);
      toast.success('Mortgage released.');
      fetchMortgages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Release failed.');
    } finally {
      setReleaseLoading(prev => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CreditCard className="text-primary-600" size={28} /> Mortgage Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Register and manage property mortgages on-chain</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
                <Plus size={18} className="text-primary-600" /> Register Mortgage
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="form-label">Property ID *</label>
                  <input {...register('propertyId', { required: 'Required' })} className="form-input" placeholder="Property ID" />
                  {errors.propertyId && <p className="form-error">{errors.propertyId.message}</p>}
                </div>
                <div>
                  <label className="form-label">Borrower Address *</label>
                  <input
                    {...register('borrowerAddress', { required: 'Required' })}
                    className="form-input"
                    placeholder="0x..."
                  />
                  {errors.borrowerAddress && <p className="form-error">{errors.borrowerAddress.message}</p>}
                </div>
                <div>
                  <label className="form-label">Loan Amount (₹) *</label>
                  <input
                    {...register('amount', { required: 'Required', min: 1 })}
                    type="number"
                    className="form-input"
                    placeholder="e.g. 5000000"
                  />
                  {errors.amount && <p className="form-error">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="form-label">Interest Rate (%)</label>
                  <input {...register('interestRate')} type="number" step="0.01" className="form-input" placeholder="8.5" />
                </div>
                <div>
                  <label className="form-label">Tenure (months)</label>
                  <input {...register('tenure')} type="number" className="form-input" placeholder="240" />
                </div>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitLoading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Register on Blockchain
                </button>
              </form>
            </div>
          </div>

          {/* Mortgages Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Managed Mortgages</h2>
              {loading ? (
                <LoadingSpinner className="py-12" />
              ) : mortgages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No mortgages registered yet.</div>
              ) : (
                <div className="overflow-auto">
                  <table className="w-full text-sm min-w-[500px]">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Property</th>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                        <th className="text-left pb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {mortgages.map((m) => (
                        <tr key={m._id} className="hover:bg-gray-50">
                          <td className="py-3 font-mono text-xs text-gray-700 pr-4">
                            {m.property?.surveyNumber || shortenHash(m.propertyId)}
                          </td>
                          <td className="py-3 text-gray-700 pr-4">{formatCurrency(m.amount)}</td>
                          <td className="py-3 text-gray-500 pr-4">{formatDate(m.createdAt)}</td>
                          <td className="py-3 pr-4">
                            <Badge variant={m.status === 'active' ? 'warning' : 'accent'} dot>{m.status}</Badge>
                          </td>
                          <td className="py-3">
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
          </div>
        </div>
      </div>
    </div>
  );
}
