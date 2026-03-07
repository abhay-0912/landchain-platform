const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("PropertyRegistry", function () {
  let propertyRegistry;
  let owner, registrar, transferAddr, mortgageAddr, stranger;

  // Sample property data reused across tests
  const SURVEY    = "SYN-001-2024";
  const AREA      = 25000;           // 250.00 m²
  const COORDS    = "12.9716,77.5946";
  const CITY      = "Bengaluru";
  const STATE     = "Karnataka";
  const IPFS_HASH = "QmTestHashABC123";

  beforeEach(async function () {
    [owner, registrar, transferAddr, mortgageAddr, stranger] =
      await ethers.getSigners();

    const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = await PropertyRegistry.deploy();
    await propertyRegistry.waitForDeployment();

    // Grant roles
    const REGISTRAR_ROLE = await propertyRegistry.REGISTRAR_ROLE();
    const TRANSFER_ROLE  = await propertyRegistry.TRANSFER_ROLE();
    const MORTGAGE_ROLE  = await propertyRegistry.MORTGAGE_ROLE();

    await propertyRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
    await propertyRegistry.grantRole(TRANSFER_ROLE,  transferAddr.address);
    await propertyRegistry.grantRole(MORTGAGE_ROLE,  mortgageAddr.address);
  });

  // ─── registerProperty ──────────────────────────────────────────────────────

  describe("registerProperty", function () {
    it("should create a property with correct data", async function () {
      await expect(
        propertyRegistry
          .connect(registrar)
          .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH)
      )
        .to.emit(propertyRegistry, "PropertyRegistered")
        .withArgs(1, registrar.address, SURVEY, (v) => v > 0n);

      const prop = await propertyRegistry.getProperty(1);
      expect(prop.id).to.equal(1);
      expect(prop.owner).to.equal(registrar.address);
      expect(prop.surveyNumber).to.equal(SURVEY);
      expect(prop.area).to.equal(AREA);
      expect(prop.coordinates).to.equal(COORDS);
      expect(prop.city).to.equal(CITY);
      expect(prop.state).to.equal(STATE);
      expect(prop.ipfsDocHash).to.equal(IPFS_HASH);
      expect(prop.isActive).to.be.true;
      expect(prop.isMortgaged).to.be.false;
      expect(prop.registrationDate).to.be.gt(0);
    });

    it("should map survey number to the new property ID", async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);

      expect(await propertyRegistry.surveyToId(SURVEY)).to.equal(1);
    });

    it("should reject duplicate survey numbers", async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);

      await expect(
        propertyRegistry
          .connect(registrar)
          .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH)
      ).to.be.revertedWith("PropertyRegistry: survey number already registered");
    });

    it("should reject empty survey number", async function () {
      await expect(
        propertyRegistry
          .connect(registrar)
          .registerProperty("", AREA, COORDS, CITY, STATE, IPFS_HASH)
      ).to.be.revertedWith("PropertyRegistry: empty survey number");
    });

    it("should reject zero area", async function () {
      await expect(
        propertyRegistry
          .connect(registrar)
          .registerProperty(SURVEY, 0, COORDS, CITY, STATE, IPFS_HASH)
      ).to.be.revertedWith("PropertyRegistry: area must be > 0");
    });

    it("should reject callers without REGISTRAR_ROLE", async function () {
      await expect(
        propertyRegistry
          .connect(stranger)
          .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH)
      ).to.be.reverted;
    });
  });

  // ─── getPropertyCount ──────────────────────────────────────────────────────

  describe("getPropertyCount", function () {
    it("should start at zero", async function () {
      expect(await propertyRegistry.getPropertyCount()).to.equal(0);
    });

    it("should increment with each registration", async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);
      expect(await propertyRegistry.getPropertyCount()).to.equal(1);

      await propertyRegistry
        .connect(registrar)
        .registerProperty("SYN-002-2024", AREA, COORDS, CITY, STATE, IPFS_HASH);
      expect(await propertyRegistry.getPropertyCount()).to.equal(2);
    });
  });

  // ─── getProperty ───────────────────────────────────────────────────────────

  describe("getProperty", function () {
    it("should return correct data for an existing property", async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);

      const prop = await propertyRegistry.getProperty(1);
      expect(prop.surveyNumber).to.equal(SURVEY);
      expect(prop.city).to.equal(CITY);
    });

    it("should revert for a non-existent property", async function () {
      await expect(propertyRegistry.getProperty(999)).to.be.revertedWith(
        "PropertyRegistry: property does not exist"
      );
    });
  });

  // ─── updateOwner ───────────────────────────────────────────────────────────

  describe("updateOwner", function () {
    beforeEach(async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);
    });

    it("should change the owner when called with TRANSFER_ROLE", async function () {
      await expect(
        propertyRegistry.connect(transferAddr).updateOwner(1, stranger.address)
      )
        .to.emit(propertyRegistry, "OwnershipUpdated")
        .withArgs(1, registrar.address, stranger.address);

      const prop = await propertyRegistry.getProperty(1);
      expect(prop.owner).to.equal(stranger.address);
    });

    it("should reject callers without TRANSFER_ROLE", async function () {
      await expect(
        propertyRegistry.connect(stranger).updateOwner(1, stranger.address)
      ).to.be.reverted;
    });

    it("should reject a zero address as new owner", async function () {
      await expect(
        propertyRegistry
          .connect(transferAddr)
          .updateOwner(1, ethers.ZeroAddress)
      ).to.be.revertedWith("PropertyRegistry: new owner is zero address");
    });

    it("should reject transfer of a mortgaged property", async function () {
      await propertyRegistry.connect(mortgageAddr).setMortgageStatus(1, true);
      await expect(
        propertyRegistry.connect(transferAddr).updateOwner(1, stranger.address)
      ).to.be.revertedWith("PropertyRegistry: property is mortgaged");
    });
  });

  // ─── setMortgageStatus ─────────────────────────────────────────────────────

  describe("setMortgageStatus", function () {
    beforeEach(async function () {
      await propertyRegistry
        .connect(registrar)
        .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);
    });

    it("should set mortgage status when called with MORTGAGE_ROLE", async function () {
      await expect(
        propertyRegistry.connect(mortgageAddr).setMortgageStatus(1, true)
      )
        .to.emit(propertyRegistry, "MortgageStatusChanged")
        .withArgs(1, true);

      const prop = await propertyRegistry.getProperty(1);
      expect(prop.isMortgaged).to.be.true;
    });

    it("should reject callers without MORTGAGE_ROLE", async function () {
      await expect(
        propertyRegistry.connect(stranger).setMortgageStatus(1, true)
      ).to.be.reverted;
    });
  });

  // ─── Access control roles ──────────────────────────────────────────────────

  describe("Access control", function () {
    it("deployer should have DEFAULT_ADMIN_ROLE", async function () {
      const adminRole = await propertyRegistry.DEFAULT_ADMIN_ROLE();
      expect(await propertyRegistry.hasRole(adminRole, owner.address)).to.be.true;
    });

    it("deployer should have REGISTRAR_ROLE by default", async function () {
      const REGISTRAR_ROLE = await propertyRegistry.REGISTRAR_ROLE();
      expect(await propertyRegistry.hasRole(REGISTRAR_ROLE, owner.address)).to.be.true;
    });

    it("admin can grant and revoke roles", async function () {
      const REGISTRAR_ROLE = await propertyRegistry.REGISTRAR_ROLE();
      await propertyRegistry.grantRole(REGISTRAR_ROLE, stranger.address);
      expect(await propertyRegistry.hasRole(REGISTRAR_ROLE, stranger.address)).to.be.true;

      await propertyRegistry.revokeRole(REGISTRAR_ROLE, stranger.address);
      expect(await propertyRegistry.hasRole(REGISTRAR_ROLE, stranger.address)).to.be.false;
    });
  });
});
