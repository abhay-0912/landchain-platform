'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { MapPin, Info } from 'lucide-react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Mock property markers across India
const MOCK_PROPERTIES = [
  { lat: 19.0760, lng: 72.8777, title: 'Survey 45/2A', surveyNumber: '45/2A', city: 'Mumbai', status: 'active' },
  { lat: 28.6139, lng: 77.2090, title: 'Survey 12/B', surveyNumber: '12/B', city: 'Delhi', status: 'active' },
  { lat: 12.9716, lng: 77.5946, title: 'Survey 78/1C', surveyNumber: '78/1C', city: 'Bengaluru', status: 'mortgaged' },
  { lat: 22.5726, lng: 88.3639, title: 'Survey 23/D', surveyNumber: '23/D', city: 'Kolkata', status: 'active' },
  { lat: 13.0827, lng: 80.2707, title: 'Survey 56/E', surveyNumber: '56/E', city: 'Chennai', status: 'active' },
  { lat: 17.3850, lng: 78.4867, title: 'Survey 90/2F', surveyNumber: '90/2F', city: 'Hyderabad', status: 'active' },
  { lat: 23.0225, lng: 72.5714, title: 'Survey 34/G', surveyNumber: '34/G', city: 'Ahmedabad', status: 'disputed' },
  { lat: 18.5204, lng: 73.8567, title: 'Survey 67/H', surveyNumber: '67/H', city: 'Pune', status: 'active' },
  { lat: 26.9124, lng: 75.7873, title: 'Survey 11/I', surveyNumber: '11/I', city: 'Jaipur', status: 'active' },
  { lat: 21.1702, lng: 72.8311, title: 'Survey 88/J', surveyNumber: '88/J', city: 'Surat', status: 'active' },
];

const DynamicMap = dynamic(
  () => import('@/components/property/PropertyMap'),
  {
    ssr: false,
    loading: () => <LoadingSpinner size="xl" className="h-full" />,
  }
);

const statusColors = {
  active: 'bg-accent-100 text-accent-700',
  mortgaged: 'bg-yellow-100 text-yellow-700',
  disputed: 'bg-red-100 text-red-700',
};

export default function MapPage() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={22} className="text-primary-600" /> Land Map
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Explore registered properties across India</p>
        </div>
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).map(([status, color]) => (
            <div key={status} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <DynamicMap
            lat={22.5}
            lng={80.0}
            zoom={5}
            markers={MOCK_PROPERTIES}
          />
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shrink-0">
          <div className="p-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {MOCK_PROPERTIES.length} Registered Properties
            </p>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <Info size={12} /> Showing demo data
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {MOCK_PROPERTIES.map((p, i) => (
              <li key={i} className="px-4 py-3 hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(p)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.city}</p>
                    <p className="text-xs text-gray-500 font-mono">Survey {p.surveyNumber}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
