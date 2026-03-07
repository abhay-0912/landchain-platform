// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PropertyRegistry
 * @notice Central registry for land property records on the LandChain platform.
 *         Authorised registrars can register properties; dedicated role contracts
 *         handle ownership transfers and mortgage state changes.
 */
contract PropertyRegistry is AccessControl {
    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant TRANSFER_ROLE  = keccak256("TRANSFER_ROLE");
    bytes32 public constant MORTGAGE_ROLE  = keccak256("MORTGAGE_ROLE");

    // ─── Data structures ──────────────────────────────────────────────────────
    struct Property {
        uint256 id;
        address owner;
        string  surveyNumber;
        uint256 area;           // in square metres (×100 for two decimal precision)
        string  coordinates;    // e.g. "lat,long" or GeoJSON string
        string  city;
        string  state;
        string  ipfsDocHash;    // IPFS CID of the title document
        uint256 registrationDate;
        bool    isActive;
        bool    isMortgaged;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    uint256 private _propertyCounter;

    /// @notice propertyId → Property record
    mapping(uint256 => Property) public properties;

    /// @notice surveyNumber → propertyId  (ensures uniqueness per survey number)
    mapping(string => uint256) public surveyToId;

    // ─── Events ───────────────────────────────────────────────────────────────
    event PropertyRegistered(
        uint256 indexed propertyId,
        address indexed owner,
        string  surveyNumber,
        uint256 registrationDate
    );
    event OwnershipUpdated(
        uint256 indexed propertyId,
        address indexed previousOwner,
        address indexed newOwner
    );
    event PropertyStatusChanged(
        uint256 indexed propertyId,
        bool    isActive
    );
    event MortgageStatusChanged(
        uint256 indexed propertyId,
        bool    isMortgaged
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE,     msg.sender);
    }

    // ─── External / public functions ─────────────────────────────────────────

    /**
     * @notice Register a new land property.
     * @param surveyNumber  Official survey / parcel number (must be unique).
     * @param area          Property area in square metres ×100.
     * @param coordinates   Geo-coordinates string.
     * @param city          City where the property is located.
     * @param state         State/province where the property is located.
     * @param ipfsDocHash   IPFS CID of the supporting title document.
     * @return propertyId   Auto-incremented identifier for the new property.
     */
    function registerProperty(
        string calldata surveyNumber,
        uint256         area,
        string calldata coordinates,
        string calldata city,
        string calldata state,
        string calldata ipfsDocHash
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256 propertyId) {
        require(bytes(surveyNumber).length  > 0, "PropertyRegistry: empty survey number");
        require(bytes(coordinates).length   > 0, "PropertyRegistry: empty coordinates");
        require(bytes(city).length          > 0, "PropertyRegistry: empty city");
        require(bytes(state).length         > 0, "PropertyRegistry: empty state");
        require(bytes(ipfsDocHash).length   > 0, "PropertyRegistry: empty IPFS hash");
        require(area > 0,                        "PropertyRegistry: area must be > 0");
        require(
            surveyToId[surveyNumber] == 0,
            "PropertyRegistry: survey number already registered"
        );

        unchecked { _propertyCounter++; }
        propertyId = _propertyCounter;

        properties[propertyId] = Property({
            id:               propertyId,
            owner:            msg.sender,
            surveyNumber:     surveyNumber,
            area:             area,
            coordinates:      coordinates,
            city:             city,
            state:            state,
            ipfsDocHash:      ipfsDocHash,
            registrationDate: block.timestamp,
            isActive:         true,
            isMortgaged:      false
        });

        surveyToId[surveyNumber] = propertyId;

        emit PropertyRegistered(propertyId, msg.sender, surveyNumber, block.timestamp);
    }

    /**
     * @notice Transfer ownership of a property to a new address.
     * @dev    Called exclusively by the TransferRegistry contract (TRANSFER_ROLE).
     */
    function updateOwner(
        uint256 propertyId,
        address newOwner
    ) external onlyRole(TRANSFER_ROLE) {
        require(newOwner != address(0), "PropertyRegistry: new owner is zero address");
        Property storage prop = _requireActive(propertyId);
        require(!prop.isMortgaged,      "PropertyRegistry: property is mortgaged");

        address previousOwner = prop.owner;
        prop.owner = newOwner;

        emit OwnershipUpdated(propertyId, previousOwner, newOwner);
    }

    /**
     * @notice Toggle the active status of a property.
     * @dev    Only the DEFAULT_ADMIN_ROLE can deactivate/reactivate a property.
     */
    function setPropertyStatus(
        uint256 propertyId,
        bool    isActive
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            properties[propertyId].id != 0,
            "PropertyRegistry: property does not exist"
        );
        properties[propertyId].isActive = isActive;
        emit PropertyStatusChanged(propertyId, isActive);
    }

    /**
     * @notice Set the mortgage status of a property.
     * @dev    Called exclusively by the MortgageContract (MORTGAGE_ROLE).
     */
    function setMortgageStatus(
        uint256 propertyId,
        bool    status
    ) external onlyRole(MORTGAGE_ROLE) {
        _requireActive(propertyId);
        properties[propertyId].isMortgaged = status;
        emit MortgageStatusChanged(propertyId, status);
    }

    /**
     * @notice Retrieve a complete property record.
     */
    function getProperty(
        uint256 propertyId
    ) external view returns (Property memory) {
        require(
            properties[propertyId].id != 0,
            "PropertyRegistry: property does not exist"
        );
        return properties[propertyId];
    }

    /**
     * @notice Return the total number of registered properties.
     */
    function getPropertyCount() external view returns (uint256) {
        return _propertyCounter;
    }

    // ─── Internal helpers ─────────────────────────────────────────────────────

    function _requireActive(
        uint256 propertyId
    ) internal view returns (Property storage prop) {
        prop = properties[propertyId];
        require(prop.id != 0,   "PropertyRegistry: property does not exist");
        require(prop.isActive,  "PropertyRegistry: property is not active");
    }
}
