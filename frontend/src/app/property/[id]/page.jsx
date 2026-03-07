'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  MapPin, Ruler, Hash, Calendar, User, Shield,
  ExternalLink, FileText, Clock, CreditCard, ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import OwnershipTimeline from '@/components/property/OwnershipTimeline';
import DocumentList from '@/components/property/DocumentList';
import { formatDate, formatArea, shortenHash, formatCurrency } from '@/lib/utils';

const PropertyMap = dynamic(() => import('@/components/property/PropertyMap'), { ssr: false });

const statusVariant = {
  active: 'accent',
  mortgaged: 'warning',
  disputed: 'danger',
  pending: 'info',
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const { data } = await api.get(`/properties/${id}`);
        setProperty(data.property || data);
      } catch (err) {
        toast.error('Property not found or you don\'t have access.');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchProperty();
  }, [id]);

  if (loading) return <LoadingSpinner size="xl" className="min-h-screen" />;
  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-500 mb-6">The property you're looking for doesn't exist or is not accessible.</p>
          <Link href="/search" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
            Search Properties
          </Link>
        </div>
      </div>
    );
  }

  const {
    surveyNumber, city, state, area, status, currentOwner,
    coordinates, ownershipHistory = [], documents = [], taxRecords = [],
    createdAt, blockchainTxHash, tokenId, mortgage,
  } = property;

  const lat = coordinates?.lat || coordinates?.latitude;
  const lng = coordinates?.lng || coordinates?.longitude;

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-4 transition-colors">
            <ChevronLeft size={16} /> Back to Search
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">Survey No: {surveyNumber}</h1>
                <Badge variant={statusVariant[status?.toLowerCase()] || 'default'} dot>
                  {status || 'Unknown'}
                </Badge>
              </div>
              <p className="text-gray-600 flex items-center gap-1.5">
                <MapPin size={14} /> {city}, {state}
              </p>
            </div>
            <Link
              href={`/property/${id}/history`}
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
            >
              <Clock size={16} /> View Full History
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: Hash, label: 'Survey Number', value: surveyNumber },
                  { icon: Ruler, label: 'Area', value: formatArea(area) },
                  { icon: MapPin, label: 'City', value: city },
                  { icon: MapPin, label: 'State', value: state },
                  { icon: Calendar, label: 'Registered', value: formatDate(createdAt) },
                  { icon: Hash, label: 'Token ID', value: tokenId || 'N/A' },
                  lat && { icon: MapPin, label: 'Latitude', value: lat },
                  lng && { icon: MapPin, label: 'Longitude', value: lng },
                ].filter(Boolean).map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                      <Icon size={12} />{label}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            {lat && lng && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Property Location</h2>
                <div className="h-72 rounded-xl overflow-hidden">
                  <PropertyMap lat={parseFloat(lat)} lng={parseFloat(lng)} title={`${surveyNumber} - ${city}`} />
                </div>
              </div>
            )}

            {/* Ownership History */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Ownership History</h2>
              <OwnershipTimeline history={ownershipHistory} />
            </div>

            {/* Documents */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-5">Documents</h2>
              <DocumentList documents={documents} />
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Current Owner */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Current Owner</h2>
              {currentOwner ? (
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg shrink-0">
                    {currentOwner.name?.[0]?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{currentOwner.name}</p>
                    {currentOwner.email && <p className="text-sm text-gray-500">{currentOwner.email}</p>}
                    {currentOwner.walletAddress && (
                      <p className="text-xs font-mono text-gray-400 mt-1">{shortenHash(currentOwner.walletAddress)}</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Owner information not available.</p>
              )}
            </div>

            {/* Blockchain Info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield size={16} className="text-primary-600" /> Blockchain Record
              </h2>
              <div className="space-y-3">
                {blockchainTxHash && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-gray-700 truncate">{shortenHash(blockchainTxHash)}</p>
                      <a href={`https://etherscan.io/tx/${blockchainTxHash}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={14} className="text-primary-600 hover:text-primary-800" />
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Property ID</p>
                  <p className="text-xs font-mono text-gray-700">{id}</p>
                </div>
              </div>
            </div>

            {/* Mortgage Info */}
            {mortgage && (
              <div className="bg-yellow-50 rounded-2xl border border-yellow-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-yellow-700" /> Mortgage Details
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lender</span>
                    <span className="font-medium text-gray-900">{mortgage.lender?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium text-gray-900">{formatCurrency(mortgage.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rate</span>
                    <span className="font-medium text-gray-900">{mortgage.interestRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge variant="warning">{mortgage.status}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Tax Records */}
            {taxRecords.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Tax Records</h2>
                <Link
                  href={`/tax/${id}`}
                  className="inline-flex items-center gap-2 text-sm text-primary-600 hover:underline"
                >
                  <FileText size={14} /> View Tax History
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
