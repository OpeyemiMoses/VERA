import { ethers } from 'ethers';
import { CleanverseClient, VerifyParticipantParams } from '../services/cleanverseClient';
import { ComplianceAttestorService } from '../services/attestor';

const FACTORY_ABI = [
  'function createEscrow(address token, uint256 amount) external returns (address escrowAddress)',
  'function getDeployedEscrows() external view returns (address[])',
  'event EscrowCreated(address indexed escrowAddress, address indexed client, address indexed token, uint256 amount)',
];

const ESCROW_ABI = [
  'function fund() external',
  'function acceptWithAttestation(bytes memory signature, uint256 deadline) external',
  'function release() external',
  'function dispute() external',
  'function cancel() external',
  'function state() external view returns (uint8)',
  'function client() external view returns (address)',
  'function freelancer() external view returns (address)',
  'function amount() external view returns (uint256)',
  'function token() external view returns (address)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];

export interface CreateEscrowOptions {
  tokenAddress: string;
  amount: string; // Ether / token units string (e.g. "500")
  clientSigner: ethers.Signer;
}

export interface AcceptEscrowOptions {
  escrowAddress: string;
  poolAddress: string;
  freelancerSigner: ethers.Signer;
  chain?: string;
}

export class CompliantEscrowSDK {
  public cleanverse: CleanverseClient;
  public attestor: ComplianceAttestorService;
  public factoryAddress: string;
  public provider: ethers.Provider;

  constructor(
    factoryAddress: string,
    attestorPrivateKey: string,
    provider: ethers.Provider,
    cleanverseApiUrl?: string,
    cleanverseApiKey?: string
  ) {
    this.factoryAddress = factoryAddress;
    this.provider = provider;
    this.cleanverse = new CleanverseClient(cleanverseApiUrl, cleanverseApiKey);
    this.attestor = new ComplianceAttestorService(attestorPrivateKey);
  }

  private async getNonce(address: string): Promise<number> {
    if (this.provider instanceof ethers.JsonRpcProvider) {
      const hexCount = await (this.provider as ethers.JsonRpcProvider).send('eth_getTransactionCount', [address, 'pending']);
      return parseInt(hexCount, 16);
    }
    return await this.provider.getTransactionCount(address, 'pending');
  }

  /**
   * Deploy a new Escrow contract instance via EscrowFactory
   */
  public async createEscrow(options: CreateEscrowOptions): Promise<string> {
    const clientAddress = await options.clientSigner.getAddress();
    const nonce = await this.getNonce(clientAddress);

    const factoryContract = new ethers.Contract(this.factoryAddress, FACTORY_ABI, options.clientSigner);
    const amountWei = ethers.parseEther(options.amount);

    const tx = await factoryContract.createEscrow(options.tokenAddress, amountWei, { nonce });
    const receipt = await tx.wait();

    const event = receipt.logs.find((log: any) => log.fragment && log.fragment.name === 'EscrowCreated');
    return event ? event.args[0] : receipt.to;
  }

  /**
   * Fund an existing Escrow instance (Approve ERC20 + Fund)
   */
  public async fundEscrow(escrowAddress: string, clientSigner: ethers.Signer): Promise<string> {
    const clientAddress = await clientSigner.getAddress();
    const readOnlyEscrow = new ethers.Contract(escrowAddress, ESCROW_ABI, this.provider);
    const tokenAddress = await readOnlyEscrow.token();
    const amount = await readOnlyEscrow.amount();

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, clientSigner);

    // Check & Approve allowance if necessary
    const allowance = await tokenContract.allowance(clientAddress, escrowAddress);
    if (allowance < amount) {
      const approveNonce = await this.getNonce(clientAddress);
      const approveTx = await tokenContract.approve(escrowAddress, amount, { nonce: approveNonce });
      await approveTx.wait();
    }

    const fundNonce = await this.getNonce(clientAddress);
    const escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, clientSigner);
    const fundTx = await escrowContract.fund({ nonce: fundNonce });
    const receipt = await fundTx.wait();
    return receipt.hash;
  }

  /**
   * Gated Job Acceptance: Check Cleanverse API -> Issue Attestation -> Call `acceptWithAttestation`
   */
  public async verifyAndAcceptEscrow(options: AcceptEscrowOptions): Promise<{
    success: boolean;
    txHash?: string;
    reason?: string;
  }> {
    const freelancerAddress = await options.freelancerSigner.getAddress();

    // 1. Live Cleanverse Compliance Check
    const verifyRes = await this.cleanverse.verifyParticipant({
      chain: options.chain || 'base-sepolia',
      poolAddress: options.poolAddress,
      userAddress: freelancerAddress,
    });

    if (!verifyRes.valid) {
      return {
        success: false,
        reason: verifyRes.reason || 'User failed Cleanverse compliance check',
      };
    }

    // 2. Verification Passed! Backend Signs Cryptographic Attestation
    const attestation = await this.attestor.signAttestation(
      options.escrowAddress,
      freelancerAddress,
      300 // 5 minutes valid
    );

    // 3. Call Smart Contract `acceptWithAttestation`
    const nonce = await this.getNonce(freelancerAddress);
    const escrowContract = new ethers.Contract(options.escrowAddress, ESCROW_ABI, options.freelancerSigner);
    const tx = await escrowContract.acceptWithAttestation(attestation.signature, attestation.deadline, { nonce });
    const receipt = await tx.wait();

    return {
      success: true,
      txHash: receipt.hash,
    };
  }

  /**
   * Release escrow funds to freelancer
   */
  public async releaseEscrow(escrowAddress: string, signer: ethers.Signer): Promise<string> {
    const callerAddress = await signer.getAddress();
    const nonce = await this.getNonce(callerAddress);
    const escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
    const tx = await escrowContract.release({ nonce });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Trigger dispute on escrow
   */
  public async disputeEscrow(escrowAddress: string, signer: ethers.Signer): Promise<string> {
    const callerAddress = await signer.getAddress();
    const nonce = await this.getNonce(callerAddress);
    const escrowContract = new ethers.Contract(escrowAddress, ESCROW_ABI, signer);
    const tx = await escrowContract.dispute({ nonce });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  /**
   * Download Travel Rule Audit PDF
   */
  public async downloadAuditReport(txHash: string, chain: string = 'base-sepolia'): Promise<Buffer | null> {
    return await this.cleanverse.downloadTravelRuleReport({ txHash, chain });
  }
}
