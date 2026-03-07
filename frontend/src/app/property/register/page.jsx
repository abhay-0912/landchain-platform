'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Home, Upload, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function PropertyRegisterPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [propertyId, setPropertyId] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm();

  async function onSubmit(data) {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (k === 'documents') {
          if (v && v.length) {
            Array.from(v).forEach(file => fd.append('documents', file));
          }
        } else {
          fd.append(k, v);
        }
      });

      const { data: res } = await api.post('/properties/register', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPropertyId(res.property?._id || res._id || '');
      toast.success('Property registration submitted!');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 max-w-md w-full text-center">
          <div className="inline-flex p-4 bg-accent-50 rounded-2xl mb-6">
            <CheckCircle size={40} className="text-accent-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
          <p className="text-gray-600 text-sm mb-6">
            Your property registration is under review. A government officer will verify your documents.
          </p>
          <div className="flex gap-3">
            {propertyId && (
              <button
                onClick={() => router.push(`/property/${propertyId}`)}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
              >
                View Property
              </button>
            )}
            <button
              onClick={() => router.push('/dashboard/citizen')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-sm transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-600 rounded-2xl mb-4">
            <Home size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register Property</h1>
          <p className="text-sm text-gray-500 mt-1">Submit property details for blockchain registration</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Survey Number */}
              <div>
                <label className="form-label">Survey Number *</label>
                <input
                  {...register('surveyNumber', { required: 'Required' })}
                  className="form-input"
                  placeholder="e.g. 45/2A"
                />
                {errors.surveyNumber && <p className="form-error">{errors.surveyNumber.message}</p>}
              </div>

              {/* Area */}
              <div>
                <label className="form-label">Area (sq ft) *</label>
                <input
                  {...register('area', { required: 'Required', min: { value: 1, message: 'Must be > 0' } })}
                  type="number"
                  className="form-input"
                  placeholder="e.g. 2400"
                />
                {errors.area && <p className="form-error">{errors.area.message}</p>}
              </div>

              {/* City */}
              <div>
                <label className="form-label">City *</label>
                <input
                  {...register('city', { required: 'Required' })}
                  className="form-input"
                  placeholder="e.g. Mumbai"
                />
                {errors.city && <p className="form-error">{errors.city.message}</p>}
              </div>

              {/* State */}
              <div>
                <label className="form-label">State *</label>
                <input
                  {...register('state', { required: 'Required' })}
                  className="form-input"
                  placeholder="e.g. Maharashtra"
                />
                {errors.state && <p className="form-error">{errors.state.message}</p>}
              </div>

              {/* Latitude */}
              <div>
                <label className="form-label">Latitude</label>
                <input
                  {...register('latitude', {
                    pattern: { value: /^-?([1-8]?\d(\.\d+)?|90(\.0+)?)$/, message: 'Invalid latitude' },
                  })}
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 19.0760"
                />
                {errors.latitude && <p className="form-error">{errors.latitude.message}</p>}
              </div>

              {/* Longitude */}
              <div>
                <label className="form-label">Longitude</label>
                <input
                  {...register('longitude', {
                    pattern: { value: /^-?(1[0-7]\d(\.\d+)?|180(\.0+)?|\d{1,2}(\.\d+)?)$/, message: 'Invalid longitude' },
                  })}
                  type="number"
                  step="any"
                  className="form-input"
                  placeholder="e.g. 72.8777"
                />
                {errors.longitude && <p className="form-error">{errors.longitude.message}</p>}
              </div>
            </div>

            {/* Property Type */}
            <div>
              <label className="form-label">Property Type</label>
              <select {...register('propertyType')} className="form-input">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="agricultural">Agricultural</option>
                <option value="industrial">Industrial</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Documents */}
            <div>
              <label className="form-label">Supporting Documents *</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                <Upload size={28} className="mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-1">Upload title deed, encumbrance certificate, etc.</p>
                <p className="text-xs text-gray-400">PDF or images, max 10 MB each</p>
                <input
                  {...register('documents', { required: 'At least one document is required' })}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              {errors.documents && <p className="form-error">{errors.documents.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Submit for Blockchain Registration
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
