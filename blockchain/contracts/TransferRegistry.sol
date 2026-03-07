// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PropertyRegistry.sol";

/**
 * @title TransferRegistry
 * @notice Manages the multi-step ownership transfer workflow for land properties.
 *         Flow: initiateTransfer → confirmByBuyer → approveByOfficer → completeTransfer
 *         Either party or an admin may cancel before completion.
 */
contract TransferRegistry is AccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");

    // ─── Enums / structs ──────────────────────────────────────────────────────
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
        uint256       salePrice;      // in wei or smallest denomination
        string        agreementHash;  // IPFS CID of the signed sale agreement
        TransferState state;
        uint256       createdAt;
        uint256       completedAt;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    PropertyRegistry private immutable _propertyRegistry;

    uint256 private _transferCounter;

    /// @notice transferId → Transfer record
    mapping(uint256 => Transfer) private _transfers;

    /// @notice propertyId → active transferId (0 if none)
    mapping(uint256 => uint256) private _activeTransferForProperty;

    // ─── Events ───────────────────────────────────────────────────────────────
    event TransferInitiated(
        uint256 indexed transferId,
        uint256 indexed propertyId,
        address indexed seller,
        address         buyer,
        uint256         salePrice
    );
    event BuyerConfirmed(uint256 indexed transferId, address indexed buyer);
    event OfficerApproved(uint256 indexed transferId, address indexed officer);
    event TransferCompleted(
        uint256 indexed transferId,
        uint256 indexed propertyId,
        address indexed newOwner
    );
    event TransferCancelled(
        uint256 indexed transferId,
        address indexed cancelledBy
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address propertyRegistryAddress) {
        require(
            propertyRegistryAddress != address(0),
            "TransferRegistry: zero registry address"
        );
        _propertyRegistry = PropertyRegistry(propertyRegistryAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OFFICER_ROLE,       msg.sender);
    }

    // ─── External functions ───────────────────────────────────────────────────

    /**
     * @notice Seller initiates a property transfer to a buyer.
     * @param propertyId     The property to be transferred.
     * @param buyer          Address of the prospective buyer.
     * @param salePrice      Agreed sale price (informational; payments are off-chain).
     * @param agreementHash  IPFS CID of the executed sale agreement document.
     * @return transferId    Unique identifier for this transfer workflow.
     */
    function initiateTransfer(
        uint256 propertyId,
        address buyer,
        uint256 salePrice,
        string calldata agreementHash
    ) external returns (uint256 transferId) {
        require(buyer != address(0),             "TransferRegistry: buyer is zero address");
        require(buyer != msg.sender,             "TransferRegistry: buyer equals seller");
        require(salePrice > 0,                   "TransferRegistry: sale price must be > 0");
        require(bytes(agreementHash).length > 0, "TransferRegistry: empty agreement hash");
        require(
            _activeTransferForProperty[propertyId] == 0,
            "TransferRegistry: property already has an active transfer"
        );

        PropertyRegistry.Property memory prop = _propertyRegistry.getProperty(propertyId);
        require(prop.isActive,          "TransferRegistry: property is not active");
        require(!prop.isMortgaged,      "TransferRegistry: property is mortgaged");
        require(prop.owner == msg.sender, "TransferRegistry: caller is not the property owner");

        unchecked { _transferCounter++; }
        transferId = _transferCounter;

        _transfers[transferId] = Transfer({
            id:            transferId,
            propertyId:    propertyId,
            seller:        msg.sender,
            buyer:         buyer,
            salePrice:     salePrice,
            agreementHash: agreementHash,
            state:         TransferState.PENDING,
            createdAt:     block.timestamp,
            completedAt:   0
        });

        _activeTransferForProperty[propertyId] = transferId;

        emit TransferInitiated(transferId, propertyId, msg.sender, buyer, salePrice);
    }

    /**
     * @notice Buyer confirms they accept the transfer terms.
     */
    function confirmByBuyer(uint256 transferId) external {
        Transfer storage t = _requireState(transferId, TransferState.PENDING);
        require(msg.sender == t.buyer, "TransferRegistry: caller is not the buyer");

        t.state = TransferState.BUYER_CONFIRMED;
        emit BuyerConfirmed(transferId, msg.sender);
    }

    /**
     * @notice A land officer approves the transfer after due diligence.
     */
    function approveByOfficer(uint256 transferId) external onlyRole(OFFICER_ROLE) {
        Transfer storage t = _requireState(transferId, TransferState.BUYER_CONFIRMED);

        t.state = TransferState.OFFICER_APPROVED;
        emit OfficerApproved(transferId, msg.sender);
    }

    /**
     * @notice Finalise the transfer; updates ownership in PropertyRegistry.
     * @dev    Callable by the seller, buyer, or any admin once officer-approved.
     */
    function completeTransfer(uint256 transferId) external {
        Transfer storage t = _requireState(transferId, TransferState.OFFICER_APPROVED);
        require(
            msg.sender == t.seller ||
            msg.sender == t.buyer  ||
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "TransferRegistry: not authorised to complete"
        );

        t.state       = TransferState.COMPLETED;
        t.completedAt = block.timestamp;

        delete _activeTransferForProperty[t.propertyId];

        _propertyRegistry.updateOwner(t.propertyId, t.buyer);

        emit TransferCompleted(transferId, t.propertyId, t.buyer);
    }

    /**
     * @notice Cancel a transfer that has not yet been completed.
     * @dev    Seller, buyer, or admin may cancel at any pre-completion stage.
     */
    function cancelTransfer(uint256 transferId) external {
        Transfer storage t = _transfers[transferId];
        require(t.id != 0, "TransferRegistry: transfer does not exist");
        require(
            t.state != TransferState.COMPLETED &&
            t.state != TransferState.CANCELLED,
            "TransferRegistry: transfer already finalised"
        );
        require(
            msg.sender == t.seller ||
            msg.sender == t.buyer  ||
            hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "TransferRegistry: not authorised to cancel"
        );

        t.state = TransferState.CANCELLED;
        delete _activeTransferForProperty[t.propertyId];

        emit TransferCancelled(transferId, msg.sender);
    }

    /**
     * @notice Retrieve a transfer record by ID.
     */
    function getTransfer(
        uint256 transferId
    ) external view returns (Transfer memory) {
        require(
            _transfers[transferId].id != 0,
            "TransferRegistry: transfer does not exist"
        );
        return _transfers[transferId];
    }

    /**
     * @notice Return the active transfer ID for a property (0 if none).
     */
    function getActiveTransferForProperty(
        uint256 propertyId
    ) external view returns (uint256) {
        return _activeTransferForProperty[propertyId];
    }

    /**
     * @notice Return the total number of transfers ever created.
     */
    function getTransferCount() external view returns (uint256) {
        return _transferCounter;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _requireState(
        uint256       transferId,
        TransferState expected
    ) internal view returns (Transfer storage t) {
        t = _transfers[transferId];
        require(t.id != 0, "TransferRegistry: transfer does not exist");
        require(
            t.state == expected,
            "TransferRegistry: transfer is not in the expected state"
        );
    }
}
