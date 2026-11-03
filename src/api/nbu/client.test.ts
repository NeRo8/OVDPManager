import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

import { NbuError, nbuClient } from './client';

/** A request answered by `answer` instead of the network, through the client's own interceptors. */
const request = (answer: (config: InternalAxiosRequestConfig) => Promise<AxiosResponse>) =>
  nbuClient.get('/anything', { adapter: answer });

const respond =
  (status: number) =>
  async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => ({
    data: [],
    status,
    statusText: '',
    headers: {},
    config,
  });

describe('nbuClient', () => {
  it('passes a successful answer through', async () => {
    await expect(request(respond(200))).resolves.toMatchObject({ status: 200, data: [] });
  });

  it('turns an error status into an NbuError that names it', async () => {
    // As axios's own adapters do, a status out of 2xx rejects with the response attached.
    const rejectWith503 = async (config: InternalAxiosRequestConfig) => {
      const response = await respond(503)(config);
      throw new AxiosError('failed', 'ERR_BAD_RESPONSE', config, null, response);
    };
    const error = await request(rejectWith503).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(NbuError);
    expect(error).toMatchObject({ message: 'НБУ відповів з помилкою 503', status: 503 });
  });

  it('tells a timeout from a failed connection', async () => {
    const failWith = (code: string) => () => Promise.reject(new AxiosError('failed', code));
    await expect(request(failWith('ECONNABORTED'))).rejects.toThrow(
      'Час очікування відповіді НБУ минув',
    );
    await expect(request(failWith('ETIMEDOUT'))).rejects.toThrow(
      'Час очікування відповіді НБУ минув',
    );
    await expect(request(failWith('ERR_NETWORK'))).rejects.toThrow('Не вдалося з’єднатися з НБУ');
  });
});
