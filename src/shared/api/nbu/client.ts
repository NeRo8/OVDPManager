import { create, isAxiosError } from 'axios';

/** One client for the public NBU endpoints, with a finite wait on poor connections. */
export const nbuClient = create({
  baseURL: 'https://bank.gov.ua',
  timeout: 15000,
});

export function nbuErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response) return `НБУ відповів з помилкою ${error.response.status}`;
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return 'Час очікування відповіді НБУ минув';
    }
    return 'Не вдалося з’єднатися з НБУ';
  }
  return error instanceof Error ? error.message : 'Не вдалося завантажити дані НБУ';
}
