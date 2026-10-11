const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Upload", function () {
  let upload, owner, other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Upload = await ethers.getContractFactory("Upload");
    upload = await Upload.deploy();
    await upload.deployed();
  });

  it("owner can add and view a file", async () => {
    await upload.add(owner.address, "ipfs://abc");
    expect(await upload.display(owner.address)).to.deep.equal(["ipfs://abc"]);
  });

  it("rejects adding a file to someone else's list", async () => {
    await expect(
      upload.connect(other).add(owner.address, "ipfs://x")
    ).to.be.revertedWith("Only owner can add");
  });

  it("blocks viewing without access", async () => {
    await upload.add(owner.address, "ipfs://abc");
    await expect(
      upload.connect(other).display(owner.address)
    ).to.be.revertedWith("You are not allowed to view");
  });

  it("allows viewing after access is granted", async () => {
    await upload.add(owner.address, "ipfs://abc");
    await upload.allow(other.address, 1000);
    expect(
      await upload.connect(other).display(owner.address)
    ).to.deep.equal(["ipfs://abc"]);
  });

  it("access expires after the duration", async () => {
    await upload.add(owner.address, "ipfs://abc");
    await upload.allow(other.address, 100);
    await time.increase(200);
    await expect(
      upload.connect(other).display(owner.address)
    ).to.be.revertedWith("You are not allowed to view");
  });

  it("revoke removes access", async () => {
    await upload.add(owner.address, "ipfs://abc");
    await upload.allow(other.address, 1000);
    await upload.revoke(other.address);
    await expect(
      upload.connect(other).display(owner.address)
    ).to.be.revertedWith("You are not allowed to view");
  });
});