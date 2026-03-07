import { FileText, ExternalLink, Download } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

export default function DocumentList({ documents = [] }) {
  if (!documents.length) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-sm">No documents uploaded.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {documents.map((doc, index) => {
        const ipfsUrl = doc.ipfsHash ? `${IPFS_GATEWAY}${doc.ipfsHash}` : doc.url;
        return (
          <li
            key={doc._id || index}
            className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-primary-300 transition-colors"
          >
            <div className="p-2 bg-primary-100 rounded-lg shrink-0">
              <FileText size={18} className="text-primary-700" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {doc.name || doc.type || `Document ${index + 1}`}
              </p>
              {doc.uploadedAt && (
                <p className="text-xs text-gray-500">Uploaded {formatDate(doc.uploadedAt)}</p>
              )}
              {doc.ipfsHash && (
                <p className="text-xs font-mono text-gray-400 truncate">{doc.ipfsHash}</p>
              )}
            </div>
            {ipfsUrl && (
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={ipfsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-600 transition-colors"
                  title="Open in IPFS"
                >
                  <ExternalLink size={16} />
                </a>
                <a
                  href={ipfsUrl}
                  download
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
