'use strict';

const blockchain = require('../config/blockchain');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function withRetry(fn, retries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[Blockchain] Attempt ${attempt} failed: ${err.message}. Retrying...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
}

function parseReceipt(receipt) {
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed?.toString(),
    status: receipt.status,
  };
}

// ─── PropertyRegistry ────────────────────────────────────────────────────────

/**
 * Register a property on-chain.
 * The contract auto-assigns a uint256 propertyId and returns it.
 * Requires the signing wallet to hold REGISTRAR_ROLE.
 *
 * @param {Object} params
 * @param {string} params.surveyNumber
 * @param {number|string} params.area        - area in sq-metres (uint256)
 * @param {string} params.coordinates        - e.g. "28.6139,77.2090"
 * @param {string} params.city
 * @param {string} params.state
 * @param {string} params.ipfsDocHash        - IPFS CID of title deed (required, non-empty)
 * @returns {Promise<{transactionHash, blockNumber, gasUsed, status, blockchainPropertyId}|null>}
 */
async function registerPropertyOnChain({ surveyNumber, area, coordinates, city, state, ipfsDocHash }) {
  if (!blockchain.propertyRegistry) {
    console.warn('[Blockchain] PropertyRegistry not available — skipping on-chain registration');
    return null;
  }
  if (!ipfsDocHash) {
    console.warn('[Blockchain] ipfsDocHash required by contract — skipping on-chain registration');
    return null;
  }
  return withRetry(async () => {
    const tx = await blockchain.propertyRegistry.registerProperty(
      surveyNumber,
      BigInt(area),
      coordinates || '',
      city,
      state,
      ipfsDocHash
    );
    const receipt = await tx.wait();
    // Parse the auto-assigned blockchain propertyId from the event
    let blockchainPropertyId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = blockchain.propertyRegistry.interface.parseLog(log);
        if (parsed && parsed.name === 'PropertyRegistered') {
          blockchainPropertyId = parsed.args.propertyId?.toString();
        }
      } catch (_) { /* not our event */ }
    }
    console.log(`[Blockchain] registerProperty tx: ${receipt.hash}, propertyId: ${blockchainPropertyId}`);
    return { ...parseReceipt(receipt), blockchainPropertyId };
  });
}

async function getPropertyFromChain(propertyId) {
  if (!blockchain.propertyRegistry) return null;
  return withRetry(() => blockchain.propertyRegistry.getProperty(propertyId));
}

// ─── TransferRegistry ────────────────────────────────────────────────────────

/**
 * Initiate a property transfer on-chain.
 * @param {Object} params
 * @param {string|number} params.blockchainPropertyId  - uint256 property ID from the chain
 * @param {string}        params.buyerAddress          - buyer's Ethereum address
 * @param {string|number} params.salePrice             - sale price in wei (or smallest unit)
 * @param {string}        params.agreementHash         - IPFS CID of signed sale agreement
 */
async function initiateTransferOnChain({ blockchainPropertyId, buyerAddress, salePrice, agreementHash }) {
  if (!blockchain.transferRegistry) {
    console.warn('[Blockchain] TransferRegistry not available — skipping');
    return null;
  }
  if (!buyerAddress || buyerAddress === '0x0000000000000000000000000000000000000000') {
    console.warn('[Blockchain] Invalid buyer address — skipping on-chain transfer initiation');
    return null;
  }
  if (!agreementHash) {
    console.warn('[Blockchain] agreementHash required by contract — skipping on-chain transfer initiation');
    return null;
  }
  return withRetry(async () => {
    const tx = await blockchain.transferRegistry.initiateTransfer(
      BigInt(blockchainPropertyId),
      buyerAddress,
      BigInt(salePrice),
      agreementHash
    );
    const receipt = await tx.wait();
    let transferId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = blockchain.transferRegistry.interface.parseLog(log);
        if (parsed && parsed.name === 'TransferInitiated') {
          transferId = parsed.args.transferId?.toString();
        }
      } catch (_) { /* not our event */ }
    }
    return { ...parseReceipt(receipt), transferId };
  });
}

async function confirmByBuyerOnChain(transferId) {
  if (!blockchain.transferRegistry) return null;
  return withRetry(async () => {
    const tx = await blockchain.transferRegistry.confirmByBuyer(transferId);
    const receipt = await tx.wait();
    return parseReceipt(receipt);
  });
}

async function approveByOfficerOnChain(transferId) {
  if (!blockchain.transferRegistry) return null;
  return withRetry(async () => {
    const tx = await blockchain.transferRegistry.approveByOfficer(transferId);
    const receipt = await tx.wait();
    return parseReceipt(receipt);
  });
}

async function completeTransferOnChain(transferId) {
  if (!blockchain.transferRegistry) return null;
  return withRetry(async () => {
    const tx = await blockchain.transferRegistry.completeTransfer(transferId);
    const receipt = await tx.wait();
    return parseReceipt(receipt);
  });
}

async function cancelTransferOnChain(transferId) {
  if (!blockchain.transferRegistry) return null;
  return withRetry(async () => {
    const tx = await blockchain.transferRegistry.cancelTransfer(transferId);
    const receipt = await tx.wait();
    return parseReceipt(receipt);
  });
}

// ─── MortgageContract ────────────────────────────────────────────────────────

/**
 * Lock a property as collateral for a mortgage.
 * @param {Object} params
 * @param {string|number} params.blockchainPropertyId  - uint256 property ID from the chain
 * @param {string|number} params.loanAmount            - loan amount (uint256)
 * @param {number}        params.endDateTimestamp      - Unix timestamp of mortgage end date
 * @param {string}        params.ipfsDocHash           - IPFS CID of mortgage agreement
 */
async function lockPropertyOnChain({ blockchainPropertyId, loanAmount, endDateTimestamp, ipfsDocHash }) {
  if (!blockchain.mortgageContract) {
    console.warn('[Blockchain] MortgageContract not available — skipping');
    return null;
  }
  if (!ipfsDocHash) {
    console.warn('[Blockchain] ipfsDocHash required by contract — skipping on-chain mortgage lock');
    return null;
  }
  return withRetry(async () => {
    const tx = await blockchain.mortgageContract.lockProperty(
      BigInt(blockchainPropertyId),
      BigInt(loanAmount),
      BigInt(endDateTimestamp),
      ipfsDocHash
    );
    const receipt = await tx.wait();
    let mortgageId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = blockchain.mortgageContract.interface.parseLog(log);
        if (parsed && parsed.name === 'MortgageCreated') {
          mortgageId = parsed.args.mortgageId?.toString();
        }
      } catch (_) { /* not our event */ }
    }
    return { ...parseReceipt(receipt), mortgageId };
  });
}

async function releasePropertyOnChain(mortgageId) {
  if (!blockchain.mortgageContract) return null;
  return withRetry(async () => {
    const tx = await blockchain.mortgageContract.releaseProperty(mortgageId);
    const receipt = await tx.wait();
    return parseReceipt(receipt);
  });
}

module.exports = {
  registerPropertyOnChain,
  getPropertyFromChain,
  initiateTransferOnChain,
  confirmByBuyerOnChain,
  approveByOfficerOnChain,
  completeTransferOnChain,
  cancelTransferOnChain,
  lockPropertyOnChain,
  releasePropertyOnChain,
};
