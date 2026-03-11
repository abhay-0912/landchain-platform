// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract LandRegistry {
    struct Property {
        uint256 id;
        address owner;
        string location;
        string propertyType;
        uint256 area;
        uint256 timestamp;
    }

    mapping(uint256 => Property) public properties;
    uint256 public propertyCount;

    event PropertyRegistered(uint256 id, address owner, string location);

    function registerProperty(
        string calldata location,
        string calldata propertyType,
        uint256 area
    ) external {
        propertyCount += 1;

        properties[propertyCount] = Property({
            id: propertyCount,
            owner: msg.sender,
            location: location,
            propertyType: propertyType,
            area: area,
            timestamp: block.timestamp
        });

        emit PropertyRegistered(propertyCount, msg.sender, location);
    }

    function getProperty(
        uint256 id
    )
        external
        view
        returns (
            uint256,
            address,
            string memory,
            string memory,
            uint256,
            uint256
        )
    {
        Property memory property = properties[id];
        return (
            property.id,
            property.owner,
            property.location,
            property.propertyType,
            property.area,
            property.timestamp
        );
    }

    function getPropertyCount() external view returns (uint256) {
        return propertyCount;
    }
}
