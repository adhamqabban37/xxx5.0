/**
 * Google OAuth Token Encryption Utilities
 *
 * Provides secure encryption/decryption for storing Google OAuth tokens
 * using AES-GCM with a derived key from environment secret.
 */

import { createCipher, createDecipher, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const asyncScrypt = promisify(scrypt);

// Configuration
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT_LENGTH = 32;

/**
 * Derive encryption key from environment secret and salt
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
  const secret =
    process.env.GOOGLE_TOKEN_ENCRYPTION_SECRET || 'default-secret-change-in-production';
  return (await asyncScrypt(secret, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt a token using AES-256-CBC
 */
export async function encryptToken(token: string): Promise<string> {
  try {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = await deriveKey(salt);

    const cipher = createCipher(ALGORITHM, key);
    cipher.setAutoPadding(true);

    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine salt + iv + encrypted data
    const combined = Buffer.concat([salt, iv, Buffer.from(encrypted, 'hex')]);

    return combined.toString('base64');
  } catch (error) {
    console.error('Token encryption failed:', error);
    throw new Error('Failed to encrypt token');
  }
}

/**
 * Decrypt a token using AES-256-CBC
 */
export async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const combined = Buffer.from(encryptedToken, 'base64');

    if (combined.length < SALT_LENGTH + IV_LENGTH) {
      throw new Error('Invalid encrypted token format');
    }

    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(salt);
    const decipher = createDecipher(ALGORITHM, key);

    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error);
    throw new Error('Failed to decrypt token');
  }
}

/**
 * Test encryption/decryption roundtrip
 */
export async function testEncryption(): Promise<boolean> {
  try {
    const testToken = 'test_token_12345';
    const encrypted = await encryptToken(testToken);
    const decrypted = await decryptToken(encrypted);

    return testToken === decrypted;
  } catch (error) {
    console.error('Encryption test failed:', error);
    return false;
  }
}
