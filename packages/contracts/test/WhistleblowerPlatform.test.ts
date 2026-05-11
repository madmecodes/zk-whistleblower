import { expect } from "chai";
import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhistleblowerPlatform", function () {
  let platform: any;
  let admin: SignerWithAddress;
  let user: SignerWithAddress;

  // We test against a mock Semaphore that just accepts everything.
  // Full integration tests require a Sepolia fork or local Semaphore deployment.
  // This tests the contract's own logic (access control, storage, events).

  beforeEach(async function () {
    [admin, user] = await ethers.getSigners();

    // Deploy a minimal mock of ISemaphore for unit testing
    const MockSemaphore = await ethers.getContractFactory("MockSemaphore");
    const mockSemaphore = await MockSemaphore.deploy();
    await mockSemaphore.waitForDeployment();

    const Platform = await ethers.getContractFactory("WhistleblowerPlatform");
    platform = await Platform.deploy(await mockSemaphore.getAddress());
    await platform.waitForDeployment();
  });

  describe("createOrganization", function () {
    it("should create an org and emit OrganizationCreated", async function () {
      const tx = await platform.createOrganization("TestOrg");
      const receipt = await tx.wait();

      expect(await platform.orgCount()).to.equal(1);

      const org = await platform.getOrganization(0);
      expect(org.name).to.equal("TestOrg");
      expect(org.admin).to.equal(admin.address);
      expect(org.memberCount).to.equal(0);
    });
  });

  describe("joinOrganization", function () {
    it("should add a member when called by admin", async function () {
      await platform.createOrganization("TestOrg");
      const commitment = 12345n;

      await expect(platform.joinOrganization(0, commitment))
        .to.emit(platform, "MemberAdded")
        .withArgs(0, commitment);

      const org = await platform.getOrganization(0);
      expect(org.memberCount).to.equal(1);
    });

    it("should revert when called by non-admin", async function () {
      await platform.createOrganization("TestOrg");
      const commitment = 12345n;

      await expect(
        platform.connect(user).joinOrganization(0, commitment)
      ).to.be.revertedWithCustomError(platform, "NotOrgAdmin");
    });

    it("should revert for non-existent org", async function () {
      await expect(
        platform.joinOrganization(999, 12345n)
      ).to.be.revertedWithCustomError(platform, "OrgDoesNotExist");
    });
  });

  describe("submitReport", function () {
    it("should revert for non-existent org", async function () {
      await expect(
        platform.submitReport(
          999,
          "QmTestCid",
          "fraud",
          20,
          0,
          0,
          0,
          [0, 0, 0, 0, 0, 0, 0, 0]
        )
      ).to.be.revertedWithCustomError(platform, "OrgDoesNotExist");
    });
  });
});
