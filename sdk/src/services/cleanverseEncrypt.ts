import crypto from 'crypto';

/**
 * Cleanverse AES Encryption Service
 * Compliant with Cleanverse CCP: AES-256-CBC with PKCS#7 padding, fixed 16 zero-byte IV, 
 * base64-decoded API key (32 bytes), and base64/hex ciphertext payload envelopes.
 */
export class CleanverseEncryptor {
  private secretKey: Buffer;

  constructor(secretKeyStr: string) {
    // 1. Try base64 decoding (Cleanverse standard 32-byte decoded key)
    try {
      const b64Buf = Buffer.from(secretKeyStr, 'base64');
      if (b64Buf.length === 32 || b64Buf.length === 16) {
        this.secretKey = b64Buf;
        return;
      }
    } catch (e) {}

    // 2. Try hex decoding
    if (secretKeyStr.length === 32 || secretKeyStr.length === 64) {
      this.secretKey = Buffer.from(secretKeyStr, 'hex');
      return;
    }

    // 3. Fallback: UTF-8 buffer padded/sliced to 32 bytes (AES-256) or 16 bytes (AES-128)
    const raw = Buffer.from(secretKeyStr, 'utf-8');
    if (raw.length >= 32) {
      this.secretKey = raw.subarray(0, 32);
    } else {
      const padded = Buffer.alloc(32);
      raw.copy(padded, 0, 0, raw.length);
      this.secretKey = padded;
    }
  }

  /**
   * Encrypt payload string into AES-256-CBC ciphertext (Base64 by default for Cleanverse JSON payload)
   */
  public encrypt(plainText: string, encoding: 'base64' | 'hex' = 'base64'): string {
    const algorithm = this.secretKey.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const iv = Buffer.alloc(16, 0); // Fixed 16 zero bytes IV
    const cipher = crypto.createCipheriv(algorithm, this.secretKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', encoding);
    encrypted += cipher.final(encoding);
    return encrypted;
  }

  /**
   * Decrypt ciphertext (Base64 or Hex) back to plaintext JSON
   */
  public decrypt(cipherText: string): string {
    const algorithm = this.secretKey.length === 32 ? 'aes-256-cbc' : 'aes-128-cbc';
    const iv = Buffer.alloc(16, 0);
    const encoding = /^[0-9a-fA-F]+$/.test(cipherText) && cipherText.length % 2 === 0 ? 'hex' : 'base64';
    const decipher = crypto.createDecipheriv(algorithm, this.secretKey, iv);
    let decrypted = decipher.update(cipherText, encoding, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
}
