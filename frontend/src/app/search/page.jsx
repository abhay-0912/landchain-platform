'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Search, MapPin, Hash, User, Building } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import PropertyCard from '@/components/property/PropertyCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function SearchPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const { register, handleSubmit } = useForm();

  async function onSubmit(data) {
    const params = {};
    Object.entries(data).forEach(([k, v]) => { if (v?.trim()) params[k] = v.trim(); });

    if (!Object.keys(params).length) {
      toast.error('Please enter at least one search parameter.');
      return;
    }

    setLoading(true);
    setSearched(false);
    try {
      const { data: res } = await api.get('/properties/search', { params });
      setResults(res.properties || res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-700 to-primary-900 py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-3">Search Properties</h1>
          <p className="text-primary-200">Find any registered property using public records</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Hash size={14} /> Property ID
                </label>
                <input
                  {...register('propertyId')}
                  placeholder="e.g. PROP-001234"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Hash size={14} /> Survey Number
                </label>
                <input
                  {...register('surveyNumber')}
                  placeholder="e.g. 45/2A"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <User size={14} /> Owner Name
                </label>
                <input
                  {...register('ownerName')}
                  placeholder="Enter owner name"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label flex items-center gap-1.5">
                  <Building size={14} /> City
                </label>
                <input
                  {...register('city')}
                  placeholder="e.g. Mumbai"
                  className="form-input"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center gap-2 px-8 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
                  Searching…
                </>
              ) : (
                <>
                  <Search size={16} />
                  Search Properties
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {loading && (
          <div className="py-16">
            <LoadingSpinner size="lg" />
            <p className="text-center text-gray-500 mt-4 text-sm">Searching blockchain records…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="text-center py-16">
            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-sm text-gray-500">Try different search parameters or check the spelling.</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-4 font-medium">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {results.map((property) => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
