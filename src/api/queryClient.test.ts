import type { Query } from '@tanstack/react-query';

import { showToast } from '@/stores/toast';

import { queryClient } from './queryClient';

// The toast is a screen's: what it is asked to show is what matters here.
jest.mock('@/stores/toast', () => ({
  ...jest.requireActual('@/stores/toast'),
  showToast: jest.fn(),
}));

const MINUTE = 60 * 1000;
const NOW = 100 * MINUTE;

/** The query as the client's options and cache callbacks see it. */
type AnyQuery = Query<unknown, unknown, unknown>;

const queryOf = (fields: { errorUpdatedAt?: number; data?: unknown; errorTitle?: string }) =>
  ({
    queryKey: ['nbu', 'bonds'],
    meta: fields.errorTitle ? { errorTitle: fields.errorTitle } : undefined,
    state: { errorUpdatedAt: fields.errorUpdatedAt ?? 0, data: fields.data },
  }) as unknown as AnyQuery;

beforeEach(() => {
  jest.mocked(showToast).mockClear();
  jest.spyOn(Date, 'now').mockReturnValue(NOW);
});

afterEach(() => jest.restoreAllMocks());

describe('queryClient', () => {
  it('waits five minutes after a failure before refetching on its own', () => {
    const { refetchOnMount, refetchOnWindowFocus, refetchOnReconnect, retryOnMount } =
      queryClient.getDefaultOptions().queries ?? {};
    const refetches = [refetchOnMount, refetchOnWindowFocus, refetchOnReconnect, retryOnMount];
    const allow = (query: AnyQuery) =>
      refetches.map((option) => (option as (query: AnyQuery) => boolean)(query));

    expect(allow(queryOf({ errorUpdatedAt: NOW - 4 * MINUTE }))).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect(allow(queryOf({ errorUpdatedAt: NOW - 6 * MINUTE }))).toEqual([true, true, true, true]);
    expect(allow(queryOf({}))).toEqual([true, true, true, true]);
  });

  it('tells about a failed refetch over data already shown, with a retry', () => {
    const refetch = jest.spyOn(queryClient, 'refetchQueries').mockResolvedValue();
    const onError = queryClient.getQueryCache().config.onError;
    onError?.(
      new Error('НБУ відповів з помилкою 503'),
      queryOf({ data: [], errorTitle: 'Не вдалося оновити дані НБУ' }),
    );

    expect(showToast).toHaveBeenCalledWith({
      tone: 'error',
      title: 'Не вдалося оновити дані НБУ',
      message: 'НБУ відповів з помилкою 503. Показано збережені дані.',
      action: { label: 'Повторити', onPress: expect.any(Function) },
    });
    jest.mocked(showToast).mock.calls[0][0].action?.onPress();
    expect(refetch).toHaveBeenCalledWith({ queryKey: ['nbu', 'bonds'] });
  });

  it('stays silent without data on screen, where the screen shows the error, or without a title', () => {
    const onError = queryClient.getQueryCache().config.onError;
    onError?.(new Error('x'), queryOf({ errorTitle: 'Не вдалося оновити дані НБУ' }));
    onError?.(new Error('x'), queryOf({ data: [] }));
    expect(showToast).not.toHaveBeenCalled();
  });
});
