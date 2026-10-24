import { create, isAxiosError } from 'axios';

/** A failed NBU request; `message` is ready to show to the user. */
export class NbuError extends Error {
  /** HTTP status when NBU answered, undefined when it could not be reached */
  readonly status?: number;
  readonly cause: unknown;

  constructor(message: string, cause: unknown, status?: number) {
    super(message);
    this.name = 'NbuError';
    this.cause = cause;
    this.status = status;
  }
}

function toNbuError(error: unknown): NbuError {
  if (!isAxiosError(error)) {
    return new NbuError('Не вдалося завантажити дані НБУ', error);
  }
  if (error.response) {
    const { status } = error.response;
    return new NbuError(`НБУ відповів з помилкою ${status}`, error, status);
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new NbuError('Час очікування відповіді НБУ минув', error);
  }
  return new NbuError('Не вдалося з’єднатися з НБУ', error);
}

/** One client for the public NBU endpoints, with a finite wait on poor connections. */
export const nbuClient = create({
  baseURL: 'https://bank.gov.ua',
  timeout: 15000,
});

// Every failed request rejects with an NbuError, so callers show `error.message` as is.
nbuClient.interceptors.response.use(undefined, (error: unknown) =>
  Promise.reject(toNbuError(error)),
);
