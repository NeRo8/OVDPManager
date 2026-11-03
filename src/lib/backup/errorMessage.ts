/** The message to show for a failure: an Error's own, or the value as text. */
export function errorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (code === 'auth/user-mismatch')
    return 'Оберіть той самий Google-акаунт, який підключено до застосунку.';
  if (code === 'auth/network-request-failed' || code === 'firestore/unavailable')
    return 'Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз.';
  if (code.startsWith('auth/') || code.startsWith('firestore/'))
    return 'Не вдалося виконати дію з акаунтом або хмарною копією. Спробуйте ще раз.';
  return error instanceof Error ? error.message : String(error);
}
