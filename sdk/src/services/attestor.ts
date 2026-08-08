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

    const messageHash = ethers.solidityPackedKeccak256(
      ['address', 'address', 'uint256'],
      [escrowAddress, freelancerAddress, deadline]
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
