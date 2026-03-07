# LandChain Smart Contracts

Three Solidity contracts (Solidity `^0.8.19`) form the immutable blockchain layer of the LandChain platform. They are compiled and deployed using Hardhat and import [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts) v5.

---

## Table of Contents

- [Contract Addresses](#contract-addresses)
- [PropertyRegistry](#propertyregistry)
- [TransferRegistry](#transferregistry)
- [MortgageContract](#mortgagecontract)
- [Role Architecture](#role-architecture)
- [Interacting with Contracts](#interacting-with-contracts)
- [Security Considerations](#security-considerations)

---

## Contract Addresses

### Local Development (Hardhat)

```
PropertyRegistry  : deploy and note address from `npx hardhat run scripts/deploy.js --network localhost`
TransferRegistry  : same deployment script
MortgageContract  : same deployment script
```

Update `backend/.env` after deployment:

```env
PROPERTY_REGISTRY_ADDRESS=0x...
TRANSFER_REGISTRY_ADDRESS=0x...
MORTGAGE_CONTRACT_ADDRESS=0x...
```

### Staging (Polygon Amoy Testnet)

| Contract            | Address                                      |
|---------------------|----------------------------------------------|
| `PropertyRegistry`  | _To be populated after testnet deployment_   |
| `TransferRegistry`  | _To be populated after testnet deployment_   |
| `MortgageContract`  | _To be populated after testnet deployment_   |

### Mainnet (Polygon)

| Contract            | Address                                      |
|---------------------|----------------------------------------------|
| `PropertyRegistry`  | _To be populated after mainnet deployment_   |
| `TransferRegistry`  | _To be populated after mainnet deployment_   |
| `MortgageContract`  | _To be populated after mainnet deployment_   |

---

## PropertyRegistry

**File:** `blockchain/contracts/PropertyRegistry.sol`

Central registry for land property records. Holds the authoritative ownership and mortgage state for every property on-chain.

### Roles

| Role                 | `keccak256` Identifier           | Who holds it                      |
|----------------------|----------------------------------|-----------------------------------|
| `DEFAULT_ADMIN_ROLE` | `0x00`                           | Deployer; platform admin wallet   |
| `REGISTRAR_ROLE`     | `keccak256("REGISTRAR_ROLE")`    | Backend service wallet            |
| `TRANSFER_ROLE`      | `keccak256("TRANSFER_ROLE")`     | TransferRegistry contract address |
| `MORTGAGE_ROLE`      | `keccak256("MORTGAGE_ROLE")`     | MortgageContract contract address |

### Data Structures

```solidity
struct Property {
    uint256 id;
    address owner;
    string  surveyNumber;
    uint256 area;           // sq metres × 100 (two decimal precision)
    string  coordinates;    // "lat,long" or GeoJSON
    string  city;
    string  state;
    string  ipfsDocHash;    // IPFS CID of title document
    uint256 registrationDate;
    bool    isActive;
    bool    isMortgaged;
}
```

### State Variables

| Variable             | Type                          | Description                             |
|----------------------|-------------------------------|-----------------------------------------|
| `properties`         | `mapping(uint256 => Property)`| propertyId → Property record            |
| `surveyToId`         | `mapping(string => uint256)`  | surveyNumber → propertyId (uniqueness)  |

### Write Functions

#### `registerProperty`

```solidity
function registerProperty(
    string calldata surveyNumber,
    uint256         area,
    string calldata coordinates,
    string calldata city,
    string calldata state,
    string calldata ipfsDocHash
) external onlyRole(REGISTRAR_ROLE) returns (uint256 propertyId)
```

Registers a new property. `msg.sender` (the backend wallet) is recorded as the initial on-chain owner; the backend also creates the DB record with the correct `owner_id`.

**Reverts if:**
- Any string argument is empty
- `area == 0`
- `surveyNumber` already registered

---

#### `updateOwner`

```solidity
function updateOwner(
    uint256 propertyId,
    address newOwner
) external onlyRole(TRANSFER_ROLE)
```

Updates the on-chain owner. Called exclusively by `TransferRegistry` during `completeTransfer`.

**Reverts if:**
- `newOwner == address(0)`
- Property does not exist or is inactive
- Property is currently mortgaged

---

#### `setMortgageStatus`

```solidity
function setMortgageStatus(
    uint256 propertyId,
    bool    status
) external onlyRole(MORTGAGE_ROLE)
```

Locks or unlocks the mortgage flag. Called by `MortgageContract`.

---

#### `setPropertyStatus`

```solidity
function setPropertyStatus(
    uint256 propertyId,
    bool    isActive
) external onlyRole(DEFAULT_ADMIN_ROLE)
```

Deactivates or reactivates a property (e.g. during a dispute).

---

### Read Functions

| Function                  | Returns          | Description                          |
|---------------------------|------------------|--------------------------------------|
| `getProperty(propertyId)` | `Property memory`| Full property record                 |
| `getPropertyCount()`      | `uint256`        | Total registered properties          |
| `surveyToId(surveyNumber)`| `uint256`        | Look up propertyId by survey number  |

### Events

| Event                   | Emitted when                              | Parameters                                      |
|-------------------------|-------------------------------------------|-------------------------------------------------|
| `PropertyRegistered`    | New property registered                   | `propertyId`, `owner`, `surveyNumber`, `registrationDate` |
| `OwnershipUpdated`      | Owner changed                             | `propertyId`, `previousOwner`, `newOwner`       |
| `PropertyStatusChanged` | Active flag toggled                       | `propertyId`, `isActive`                        |
| `MortgageStatusChanged` | Mortgage flag toggled                     | `propertyId`, `isMortgaged`                     |

---

## TransferRegistry

**File:** `blockchain/contracts/TransferRegistry.sol`

Manages the four-step ownership transfer workflow. Holds a reference to `PropertyRegistry` and calls `updateOwner` upon final completion.

### Roles

| Role                 | Who holds it                        |
|----------------------|-------------------------------------|
| `DEFAULT_ADMIN_ROLE` | Deployer; platform admin wallet     |
| `OFFICER_ROLE`       | `keccak256("OFFICER_ROLE")` – Land officer wallets |

### Transfer State Machine

```
                    ┌─────────────────────────────────────────────┐
                    │                                             │
        Seller      │                                             │
   initiateTransfer │                                             │
           │        │         cancelTransfer                      │
           ▼        │       (seller/buyer/admin)                  │
      ┌─────────┐   │   ┌───────────┐                            │
      │ PENDING │───┼──►│ CANCELLED │                            │
      └────┬────┘   │   └───────────┘                            │
           │        │                                             │
   Buyer   │        │                                             │
   confirmByBuyer   │         cancelTransfer                      │
           │        │       (seller/buyer/admin)                  │
           ▼        │   ┌───────────┐                            │
  ┌────────────────┐│   │ CANCELLED │                            │
  │ BUYER_CONFIRMED├┼──►└───────────┘                            │
  └───────┬────────┘│                                             │
          │         │                                             │
  Officer │         │         cancelTransfer                      │
  approveByOfficer  │       (seller/buyer/admin)                  │
          │         │   ┌───────────┐                            │
          ▼         │   │ CANCELLED │                            │
  ┌────────────────┐│   └───────────┘                            │
  │OFFICER_APPROVED├┼──►            completeTransfer             │
  └───────┬────────┘│            (seller/buyer/admin)            │
          │         │                                             │
          ▼         │                                             │
    ┌───────────┐   │                                             │
    │ COMPLETED │   │                                             │
    └───────────┘   │                                             │
                    └─────────────────────────────────────────────┘
```

### Data Structures

```solidity
enum TransferState {
    PENDING,
    BUYER_CONFIRMED,
    OFFICER_APPROVED,
    COMPLETED,
    CANCELLED
}

struct Transfer {
    uint256       id;
    uint256       propertyId;
    address       seller;
    address       buyer;
    uint256       salePrice;       // informational; payments are off-chain
    string        agreementHash;   // IPFS CID of signed sale agreement
    TransferState state;
    uint256       createdAt;
    uint256       completedAt;
}
```

### Write Functions

#### `initiateTransfer`

```solidity
function initiateTransfer(
    uint256 propertyId,
    address buyer,
    uint256 salePrice,
    string calldata agreementHash
) external returns (uint256 transferId)
```

Called by the property seller. Creates a transfer record in `PENDING` state.

**Reverts if:**
- `buyer == address(0)` or `buyer == msg.sender`
- `salePrice == 0`
- `agreementHash` is empty
- Property already has an active transfer
- Property is inactive, mortgaged, or `msg.sender` is not the owner

---

#### `confirmByBuyer`

```solidity
function confirmByBuyer(uint256 transferId) external
```

Buyer acknowledges the transfer terms. Advances state to `BUYER_CONFIRMED`.

---

#### `approveByOfficer`

```solidity
function approveByOfficer(uint256 transferId) external onlyRole(OFFICER_ROLE)
```

Land officer approves the transfer after verification. Advances state to `OFFICER_APPROVED`.

---

#### `completeTransfer`

```solidity
function completeTransfer(uint256 transferId) external
```

Finalises the transfer. Updates ownership in `PropertyRegistry`.

**Callable by:** seller, buyer, or admin once state is `OFFICER_APPROVED`.

---

#### `cancelTransfer`

```solidity
function cancelTransfer(uint256 transferId) external
```

Cancels a transfer at any pre-completion stage.

**Callable by:** seller, buyer, or admin.

---

### Read Functions

| Function                                  | Returns           | Description                      |
|-------------------------------------------|-------------------|----------------------------------|
| `getTransfer(transferId)`                 | `Transfer memory` | Full transfer record             |
| `getActiveTransferForProperty(propertyId)`| `uint256`         | Active transfer ID (0 if none)   |
| `getTransferCount()`                      | `uint256`         | Total transfers ever created     |

### Events

| Event               | Parameters                                                    |
|---------------------|---------------------------------------------------------------|
| `TransferInitiated` | `transferId`, `propertyId`, `seller`, `buyer`, `salePrice`   |
| `BuyerConfirmed`    | `transferId`, `buyer`                                         |
| `OfficerApproved`   | `transferId`, `officer`                                       |
| `TransferCompleted` | `transferId`, `propertyId`, `newOwner`                        |
| `TransferCancelled` | `transferId`, `cancelledBy`                                   |

---

## MortgageContract

**File:** `blockchain/contracts/MortgageContract.sol`

Allows authorised banks to lock a property as collateral and release it upon loan repayment.

### Roles

| Role                 | Who holds it                        |
|----------------------|-------------------------------------|
| `DEFAULT_ADMIN_ROLE` | Deployer; platform admin wallet     |
| `BANK_ROLE`          | `keccak256("BANK_ROLE")` – Bank wallets |

### Data Structures

```solidity
struct Mortgage {
    uint256 id;
    uint256 propertyId;
    address bankAddress;
    uint256 loanAmount;     // principal
    uint256 startDate;      // block.timestamp at creation
    uint256 endDate;        // loan maturity (unix timestamp)
    bool    isActive;
    string  ipfsDocHash;    // IPFS CID of mortgage deed
}
```

### Write Functions

#### `lockProperty`

```solidity
function lockProperty(
    uint256 propertyId,
    uint256 loanAmount,
    uint256 endDate,
    string calldata ipfsDocHash
) external onlyRole(BANK_ROLE) returns (uint256 mortgageId)
```

Creates a mortgage record and calls `PropertyRegistry.setMortgageStatus(propertyId, true)`.

**Reverts if:**
- `loanAmount == 0`
- `endDate <= block.timestamp`
- `ipfsDocHash` is empty
- Property already has an active mortgage
- Property is inactive or already mortgaged

---

#### `releaseProperty`

```solidity
function releaseProperty(uint256 mortgageId) external
```

Releases the mortgage and calls `PropertyRegistry.setMortgageStatus(propertyId, false)`.

**Callable by:** The originating bank address or any admin.

---

### Read Functions

| Function                      | Returns                           | Description                          |
|-------------------------------|-----------------------------------|--------------------------------------|
| `checkMortgage(propertyId)`   | `(bool isActive, Mortgage memory)`| Active mortgage status for a property|
| `getMortgage(mortgageId)`     | `Mortgage memory`                 | Full mortgage record by ID           |
| `getMortgageCount()`          | `uint256`                         | Total mortgages ever created         |

### Events

| Event              | Parameters                                                    |
|--------------------|---------------------------------------------------------------|
| `MortgageLocked`   | `mortgageId`, `propertyId`, `bankAddress`, `loanAmount`, `endDate` |
| `MortgageReleased` | `mortgageId`, `propertyId`, `bankAddress`                     |

---

## Role Architecture

```
DEFAULT_ADMIN_ROLE (0x00)
 ├── Can grant/revoke any role on all three contracts
 ├── Can deactivate properties (PropertyRegistry)
 └── Can cancel/complete transfers (TransferRegistry)

REGISTRAR_ROLE
 └── Can call PropertyRegistry.registerProperty()

TRANSFER_ROLE  (held by TransferRegistry contract address)
 └── Can call PropertyRegistry.updateOwner()

MORTGAGE_ROLE  (held by MortgageContract contract address)
 └── Can call PropertyRegistry.setMortgageStatus()

OFFICER_ROLE
 └── Can call TransferRegistry.approveByOfficer()

BANK_ROLE
 └── Can call MortgageContract.lockProperty()
```

After deployment, grant cross-contract roles:

```javascript
// Grant TransferRegistry the TRANSFER_ROLE on PropertyRegistry
await propertyRegistry.grantRole(
    await propertyRegistry.TRANSFER_ROLE(),
    transferRegistry.address
);

// Grant MortgageContract the MORTGAGE_ROLE on PropertyRegistry
await propertyRegistry.grantRole(
    await propertyRegistry.MORTGAGE_ROLE(),
    mortgageContract.address
);
```

---

## Interacting with Contracts

### Using Hardhat Console

```bash
cd blockchain
npx hardhat console --network localhost
```

```javascript
const [deployer, officer, bank, citizen] = await ethers.getSigners();

// Attach to deployed contracts
const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
const registry = PropertyRegistry.attach("0xDeploy...");

// Register a property
const tx = await registry.registerProperty(
    "SRV/MH/PUNE/2024/001",
    120000,  // 1200.00 sq m × 100
    "18.5204,73.8567",
    "Pune",
    "Maharashtra",
    "QmTzQ1JRkWErjk39mryYw2WVDzg11jHjpFZctiepFppDm6"
);
await tx.wait();

// Read the property
const prop = await registry.getProperty(1);
console.log(prop);
```

### Using ethers.js in the Backend

The backend's `blockchainService.js` wraps all contract interactions. Example call:

```javascript
import { ethers } from 'ethers';
import PropertyRegistryABI from '../abis/PropertyRegistry.json' assert { type: 'json' };

const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
const wallet   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const registry = new ethers.Contract(
    process.env.PROPERTY_REGISTRY_ADDRESS,
    PropertyRegistryABI,
    wallet
);

const tx = await registry.registerProperty(...args);
const receipt = await tx.wait();
const event = receipt.logs
    .map(log => registry.interface.parseLog(log))
    .find(e => e?.name === 'PropertyRegistered');

const propertyId = event.args.propertyId;
```

---

## Security Considerations

1. **No on-chain ether transfers.** All contracts are non-payable; sale prices are informational only. Financial settlement happens off-chain.

2. **Mortgage blocks transfers.** `PropertyRegistry.updateOwner` reverts if `isMortgaged == true`, preventing double-sale of encumbered properties.

3. **Survey number uniqueness.** The `surveyToId` mapping prevents duplicate registration of the same parcel.

4. **One active transfer at a time.** `_activeTransferForProperty` enforces a single open transfer per property.

5. **One active mortgage at a time.** `_activeMortgageForProperty` enforces a single active mortgage per property.

6. **Role separation.** No single external account needs more than one operational role. Admin role should be held by a multisig (e.g. Gnosis Safe) in production.

7. **IPFS immutability.** Storing document CIDs on-chain means the legal documents cannot be silently swapped; any change produces a different CID.

8. **Overflow protection.** Solidity `^0.8.x` has built-in overflow/underflow checks; `unchecked { _counter++; }` is used only for gas-efficient counters that cannot realistically overflow.

9. **Upgradeability.** The current contracts are non-upgradeable (no proxy pattern). Plan a migration strategy if contract logic changes are needed after deployment.

10. **Audit.** Before production deployment, obtain an independent security audit from a reputable firm.
