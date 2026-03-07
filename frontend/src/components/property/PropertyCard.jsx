import Link from 'next/link';
import { MapPin, Ruler, Hash, Calendar } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { formatArea, formatDate } from '@/lib/utils';

const statusVariant = {
  active: 'accent',
  mortgaged: 'warning',
  disputed: 'danger',
  pending: 'info',
  transferred: 'primary',
};

export default function PropertyCard({ property }) {
  const {
    _id,
    surveyNumber,
    city,
    state,
    area,
    status,
    currentOwner,
    createdAt,
    coordinates,
  } = property;

  return (
    <Link href={`/property/${_id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-card-md transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Hash size={14} className="text-gray-400" />
              <span className="text-xs font-mono text-gray-500">{surveyNumber}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
              {city}, {state}
            </h3>
          </div>
          <Badge variant={statusVariant[status?.toLowerCase()] || 'default'} dot>
            {status || 'Unknown'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Ruler size={14} className="text-gray-400" />
            <span>{formatArea(area)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin size={14} className="text-gray-400" />
            <span className="truncate">{city}</span>
          </div>
        </div>

        {currentOwner && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
              {currentOwner.name?.[0]?.toUpperCase() || 'O'}
            </div>
            <span className="text-xs text-gray-600 truncate">{currentOwner.name}</span>
          </div>
        )}

        {createdAt && (
          <div className="flex items-center gap-1.5 mt-2">
            <Calendar size={12} className="text-gray-400" />
            <span className="text-xs text-gray-400">Registered {formatDate(createdAt)}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
