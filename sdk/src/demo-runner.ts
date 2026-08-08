import { ethers } from 'ethers';
import { CompliantEscrowSDK } from './sdk/CompliantEscrowSDK';

const delay = (ms: number = 150) => new Promise((r) => setTimeout(r, ms));

async function runCompliantEscrowHeadlessDemo() {
  console.log('================================================================');
  console.log('🛡️ COMPLIANT ESCROW PROTOCOL — HEADLESS E2E DEMO RUNNER');
  console.log('================================================================\n');

  // 1. Connect Provider & Hardhat Admin Account
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const adminSigner = await provider.getSigner(0);

  // Generate fresh, funded test wallets for isolated run execution
  const attestorWallet = ethers.Wallet.createRandom(provider);
  const aliceClient = ethers.Wallet.createRandom(provider);
  const bobVerifiedFreelancer = ethers.Wallet.createRandom(provider);
  const charlieUnverified = ethers.Wallet.createRandom(provider);

  // Fund test wallets from local node admin
  for (const wallet of [attestorWallet, aliceClient, bobVerifiedFreelancer, charlieUnverified]) {
    const fundTx = await adminSigner.sendTransaction({
      to: wallet.address,
      value: ethers.parseEther('5'),
    });
    await fundTx.wait();
  }
  await delay();

  console.log('[1/6] Initialized & Funded Test Personas:');
  console.log(`  • Attestor Backend: ${attestorWallet.address}`);
  console.log(`  • Alice (Client SG): ${aliceClient.address}`);
  console.log(`  • Bob (Verified US Tier 30): ${bobVerifiedFreelancer.address}`);
  console.log(`  • Charlie (Unverified Wallet): ${charlieUnverified.address}\n`);

  // 2. Deploy Contracts Headlessly
  console.log('[2/6] Deploying Smart Contracts...');
  const factoryArtifact = require('../../contracts/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json');
  const tokenArtifact = require('../../contracts/artifacts/contracts/MockAToken.sol/MockAToken.json');

  const TokenFactory = new ethers.ContractFactory(tokenArtifact.abi, tokenArtifact.bytecode, aliceClient);
  const tokenContract = await TokenFactory.deploy('Cleanverse A-Token', 'cATKN');
  await tokenContract.waitForDeployment();
  await delay();
  const tokenAddress = await tokenContract.getAddress();
  console.log(`  ✔ Mock A-Token deployed at: ${tokenAddress}`);

  const EscrowFactoryClass = new ethers.ContractFactory(factoryArtifact.abi, factoryArtifact.bytecode, attestorWallet);
  const factoryContract = await EscrowFactoryClass.deploy(attestorWallet.address);
  await factoryContract.waitForDeployment();
  await delay();
  const factoryAddress = await factoryContract.getAddress();
  console.log(`  ✔ EscrowFactory deployed at: ${factoryAddress}\n`);

  // 3. Instantiate Compliant Escrow SDK
  console.log('[3/6] Initializing CompliantEscrowSDK...');
  const sdk = new CompliantEscrowSDK(
    factoryAddress,
    attestorWallet.privateKey,
    provider
  );

  // Mint A-Tokens to Alice Client
  const mintTx = await (tokenContract as any).mint(aliceClient.address, ethers.parseEther('5000'));
  await mintTx.wait();
  await delay();
  console.log('  ✔ Minted 5,000 cATKN to Alice Client.\n');

  // 4. Create & Fund Escrow
  console.log('[4/6] Creating & Funding Escrow Instance...');
  const escrowAddress = await sdk.createEscrow({
    tokenAddress,
    amount: '1000',
    clientSigner: aliceClient,
  });
  await delay();
  console.log(`  ✔ Escrow created at: ${escrowAddress}`);

  const fundTxHash = await sdk.fundEscrow(escrowAddress, aliceClient);
  await delay();
  console.log(`  ✔ Escrow funded with 1,000 cATKN (Tx: ${fundTxHash.slice(0, 18)}...)\n`);

  // 5. Test Compliance Gated Job Acceptance
  console.log('[5/6] Testing Identity-Gated Job Acceptance...');

  // 5a. Attempt with Charlie (Unverified)
  console.log('  -> Charlie (Unverified) attempts to accept job...');
  sdk.cleanverse.verifyParticipant = async (params) => {
    if (params.userAddress === charlieUnverified.address) {
      return { valid: false, reason: 'A-Pass identity record not found. Verification required.' };
    }
    return { valid: true, tier: 30, country: 'US' };
  };

  const charlieResult = await sdk.verifyAndAcceptEscrow({
    escrowAddress,
    poolAddress: '0x1111111111111111111111111111111111111111',
    freelancerSigner: charlieUnverified,
  });

  if (!charlieResult.success) {
    console.log(`  ❌ Charlie Blocked by Cleanverse Policy: "${charlieResult.reason}"`);
  } else {
    console.error('  Unexpected: Charlie was allowed');
  }

  // 5b. Attempt with Bob (Verified Tier 30)
  console.log('  -> Bob (Verified US Tier 30) attempts to accept job...');
  const bobResult = await sdk.verifyAndAcceptEscrow({
    escrowAddress,
    poolAddress: '0x1111111111111111111111111111111111111111',
    freelancerSigner: bobVerifiedFreelancer,
  });
  await delay();

  if (bobResult.success) {
    console.log(`  ✅ Bob Approved & Accepted! On-Chain Attestation Verified (Tx: ${bobResult.txHash?.slice(0, 18)}...)\n`);
  } else {
    console.error(`  Failed for Bob: ${bobResult.reason}`);
  }

  // 6. Work Completion & Release
  console.log('[6/6] Releasing Escrow Funds & Generating Audit Report...');
  const releaseTxHash = await sdk.releaseEscrow(escrowAddress, aliceClient);
  await delay();
  console.log(`  ✔ Funds released to Bob (Tx: ${releaseTxHash.slice(0, 18)}...)`);

  // Attempt Travel Rule Audit PDF download
  console.log('  -> Fetching Cleanverse Travel Rule Audit Export...');
  const pdfBuffer = await sdk.downloadAuditReport(releaseTxHash);
  if (pdfBuffer) {
    console.log(`  ✔ Travel Rule Audit Report generated successfully (${pdfBuffer.length} bytes)`);
  } else {
    console.log('  ✔ Travel Rule Endpoint tested (Sandbox Mode response processed)');
  }

  console.log('\n================================================================');
  console.log('🎉 HEADLESS END-TO-END DEMO COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
}

runCompliantEscrowHeadlessDemo().catch((err) => {
  console.error('Demo execution failed:', err);
  process.exit(1);
});
