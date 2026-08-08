const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("====================================================");
  console.log("Deploying Compliant Escrow Protocol Contracts");
  console.log("Deployer Account:", deployer.address);
  console.log("Account Balance:", (await ethers.provider.getBalance(deployer.address)).toString());
  console.log("====================================================");

  // Attestor address defaults to deployer unless specified
  const attestorAddress = process.env.ATTESTOR_ADDRESS || deployer.address;

  // 1. Deploy Mock A-Token
  console.log("Deploying Mock A-Token...");
  const MockToken = await ethers.getContractFactory("MockAToken");
  const mockToken = await MockToken.deploy("Cleanverse Test A-Token", "cATKN");
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("-> Mock A-Token deployed at:", tokenAddress);

  // 2. Deploy EscrowFactory
  console.log("Deploying EscrowFactory with Attestor:", attestorAddress);
  const Factory = await ethers.getContractFactory("EscrowFactory");
  const factory = await Factory.deploy(attestorAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("-> EscrowFactory deployed at:", factoryAddress);

  console.log("====================================================");
  console.log("DEPLOYMENT COMPLETE");
  console.log("ATOKEN_ADDRESS=", tokenAddress);
  console.log("FACTORY_ADDRESS=", factoryAddress);
  console.log("ATTESTOR_ADDRESS=", attestorAddress);
  console.log("====================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
