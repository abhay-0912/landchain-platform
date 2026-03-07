import { cn } from '@/lib/utils';

export default function Card({ children, className, header, footer }) {
  return (
    <div className={cn('bg-white rounded-xl shadow-card border border-gray-100', className)}>
      {header && (
        <div className="px-6 py-4 border-b border-gray-100">
          {typeof header === 'string' ? (
            <h3 className="text-base font-semibold text-gray-900">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
}
