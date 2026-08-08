import crypto from 'crypto';

/**
 * Cleanverse AES Encryption Service
 * Cleanverse APIs use AES-128-CBC (zero IV or specified IV) with hex/base64 encoding.
 */
export class CleanverseEncryptor {
  private secretKey: Buffer;

  constructor(secretKeyHexOrString: string) {
    // Standardize secret key to 16 bytes for AES-128 or 32 bytes for AES-256
    let keyBuffer = Buffer.from(secretKeyHexOrString, 'utf-8');
    if (secretKeyHexOrString.length === 32 || secretKeyHexOrString.length === 64) {
      keyBuffer = Buffer.from(secretKeyHexOrString, 'hex');
    }

    if (keyBuffer.length !== 16 && keyBuffer.length !== 32) {
      // Pad or slice to 16 bytes (AES-128) if needed
      const padded = Buffer.alloc(16);
      keyBuffer.copy(padded, 0, 0, Math.min(keyBuffer.length, 16));
      this.secretKey = padded;
    } else {
      this.secretKey = keyBuffer;
    }
  }

  /**
   * Encrypt payload string into AES-CBC hex string
   */
  public encrypt(plainText: string): string {
    const algorithm = this.secretKey.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const iv = Buffer.alloc(16, 0); // Cleanverse zero IV
    const cipher = crypto.createCipheriv(algorithm, this.secretKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Decrypt hex string back to plaintext JSON
   */
  public decrypt(cipherTextHex: string): string {
    const algorithm = this.secretKey.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const iv = Buffer.alloc(16, 0);
    const decipher = crypto.createDecipheriv(algorithm, this.secretKey, iv);
    let decrypted = decipher.update(cipherTextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
