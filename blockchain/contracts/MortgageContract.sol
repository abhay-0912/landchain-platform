// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PropertyRegistry.sol";

/**
 * @title MortgageContract
 * @notice Allows authorised banks/lenders to lock a property as collateral and
 *         release it once the loan is repaid.
 */
contract MortgageContract is AccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant BANK_ROLE = keccak256("BANK_ROLE");

    // ─── Structs ──────────────────────────────────────────────────────────────
    struct Mortgage {
        uint256 id;
        uint256 propertyId;
        address bankAddress;
        uint256 loanAmount;    // principal in wei or agreed denomination
        uint256 startDate;     // block.timestamp at creation
        uint256 endDate;       // agreed loan maturity date (unix timestamp)
        bool    isActive;
        string  ipfsDocHash;   // IPFS CID of the mortgage deed
    }

    // ─── State ────────────────────────────────────────────────────────────────
    PropertyRegistry private immutable _propertyRegistry;

    uint256 private _mortgageCounter;

    /// @notice mortgageId → Mortgage record
    mapping(uint256 => Mortgage) private _mortgages;

    /// @notice propertyId → active mortgageId (0 if none)
    mapping(uint256 => uint256) private _activeMortgageForProperty;

    // ─── Events ───────────────────────────────────────────────────────────────
    event MortgageLocked(
        uint256 indexed mortgageId,
        uint256 indexed propertyId,
        address indexed bankAddress,
        uint256         loanAmount,
        uint256         endDate
    );
    event MortgageReleased(
        uint256 indexed mortgageId,
        uint256 indexed propertyId,
        address indexed bankAddress
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address propertyRegistryAddress) {
        require(
            propertyRegistryAddress != address(0),
            "MortgageContract: zero registry address"
        );
        _propertyRegistry = PropertyRegistry(propertyRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BANK_ROLE,          msg.sender);
    }

    // ─── External functions ───────────────────────────────────────────────────

    /**
     * @notice Lock a property as mortgage collateral for a loan.
     * @param propertyId   The property to be mortgaged.
     * @param loanAmount   Principal loan amount.
     * @param endDate      Loan maturity date as a unix timestamp.
     * @param ipfsDocHash  IPFS CID of the mortgage deed document.
     * @return mortgageId  Unique identifier for this mortgage record.
     */
    function lockProperty(
        uint256 propertyId,
        uint256 loanAmount,
        uint256 endDate,
        string calldata ipfsDocHash
    ) external onlyRole(BANK_ROLE) returns (uint256 mortgageId) {
        require(loanAmount > 0,                   "MortgageContract: loan amount must be > 0");
        require(endDate > block.timestamp,         "MortgageContract: end date must be in the future");
        require(bytes(ipfsDocHash).length > 0,     "MortgageContract: empty IPFS hash");
        require(
            _activeMortgageForProperty[propertyId] == 0,
            "MortgageContract: property already has an active mortgage"
        );

        PropertyRegistry.Property memory prop = _propertyRegistry.getProperty(propertyId);
        require(prop.isActive,    "MortgageContract: property is not active");
        require(!prop.isMortgaged, "MortgageContract: property is already mortgaged");

        unchecked { _mortgageCounter++; }
        mortgageId = _mortgageCounter;

        _mortgages[mortgageId] = Mortgage({
            id:          mortgageId,
            propertyId:  propertyId,
            bankAddress: msg.sender,
            loanAmount:  loanAmount,
            startDate:   block.timestamp,
            endDate:     endDate,
            isActive:    true,
            ipfsDocHash: ipfsDocHash
        });

        _activeMortgageForProperty[propertyId] = mortgageId;

        _propertyRegistry.setMortgageStatus(propertyId, true);

        emit MortgageLocked(mortgageId, propertyId, msg.sender, loanAmount, endDate);
    }

    /**
     * @notice Release the mortgage once the loan has been repaid.
     * @dev    Only the originating bank or an admin may release the mortgage.
     */
    function releaseProperty(uint256 mortgageId) external {
        Mortgage storage m = _mortgages[mortgageId];
        require(m.id != 0,    "MortgageContract: mortgage does not exist");
        require(m.isActive,   "MortgageContract: mortgage is already released");
        require(
            msg.sender == m.bankAddress || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "MortgageContract: caller is not the originating bank or admin"
        );

        m.isActive = false;
        delete _activeMortgageForProperty[m.propertyId];

        _propertyRegistry.setMortgageStatus(m.propertyId, false);

        emit MortgageReleased(mortgageId, m.propertyId, m.bankAddress);
    }

    /**
     * @notice Check whether a property is currently mortgaged.
     * @return isActive  True if there is an active mortgage on the property.
     * @return details   The full Mortgage struct (all zero values if none active).
     */
    function checkMortgage(
        uint256 propertyId
    ) external view returns (bool isActive, Mortgage memory details) {
        uint256 mortgageId = _activeMortgageForProperty[propertyId];
        if (mortgageId == 0) {
            return (false, details);
        }
        details  = _mortgages[mortgageId];
        isActive = details.isActive;
    }

    /**
     * @notice Retrieve a mortgage record by ID.
     */
    function getMortgage(
        uint256 mortgageId
    ) external view returns (Mortgage memory) {
        require(
            _mortgages[mortgageId].id != 0,
            "MortgageContract: mortgage does not exist"
        );
        return _mortgages[mortgageId];
    }

    /**
     * @notice Return the total number of mortgages ever created.
     */
    function getMortgageCount() external view returns (uint256) {
        return _mortgageCounter;
    }
}
