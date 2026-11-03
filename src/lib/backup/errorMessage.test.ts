import { errorMessage } from './errorMessage';

const firebaseError = (code: string) => Object.assign(new Error(`[${code}] raw`), { code });

describe('errorMessage', () => {
  it('explains the Firebase failures a user can act on', () => {
    expect(errorMessage(firebaseError('auth/user-mismatch'))).toBe(
      'Оберіть той самий Google-акаунт, який підключено до застосунку.',
    );
    for (const code of ['auth/network-request-failed', 'firestore/unavailable']) {
      expect(errorMessage(firebaseError(code))).toBe(
        'Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз.',
      );
    }
  });

  it('hides the raw text of any other Firebase failure', () => {
    expect(errorMessage(firebaseError('firestore/permission-denied'))).toBe(
      'Не вдалося виконати дію з акаунтом або хмарною копією. Спробуйте ще раз.',
    );
  });

  it('shows an Error’s own message, and anything else as text', () => {
    expect(errorMessage(new Error('Копія завелика для хмари.'))).toBe('Копія завелика для хмари.');
    expect(errorMessage('щось пішло не так')).toBe('щось пішло не так');
  });
});
