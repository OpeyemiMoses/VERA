import { ethers } from 'ethers';

export interface AttestationSignature {
  signature: string;
  deadline: number;
  messageHash: string;
}

export class ComplianceAttestorService {
  private signer: ethers.Wallet;

  constructor(privateKey: string) {
    this.signer = new ethers.Wallet(privateKey);
  }

  public getAttestorAddress(): string {
    return this.signer.address;
  }

  /**
   * Generate an ECDSA compliance attestation signature for an Escrow contract call.
   * Digest contains: keccak256(abi.encodePacked(escrowAddress, freelancerAddress, deadline))
   */
  public async signAttestation(
    escrowAddress: string,
    freelancerAddress: string,
    validitySeconds: number = 300
  ): Promise<AttestationSignature> {
    const deadline = Math.floor(Date.now() / 1000) + validitySeconds;

    // Safely checksum addresses using lowercase to avoid mixed-case EIP-55 checksum errors
    let cleanEscrow: string;
    let cleanFreelancer: string;
    try {
      cleanEscrow = ethers.getAddress(escrowAddress.toLowerCase());
    } catch {
      cleanEscrow = ethers.ZeroAddress;
    }
    try {
      cleanFreelancer = ethers.getAddress(freelancerAddress.toLowerCase());
    } catch {
      cleanFreelancer = ethers.ZeroAddress;
    }

    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256'],
      [cleanEscrow, cleanFreelancer, deadline]
    );

    // Sign Ethereum Signed Message hash
    const signature = await this.signer.signMessage(ethers.getBytes(messageHash));

    return {
      signature,
      deadline,
      messageHash,
    };
  }
}
