'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import OwnershipTimeline from '@/components/property/OwnershipTimeline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function PropertyHistoryPage() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await api.get(`/properties/${id}/history`);
        setHistory(data.history || data.ownershipHistory || []);
        setProperty(data.property || null);
      } catch (err) {
        toast.error('Failed to load ownership history.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchHistory();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href={`/property/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Property
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Ownership History</h1>
          {property && (
            <p className="text-gray-500 text-sm mt-1">
              Survey No: {property.surveyNumber} — {property.city}, {property.state}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-6">
              {history.length} ownership {history.length === 1 ? 'record' : 'records'} found
            </p>
            <OwnershipTimeline history={history} />
          </div>
        )}
      </div>
    </div>
  );
}
