const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Compliant Escrow Protocol Smart Contracts", function () {
  let mockToken, escrowFactory, escrow;
  let owner, client, freelancer, unverifiedUser, attestorSigner;
  const AMOUNT = ethers.parseEther("500");

  beforeEach(async function () {
    [owner, client, freelancer, unverifiedUser, attestorSigner] = await ethers.getSigners();

    // 1. Deploy Mock A-Token
    const MockTokenFactory = await ethers.getContractFactory("MockAToken");
    mockToken = await MockTokenFactory.deploy("Cleanverse Test A-Token", "cATKN");
    await mockToken.waitForDeployment();

    // Mint tokens to client
    await mockToken.mint(client.address, ethers.parseEther("10000"));

    // 2. Deploy EscrowFactory
    const Factory = await ethers.getContractFactory("EscrowFactory");
    escrowFactory = await Factory.deploy(attestorSigner.address);
    await escrowFactory.waitForDeployment();

    // 3. Create Escrow instance via Factory
    const tx = await escrowFactory.connect(client).createEscrow(await mockToken.getAddress(), AMOUNT);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'EscrowCreated');
    const escrowAddress = event.args[0];

    const EscrowContract = await ethers.getContractFactory("Escrow");
    escrow = EscrowContract.attach(escrowAddress);
  });

  it("should initialize with correct parameters and state", async function () {
    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.amount()).to.equal(AMOUNT);
    expect(await escrow.complianceAttestor()).to.equal(attestorSigner.address);
    expect(await escrow.state()).to.equal(0); // State.Created
  });

  it("should allow client to fund escrow", async function () {
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await expect(escrow.connect(client).fund())
      .to.emit(escrow, "EscrowFunded")
      .withArgs(client.address, AMOUNT);

    expect(await escrow.state()).to.equal(1); // State.Funded
    expect(await mockToken.balanceOf(await escrow.getAddress())).to.equal(AMOUNT);
  });

  it("should accept job when valid compliance attestation is provided", async function () {
    // Fund first
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(client).fund();

    // Create valid attestation signature signed by attestorSigner
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [await escrow.getAddress(), freelancer.address, deadline]
    );

    const signature = await attestorSigner.signMessage(ethers.getBytes(messageHash));

    // Freelancer submits attestation signature
    await expect(escrow.connect(freelancer).acceptWithAttestation(signature, deadline))
      .to.emit(escrow, "EscrowAccepted")
      .withArgs(freelancer.address);

    expect(await escrow.state()).to.equal(2); // State.Accepted
    expect(await escrow.freelancer()).to.equal(freelancer.address);
  });

  it("should reject attestation signed by unauthorized attestor", async function () {
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(client).fund();

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [await escrow.getAddress(), unverifiedUser.address, deadline]
    );

    // Signed by unverifiedUser instead of attestorSigner
    const invalidSignature = await unverifiedUser.signMessage(ethers.getBytes(messageHash));

    await expect(
      escrow.connect(unverifiedUser).acceptWithAttestation(invalidSignature, deadline)
    ).to.be.revertedWith("Invalid compliance attestation signature");
  });

  it("should release funds to freelancer upon completion", async function () {
    // Fund & Accept
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(client).fund();

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [await escrow.getAddress(), freelancer.address, deadline]
    );
    const signature = await attestorSigner.signMessage(ethers.getBytes(messageHash));
    await escrow.connect(freelancer).acceptWithAttestation(signature, deadline);

    // Release
    const initialBalance = await mockToken.balanceOf(freelancer.address);
    await expect(escrow.connect(client).release())
      .to.emit(escrow, "EscrowReleased")
      .withArgs(freelancer.address, AMOUNT);

    expect(await escrow.state()).to.equal(3); // State.Completed
    expect(await mockToken.balanceOf(freelancer.address)).to.equal(initialBalance + AMOUNT);
  });

  it("should handle dispute and resolution", async function () {
    // Fund & Accept
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(client).fund();

    const deadline = Math.floor(Date.now() / 1000) + 3600;
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "address", "uint256"],
      [await escrow.getAddress(), freelancer.address, deadline]
    );
    const signature = await attestorSigner.signMessage(ethers.getBytes(messageHash));
    await escrow.connect(freelancer).acceptWithAttestation(signature, deadline);

    // Trigger dispute
    await expect(escrow.connect(client).dispute())
      .to.emit(escrow, "EscrowDisputed")
      .withArgs(client.address);

    expect(await escrow.state()).to.equal(4); // State.Disputed

    // Resolve in favor of freelancer
    const initialBalance = await mockToken.balanceOf(freelancer.address);
    await escrow.connect(client).resolve(freelancer.address);

    expect(await escrow.state()).to.equal(5); // State.Resolved
    expect(await mockToken.balanceOf(freelancer.address)).to.equal(initialBalance + AMOUNT);
  });

  it("should allow client to cancel unfunded / unaccepted escrow", async function () {
    await mockToken.connect(client).approve(await escrow.getAddress(), AMOUNT);
    await escrow.connect(client).fund();

    const initialBalance = await mockToken.balanceOf(client.address);
    await escrow.connect(client).cancel();

    expect(await escrow.state()).to.equal(6); // State.Cancelled
    expect(await mockToken.balanceOf(client.address)).to.equal(initialBalance + AMOUNT);
  });
});
