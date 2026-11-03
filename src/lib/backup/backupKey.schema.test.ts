import { BackupKeySchema } from './backupKey.schema';

const problem = (key: string) => {
  const result = BackupKeySchema.safeParse(key);
  return result.success ? null : result.error.issues[0].message;
};

describe('BackupKeySchema', () => {
  it('takes a key of 8 to 256 characters, spaces and any script included', () => {
    expect(problem('12345678')).toBeNull();
    expect(problem('довгий ключ')).toBeNull();
    expect(problem('я'.repeat(256))).toBeNull();
  });

  it('refuses a key too short to resist guessing, or too long', () => {
    expect(problem('1234567')).toBe('Ключ — щонайменше 8 символів');
    expect(problem('я'.repeat(257))).toBe('Ключ — до 256 символів');
  });
});
