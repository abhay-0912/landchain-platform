'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function TaxRecordsPage() {
  const { propertyId } = useParams();
  const [records, setRecords] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTax() {
      try {
        const [taxRes, propRes] = await Promise.allSettled([
          api.get(`/tax/${propertyId}`),
          api.get(`/properties/${propertyId}`),
        ]);
        if (taxRes.status === 'fulfilled') setRecords(taxRes.value.data.taxRecords || taxRes.value.data.records || []);
        if (propRes.status === 'fulfilled') setProperty(propRes.value.data.property || propRes.value.data);
      } catch {
        toast.error('Failed to load tax records.');
      } finally {
        setLoading(false);
      }
    }
    if (propertyId) fetchTax();
  }, [propertyId]);

  const outstanding = records.filter(r => r.status === 'pending' || r.status === 'overdue');
  const totalDue = outstanding.reduce((acc, r) => acc + (r.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href={`/property/${propertyId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Property
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={24} className="text-primary-600" />
            Tax Records
          </h1>
          {property && (
            <p className="text-gray-500 text-sm mt-1">
              {property.surveyNumber} — {property.city}, {property.state}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <>
            {/* Outstanding dues banner */}
            {totalDue > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-start gap-4">
                <AlertTriangle size={22} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Outstanding Tax Due</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    {formatCurrency(totalDue)} is pending across {outstanding.length} unpaid record{outstanding.length > 1 ? 's' : ''}.
                  </p>
                </div>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Pay Now
                </button>
              </div>
            ) : (
              <div className="bg-accent-50 border border-accent-200 rounded-xl p-5 mb-6 flex items-center gap-4">
                <CheckCircle size={22} className="text-accent-600" />
                <p className="text-accent-800 font-medium text-sm">All taxes are paid up to date.</p>
              </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-base font-semibold text-gray-900">Payment History</h2>
              </div>
              {records.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No tax records found.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Year</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Due Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Paid On</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {records.map((rec, i) => (
                      <tr key={rec._id || i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-900 font-medium">{rec.financialYear || rec.year}</td>
                        <td className="px-6 py-4 text-gray-700">{formatCurrency(rec.amount)}</td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(rec.dueDate)}</td>
                        <td className="px-6 py-4 text-gray-500">{rec.paidOn ? formatDate(rec.paidOn) : '—'}</td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={rec.status === 'paid' ? 'accent' : rec.status === 'overdue' ? 'danger' : 'warning'}
                            dot
                          >
                            {rec.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {rec.receiptUrl ? (
                            <a href={rec.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-xs">
                              View
                            </a>
                          ) : rec.status !== 'paid' ? (
                            <button className="text-xs px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                              Pay
                            </button>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
