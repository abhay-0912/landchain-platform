'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft, Upload, CheckCircle, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const steps = ['Property Details', 'Upload Agreement', 'Confirm & Submit'];

export default function PropertyTransferPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, getValues } = useForm();

  function handleStep1(data) {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(1);
  }

  function handleStep2(data) {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(2);
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('propertyId', formData.propertyId);
      fd.append('buyerAddress', formData.buyerAddress);
      fd.append('saleAmount', formData.saleAmount);
      if (formData.agreement?.[0]) fd.append('agreement', formData.agreement[0]);

      const { data } = await api.post('/transfers/initiate', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTxHash(data.txHash || data.transfer?.txHash || '');
      toast.success('Transfer initiated successfully! Awaiting officer approval.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transfer failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 max-w-md w-full text-center">
          <div className="inline-flex p-4 bg-accent-50 rounded-2xl mb-6">
            <CheckCircle size={40} className="text-accent-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Transfer Initiated!</h2>
          <p className="text-gray-600 text-sm mb-4">
            Your transfer request has been submitted. A government officer will review and approve it.
          </p>
          {txHash && (
            <p className="text-xs font-mono bg-gray-50 rounded-lg px-4 py-3 text-gray-600 mb-6 break-all">
              Tx: {txHash}
            </p>
          )}
          <button
            onClick={() => router.push('/dashboard/citizen')}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-primary-600 rounded-2xl mb-4">
            <ArrowRightLeft size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Transfer Property</h1>
          <p className="text-sm text-gray-500 mt-1">Transfer ownership via smart contract</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-accent-100 text-accent-700' : 'bg-gray-100 text-gray-500'
              }`}>
                <span>{i + 1}</span>
                <span className="hidden sm:inline">{s}</span>
              </div>
              {i < steps.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          {/* Step 1 */}
          {step === 0 && (
            <form onSubmit={handleSubmit(handleStep1)} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Enter Property & Buyer Details</h2>
              <div>
                <label className="form-label">Property ID</label>
                <input
                  {...register('propertyId', { required: 'Required' })}
                  className="form-input"
                  placeholder="e.g. 64abc123..."
                />
                {errors.propertyId && <p className="form-error">{errors.propertyId.message}</p>}
              </div>
              <div>
                <label className="form-label">Buyer Wallet Address</label>
                <input
                  {...register('buyerAddress', { required: 'Required', pattern: { value: /^0x[a-fA-F0-9]{40}$/, message: 'Enter a valid Ethereum address' } })}
                  className="form-input"
                  placeholder="0x..."
                />
                {errors.buyerAddress && <p className="form-error">{errors.buyerAddress.message}</p>}
              </div>
              <div>
                <label className="form-label">Sale Amount (₹)</label>
                <input
                  {...register('saleAmount', { required: 'Required', min: 1 })}
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5000000"
                />
                {errors.saleAmount && <p className="form-error">{errors.saleAmount.message}</p>}
              </div>
              <button type="submit" className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors">
                Continue
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <form onSubmit={handleSubmit(handleStep2)} className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Upload Sale Agreement</h2>
              <div>
                <label className="form-label">Sale Agreement Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors cursor-pointer">
                  <Upload size={28} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">Upload signed sale agreement</p>
                  <p className="text-xs text-gray-400">PDF or image, max 10 MB</p>
                  <input
                    {...register('agreement', { required: 'Sale agreement is required' })}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                </div>
                {errors.agreement && <p className="form-error">{errors.agreement.message}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(0)} className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-sm transition-colors">
                  Back
                </button>
                <button type="submit" className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors">
                  Continue
                </button>
              </div>
            </form>
          )}

          {/* Step 3 - Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Confirm Transfer</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {[
                  ['Property ID', formData.propertyId],
                  ['Buyer Address', formData.buyerAddress],
                  ['Sale Amount', `₹${parseInt(formData.saleAmount || 0).toLocaleString('en-IN')}`],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <span className="font-medium text-gray-900 font-mono text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800">
                  ⚠ This action will initiate an on-chain transfer request. Once approved by a government officer, ownership will be permanently transferred.
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-sm transition-colors">
                  Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading && <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Sign & Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
