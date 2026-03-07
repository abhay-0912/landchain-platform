const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");

  // ── 1. Deploy PropertyRegistry ──────────────────────────────────────────
  console.log("Deploying PropertyRegistry...");
  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistry.deploy();
  await propertyRegistry.waitForDeployment();
  const propertyRegistryAddress = await propertyRegistry.getAddress();
  console.log("  PropertyRegistry deployed to:", propertyRegistryAddress);

  // ── 2. Deploy TransferRegistry ───────────────────────────────────────────
  console.log("Deploying TransferRegistry...");
  const TransferRegistry = await ethers.getContractFactory("TransferRegistry");
  const transferRegistry = await TransferRegistry.deploy(propertyRegistryAddress);
  await transferRegistry.waitForDeployment();
  const transferRegistryAddress = await transferRegistry.getAddress();
  console.log("  TransferRegistry deployed to:", transferRegistryAddress);

  // ── 3. Deploy MortgageContract ───────────────────────────────────────────
  console.log("Deploying MortgageContract...");
  const MortgageContract = await ethers.getContractFactory("MortgageContract");
  const mortgageContract = await MortgageContract.deploy(propertyRegistryAddress);
  await mortgageContract.waitForDeployment();
  const mortgageContractAddress = await mortgageContract.getAddress();
  console.log("  MortgageContract deployed to:", mortgageContractAddress);

  // ── 4. Grant roles ───────────────────────────────────────────────────────
  console.log("\nConfiguring roles...");

  const TRANSFER_ROLE = await propertyRegistry.TRANSFER_ROLE();
  const transferRoleTx = await propertyRegistry.grantRole(
    TRANSFER_ROLE,
    transferRegistryAddress
  );
  await transferRoleTx.wait();
  console.log("  TRANSFER_ROLE granted to TransferRegistry");

  const MORTGAGE_ROLE = await propertyRegistry.MORTGAGE_ROLE();
  const mortgageRoleTx = await propertyRegistry.grantRole(
    MORTGAGE_ROLE,
    mortgageContractAddress
  );
  await mortgageRoleTx.wait();
  console.log("  MORTGAGE_ROLE granted to MortgageContract");

  // ── 5. Persist addresses ─────────────────────────────────────────────────
  const networkName = (await ethers.provider.getNetwork()).name;
  const chainId     = (await ethers.provider.getNetwork()).chainId.toString();

  const addresses = {
    network:          networkName,
    chainId:          chainId,
    deployedAt:       new Date().toISOString(),
    deployer:         deployer.address,
    PropertyRegistry: propertyRegistryAddress,
    TransferRegistry: transferRegistryAddress,
    MortgageContract: mortgageContractAddress,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const addressFile = path.join(deploymentsDir, "addresses.json");
  fs.writeFileSync(addressFile, JSON.stringify(addresses, null, 2));
  console.log("\nDeployment addresses saved to:", addressFile);

  // ── 6. Summary ───────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  LandChain Deployment Summary");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  Network:          ${networkName} (chainId: ${chainId})`);
  console.log(`  PropertyRegistry: ${propertyRegistryAddress}`);
  console.log(`  TransferRegistry: ${transferRegistryAddress}`);
  console.log(`  MortgageContract: ${mortgageContractAddress}`);
  console.log("═══════════════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
