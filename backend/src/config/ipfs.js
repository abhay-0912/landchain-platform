'use strict';

const https = require('https');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET = process.env.PINATA_SECRET;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud';

/**
 * Upload a file buffer to IPFS via Pinata.
 * @param {Buffer} buffer      - File data
 * @param {string} filename    - Original filename
 * @param {Object} [metadata]  - Optional Pinata metadata
 * @returns {Promise<string>}  - IPFS CID (IpfsHash)
 */
async function uploadToIPFS(buffer, filename, metadata = {}) {
  if (!PINATA_API_KEY || !PINATA_SECRET) {
    console.warn('[IPFS] Pinata credentials not set — returning mock CID');
    return `mock-cid-${Date.now()}`;
  }

  // Build multipart/form-data manually to avoid adding extra dependencies
  const boundary = `----FormBoundary${Date.now()}`;
  const metaJson = JSON.stringify({ name: filename, ...metadata });

  const parts = [];

  // file part
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
  );
  parts.push(buffer);
  parts.push('\r\n');

  // pinataMetadata part
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="pinataMetadata"\r\nContent-Type: application/json\r\n\r\n${metaJson}\r\n`
  );

  parts.push(`--${boundary}--\r\n`);

  const bodyBuffers = parts.map((p) => (Buffer.isBuffer(p) ? p : Buffer.from(p)));
  const body = Buffer.concat(bodyBuffers);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.pinata.cloud',
        path: '/pinning/pinFileToIPFS',
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.IpfsHash) resolve(parsed.IpfsHash);
            else reject(new Error(`Pinata error: ${data}`));
          } catch (e) {
            reject(new Error(`Pinata parse error: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Returns the IPFS gateway URL for a CID.
 * @param {string} cid
 * @returns {string}
 */
function getIPFSUrl(cid) {
  return `${PINATA_GATEWAY}/ipfs/${cid}`;
}

module.exports = { uploadToIPFS, getIPFSUrl };
