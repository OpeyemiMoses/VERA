/**
 * redeploy-catkn.js
 * Redeploys only the MockAToken (cATKN) contract with the new public faucet.
 * Keeps the existing EscrowFactory address unchanged.
 */
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("====================================================");
  console.log("Redeploying cATKN (MockAToken) with public faucet");
  console.log("Deployer:", deployer.address);
  const bal = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(bal), "MON");
  console.log("====================================================");

  const MockToken = await ethers.getContractFactory("MockAToken");
  const mockToken = await MockToken.deploy("Cleanverse Test A-Token", "cATKN");
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();

  console.log("-> cATKN deployed at:", tokenAddress);
  console.log("====================================================");
  console.log("Update the following in BOTH:");
  console.log("  contracts/.env          →  ATOKEN_ADDRESS=" + tokenAddress);
  console.log("  app/.env.local          →  NEXT_PUBLIC_CATKN_ADDRESS=" + tokenAddress);
  console.log("====================================================");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err);
    process.exit(1);
  });
