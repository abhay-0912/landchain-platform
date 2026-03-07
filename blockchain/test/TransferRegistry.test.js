const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("TransferRegistry", function () {
  let propertyRegistry, transferRegistry;
  let admin, registrar, officer, seller, buyer, stranger;

  const SURVEY    = "TRF-001-2024";
  const AREA      = 30000;
  const COORDS    = "28.6139,77.2090";
  const CITY      = "New Delhi";
  const STATE     = "Delhi";
  const IPFS_HASH = "QmPropertyDocHash";
  const AGR_HASH  = "QmAgreementDocHash";
  const SALE_PRICE = ethers.parseEther("5");

  let propertyId;

  beforeEach(async function () {
    [admin, registrar, officer, seller, buyer, stranger] =
      await ethers.getSigners();

    // Deploy PropertyRegistry
    const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = await PropertyRegistry.deploy();
    await propertyRegistry.waitForDeployment();

    // Deploy TransferRegistry
    const TransferRegistry = await ethers.getContractFactory("TransferRegistry");
    transferRegistry = await TransferRegistry.deploy(
      await propertyRegistry.getAddress()
    );
    await transferRegistry.waitForDeployment();

    // Configure roles
    const REGISTRAR_ROLE = await propertyRegistry.REGISTRAR_ROLE();
    const TRANSFER_ROLE  = await propertyRegistry.TRANSFER_ROLE();
    const OFFICER_ROLE   = await transferRegistry.OFFICER_ROLE();

    await propertyRegistry.grantRole(REGISTRAR_ROLE, registrar.address);
    await propertyRegistry.grantRole(
      TRANSFER_ROLE,
      await transferRegistry.getAddress()
    );
    await transferRegistry.grantRole(OFFICER_ROLE, officer.address);

    // Register a property owned by seller
    await propertyRegistry
      .connect(registrar)
      .registerProperty(SURVEY, AREA, COORDS, CITY, STATE, IPFS_HASH);

    // Find the property ID
    propertyId = await propertyRegistry.surveyToId(SURVEY);

    // Transfer property ownership to seller via TRANSFER_ROLE
    await propertyRegistry
      .connect(admin)
      .grantRole(await propertyRegistry.TRANSFER_ROLE(), admin.address);
    await propertyRegistry.connect(admin).updateOwner(propertyId, seller.address);
  });

  // ─── initiateTransfer ──────────────────────────────────────────────────────

  describe("initiateTransfer", function () {
    it("should create a transfer in PENDING state", async function () {
      await expect(
        transferRegistry
          .connect(seller)
          .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH)
      )
        .to.emit(transferRegistry, "TransferInitiated")
        .withArgs(1, propertyId, seller.address, buyer.address, SALE_PRICE);

      const t = await transferRegistry.getTransfer(1);
      expect(t.id).to.equal(1);
      expect(t.propertyId).to.equal(propertyId);
      expect(t.seller).to.equal(seller.address);
      expect(t.buyer).to.equal(buyer.address);
      expect(t.salePrice).to.equal(SALE_PRICE);
      expect(t.agreementHash).to.equal(AGR_HASH);
      expect(t.state).to.equal(0); // PENDING
    });

    it("should reject if caller is not the property owner", async function () {
      await expect(
        transferRegistry
          .connect(stranger)
          .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH)
      ).to.be.revertedWith("TransferRegistry: caller is not the property owner");
    });

    it("should reject if buyer equals seller", async function () {
      await expect(
        transferRegistry
          .connect(seller)
          .initiateTransfer(propertyId, seller.address, SALE_PRICE, AGR_HASH)
      ).to.be.revertedWith("TransferRegistry: buyer equals seller");
    });

    it("should reject zero sale price", async function () {
      await expect(
        transferRegistry
          .connect(seller)
          .initiateTransfer(propertyId, buyer.address, 0, AGR_HASH)
      ).to.be.revertedWith("TransferRegistry: sale price must be > 0");
    });

    it("should reject empty agreement hash", async function () {
      await expect(
        transferRegistry
          .connect(seller)
          .initiateTransfer(propertyId, buyer.address, SALE_PRICE, "")
      ).to.be.revertedWith("TransferRegistry: empty agreement hash");
    });

    it("should reject a second active transfer on the same property", async function () {
      await transferRegistry
        .connect(seller)
        .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH);

      await expect(
        transferRegistry
          .connect(seller)
          .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH)
      ).to.be.revertedWith(
        "TransferRegistry: property already has an active transfer"
      );
    });
  });

  // ─── Full happy-path lifecycle ─────────────────────────────────────────────

  describe("Full transfer lifecycle: initiate → confirm → approve → complete", function () {
    let transferId;

    beforeEach(async function () {
      const tx = await transferRegistry
        .connect(seller)
        .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH);
      await tx.wait();
      transferId = 1;
    });

    it("buyer can confirm → state becomes BUYER_CONFIRMED", async function () {
      await expect(transferRegistry.connect(buyer).confirmByBuyer(transferId))
        .to.emit(transferRegistry, "BuyerConfirmed")
        .withArgs(transferId, buyer.address);

      const t = await transferRegistry.getTransfer(transferId);
      expect(t.state).to.equal(1); // BUYER_CONFIRMED
    });

    it("non-buyer cannot confirm", async function () {
      await expect(
        transferRegistry.connect(stranger).confirmByBuyer(transferId)
      ).to.be.revertedWith("TransferRegistry: caller is not the buyer");
    });

    it("officer can approve → state becomes OFFICER_APPROVED", async function () {
      await transferRegistry.connect(buyer).confirmByBuyer(transferId);

      await expect(transferRegistry.connect(officer).approveByOfficer(transferId))
        .to.emit(transferRegistry, "OfficerApproved")
        .withArgs(transferId, officer.address);

      const t = await transferRegistry.getTransfer(transferId);
      expect(t.state).to.equal(2); // OFFICER_APPROVED
    });

    it("officer cannot approve before buyer confirms", async function () {
      await expect(
        transferRegistry.connect(officer).approveByOfficer(transferId)
      ).to.be.revertedWith(
        "TransferRegistry: transfer is not in the expected state"
      );
    });

    it("completeTransfer updates ownership and emits event", async function () {
      await transferRegistry.connect(buyer).confirmByBuyer(transferId);
      await transferRegistry.connect(officer).approveByOfficer(transferId);

      await expect(
        transferRegistry.connect(seller).completeTransfer(transferId)
      )
        .to.emit(transferRegistry, "TransferCompleted")
        .withArgs(transferId, propertyId, buyer.address);

      const prop = await propertyRegistry.getProperty(propertyId);
      expect(prop.owner).to.equal(buyer.address);

      const t = await transferRegistry.getTransfer(transferId);
      expect(t.state).to.equal(3); // COMPLETED
      expect(t.completedAt).to.be.gt(0);
    });

    it("active transfer is cleared after completion", async function () {
      await transferRegistry.connect(buyer).confirmByBuyer(transferId);
      await transferRegistry.connect(officer).approveByOfficer(transferId);
      await transferRegistry.connect(seller).completeTransfer(transferId);

      expect(
        await transferRegistry.getActiveTransferForProperty(propertyId)
      ).to.equal(0);
    });
  });

  // ─── cancelTransfer ────────────────────────────────────────────────────────

  describe("cancelTransfer", function () {
    let transferId;

    beforeEach(async function () {
      await transferRegistry
        .connect(seller)
        .initiateTransfer(propertyId, buyer.address, SALE_PRICE, AGR_HASH);
      transferId = 1;
    });

    it("seller can cancel a PENDING transfer", async function () {
      await expect(transferRegistry.connect(seller).cancelTransfer(transferId))
        .to.emit(transferRegistry, "TransferCancelled")
        .withArgs(transferId, seller.address);

      const t = await transferRegistry.getTransfer(transferId);
      expect(t.state).to.equal(4); // CANCELLED
    });

    it("buyer can cancel a PENDING transfer", async function () {
      await expect(transferRegistry.connect(buyer).cancelTransfer(transferId))
        .to.emit(transferRegistry, "TransferCancelled")
        .withArgs(transferId, buyer.address);
    });

    it("seller can cancel after buyer confirms", async function () {
      await transferRegistry.connect(buyer).confirmByBuyer(transferId);
      await expect(
        transferRegistry.connect(seller).cancelTransfer(transferId)
      ).to.emit(transferRegistry, "TransferCancelled");
    });

    it("stranger cannot cancel", async function () {
      await expect(
        transferRegistry.connect(stranger).cancelTransfer(transferId)
      ).to.be.revertedWith("TransferRegistry: not authorised to cancel");
    });

    it("cannot cancel an already completed transfer", async function () {
      await transferRegistry.connect(buyer).confirmByBuyer(transferId);
      await transferRegistry.connect(officer).approveByOfficer(transferId);
      await transferRegistry.connect(seller).completeTransfer(transferId);

      await expect(
        transferRegistry.connect(seller).cancelTransfer(transferId)
      ).to.be.revertedWith("TransferRegistry: transfer already finalised");
    });

    it("cannot cancel an already cancelled transfer", async function () {
      await transferRegistry.connect(seller).cancelTransfer(transferId);
      await expect(
        transferRegistry.connect(seller).cancelTransfer(transferId)
      ).to.be.revertedWith("TransferRegistry: transfer already finalised");
    });

    it("clears the active transfer slot after cancellation", async function () {
      await transferRegistry.connect(seller).cancelTransfer(transferId);
      expect(
        await transferRegistry.getActiveTransferForProperty(propertyId)
      ).to.equal(0);
    });
  });

  // ─── getTransfer validation ────────────────────────────────────────────────

  describe("getTransfer", function () {
    it("should revert for a non-existent transfer ID", async function () {
      await expect(transferRegistry.getTransfer(999)).to.be.revertedWith(
        "TransferRegistry: transfer does not exist"
      );
    });
  });
});
