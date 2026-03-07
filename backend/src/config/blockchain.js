'use strict';

const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_BASE = path.join(__dirname, '../../../blockchain/artifacts/contracts');

function loadAbi(contractName) {
  const artifactPath = path.join(ARTIFACTS_BASE, `${contractName}.sol`, `${contractName}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.warn(`[Blockchain] ABI not found for ${contractName} at ${artifactPath}`);
    return null;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  return artifact.abi;
}

let provider;
let wallet;
let propertyRegistry;
let transferRegistry;
let mortgageContract;

function init() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = process.env.PRIVATE_KEY;

  try {
    provider = new ethers.JsonRpcProvider(rpcUrl);

    if (privateKey) {
      wallet = new ethers.Wallet(privateKey, provider);
    } else {
      console.warn('[Blockchain] PRIVATE_KEY not set — read-only mode');
    }

    const signer = wallet || provider;

    // PropertyRegistry
    const propertyAbi = loadAbi('PropertyRegistry');
    const propertyAddr = process.env.PROPERTY_REGISTRY_ADDRESS;
    if (propertyAbi && propertyAddr && propertyAddr !== '0x0000000000000000000000000000000000000000') {
      propertyRegistry = new ethers.Contract(propertyAddr, propertyAbi, signer);
      console.log('[Blockchain] PropertyRegistry loaded at', propertyAddr);
    } else {
      console.warn('[Blockchain] PropertyRegistry not deployed — blockchain calls will be skipped');
    }

    // TransferRegistry
    const transferAbi = loadAbi('TransferRegistry');
    const transferAddr = process.env.TRANSFER_REGISTRY_ADDRESS;
    if (transferAbi && transferAddr && transferAddr !== '0x0000000000000000000000000000000000000000') {
      transferRegistry = new ethers.Contract(transferAddr, transferAbi, signer);
      console.log('[Blockchain] TransferRegistry loaded at', transferAddr);
    } else {
      console.warn('[Blockchain] TransferRegistry not deployed — blockchain calls will be skipped');
    }

    // MortgageContract
    const mortgageAbi = loadAbi('MortgageContract');
    const mortgageAddr = process.env.MORTGAGE_CONTRACT_ADDRESS;
    if (mortgageAbi && mortgageAddr && mortgageAddr !== '0x0000000000000000000000000000000000000000') {
      mortgageContract = new ethers.Contract(mortgageAddr, mortgageAbi, signer);
      console.log('[Blockchain] MortgageContract loaded at', mortgageAddr);
    } else {
      console.warn('[Blockchain] MortgageContract not deployed — blockchain calls will be skipped');
    }
  } catch (err) {
    console.error('[Blockchain] Initialization error:', err.message);
  }
}

init();

module.exports = { provider, wallet, propertyRegistry, transferRegistry, mortgageContract };
