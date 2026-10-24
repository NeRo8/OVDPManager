import { z } from 'zod';

/** The key a user gives a backup: long enough that guessing it is not a matter of minutes. */
export const BackupKeySchema = z
  .string()
  .min(8, { error: 'Ключ — щонайменше 8 символів' })
  .max(256, { error: 'Ключ — до 256 символів' });
