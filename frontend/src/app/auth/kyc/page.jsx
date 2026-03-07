'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Shield, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const docFields = [
  { name: 'aadhaar', label: 'Aadhaar Card', hint: 'PDF or image (max 5 MB)' },
  { name: 'pan', label: 'PAN Card', hint: 'PDF or image (max 5 MB)' },
  { name: 'addressProof', label: 'Address Proof', hint: 'Utility bill, passport, or voter ID' },
];

export default function KycPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  async function onSubmit(data) {
    setLoading(true);
    try {
      const formData = new FormData();
      docFields.forEach(({ name }) => {
        if (data[name]?.[0]) formData.append(name, data[name][0]);
      });

      await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('KYC documents submitted successfully! Verification takes 1-2 business days.');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'KYC submission failed. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Documents Submitted!</h2>
          <p className="text-gray-600 text-sm mb-8">
            Your KYC documents are under review. You'll receive an email once verified (usually within 1-2 business days).
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-600 rounded-2xl mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-sm text-gray-500 mt-1">Upload your identity documents to get verified</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Your documents are stored securely on IPFS and are only accessible to authorised government officers.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {docFields.map(({ name, label, hint }) => (
              <div key={name}>
                <label className="form-label">{label}</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-primary-400 transition-colors">
                  <Upload size={24} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-400">{hint}</p>
                  <input
                    {...register(name, { required: `${label} is required` })}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    style={{ position: 'relative' }}
                  />
                  {watch(name)?.[0] && (
                    <div className="mt-3 inline-flex items-center gap-2 bg-accent-50 text-accent-700 px-3 py-1 rounded-full text-xs font-medium">
                      <CheckCircle size={12} />
                      {watch(name)[0].name}
                    </div>
                  )}
                </div>
                {errors[name] && <p className="form-error">{errors[name].message}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
              Submit KYC Documents
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
