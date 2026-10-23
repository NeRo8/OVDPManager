import QuickCrypto, {
  argon2,
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'react-native-quick-crypto';

const { Buffer } = QuickCrypto;

/**
 * Argon2id at the OWASP baseline (19 MiB, 2 passes, 1 lane). The parameters travel in the file,
 * so later copies can raise them and older ones still open.
 */
const KDF = { memory: 19 * 1024, passes: 2, parallelism: 1 } as const;
const KEY_BYTES = 32;
const SALT_BYTES = 16;
/** The GCM standard nonce length. */
const IV_BYTES = 12;

/** How a backup was encrypted; everything but the key is stored next to the data. */
export type BackupEncryption = {
  kdf: 'argon2id';
  /** KiB */
  memory: number;
  passes: number;
  parallelism: number;
  /** base64 */
  salt: string;
  cipher: 'aes-256-gcm';
  /** base64 */
  iv: string;
  /** base64 */
  tag: string;
};

/** The key does not open the backup, or the file was changed after it was made. */
export class WrongBackupKeyError extends Error {
  constructor() {
    super('Ключ не підходить до цієї копії, або файл пошкоджено');
    this.name = 'WrongBackupKeyError';
  }
}

function deriveKey(
  key: string,
  salt: Uint8Array,
  { memory, passes, parallelism }: Pick<BackupEncryption, 'memory' | 'passes' | 'parallelism'>,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    argon2(
      'argon2id',
      { message: key, nonce: salt, memory, passes, parallelism, tagLength: KEY_BYTES },
      (error, derived) => (error ? reject(error) : resolve(derived)),
    );
  });
}

/**
 * Encrypts the backup contents with the user's key. `context` is authenticated but not secret:
 * the file's format and version, so they cannot be swapped without the key noticing.
 */
export async function encryptBackup(
  plaintext: string,
  key: string,
  context: string,
): Promise<{ encryption: BackupEncryption; data: string }> {
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const derived = await deriveKey(key, salt, KDF);
  const cipher = createCipheriv('aes-256-gcm', derived, iv);
  cipher.setAAD(Buffer.from(context, 'utf8'));
  const data = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    encryption: {
      kdf: 'argon2id',
      ...KDF,
      salt: salt.toString('base64'),
      cipher: 'aes-256-gcm',
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    },
    data: data.toString('base64'),
  };
}

/** Decrypts what encryptBackup made. Throws WrongBackupKeyError when the key does not fit. */
export async function decryptBackup(
  { encryption, data }: { encryption: BackupEncryption; data: string },
  key: string,
  context: string,
): Promise<string> {
  const derived = await deriveKey(key, Buffer.from(encryption.salt, 'base64'), encryption);
  const decipher = createDecipheriv('aes-256-gcm', derived, Buffer.from(encryption.iv, 'base64'));
  decipher.setAAD(Buffer.from(context, 'utf8'));
  decipher.setAuthTag(Buffer.from(encryption.tag, 'base64'));
  try {
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString(
      'utf8',
    );
  } catch {
    // GCM refuses the data as a whole: a wrong key and a changed file look the same.
    throw new WrongBackupKeyError();
  }
}
