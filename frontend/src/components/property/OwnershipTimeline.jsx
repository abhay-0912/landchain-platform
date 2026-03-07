import { formatDate, formatAddress } from '@/lib/utils';
import { ArrowRight, User } from 'lucide-react';
import Badge from '@/components/ui/Badge';

export default function OwnershipTimeline({ history = [] }) {
  if (!history.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No ownership history available.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

      <ol className="space-y-6">
        {history.map((entry, index) => (
          <li key={entry._id || index} className="relative pl-14">
            {/* Dot */}
            <div
              className={`absolute left-3 top-1 h-5 w-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                index === 0 ? 'bg-primary-600' : 'bg-gray-400'
              }`}
            >
              <User size={10} className="text-white" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {entry.owner?.name || 'Unknown Owner'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {formatAddress(entry.owner?.walletAddress || entry.walletAddress)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {index === 0 && <Badge variant="accent" dot>Current Owner</Badge>}
                  <span className="text-xs text-gray-400">{formatDate(entry.transferredAt || entry.date)}</span>
                </div>
              </div>

              {entry.transferType && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <ArrowRight size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-600 capitalize">
                    {entry.transferType.replace(/_/g, ' ')}
                  </span>
                  {entry.txHash && (
                    <span className="text-xs font-mono text-primary-600 ml-auto truncate max-w-xs">
                      {formatAddress(entry.txHash)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
