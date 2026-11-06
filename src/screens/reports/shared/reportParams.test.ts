import { parseReportParams, serializeReportParams } from './reportParams';

const today = '2026-11-05';

it('passes the selected period and scope through route parameters', () => {
  const selection = {
    ...parseReportParams({}, today, 'period'),
    currency: 'UAH' as const,
    isins: ['UA1', 'UA2'],
    from: '2025-02-01',
    to: '2025-03-31',
  };
  const params = serializeReportParams(selection, 'period');
  expect(params).toEqual({
    currency: 'UAH',
    isins: 'UA1,UA2',
    from: '2025-02-01',
    to: '2025-03-31',
  });
  expect(parseReportParams(params, today, 'period')).toMatchObject(selection);
});

it('uses defaults for malformed dates, report options and years', () => {
  const parsed = parseReportParams(
    { from: '2025-02-30', to: '2025-01-01', status: 'unknown', year: 'abc' },
    today,
    'year',
  );
  expect(parsed).toMatchObject({ from: '2026-01-01', to: today, year: '2026', status: 'all' });
});

it('only includes the individual bond selection for a bond report', () => {
  const selection = {
    ...parseReportParams({}, today, 'bond'),
    currency: 'UAH' as const,
    isins: ['UA1'],
    isin: 'UA2',
  };
  expect(serializeReportParams(selection, 'bond')).toEqual({ isin: 'UA2' });
});

it('keeps report-specific options in their own route parameters', () => {
  const selection = {
    ...parseReportParams({}, today, 'yield'),
    isins: ['UA1'],
    status: 'redeemed' as const,
    time: 'past' as const,
    purchases: 'made' as const,
    targetCurrency: 'EUR' as const,
    year: '2025',
  };
  expect(serializeReportParams(selection, 'yield')).toEqual({ isins: 'UA1', status: 'redeemed' });
  expect(serializeReportParams(selection, 'redemptions')).toEqual({ isins: 'UA1', time: 'past' });
  expect(serializeReportParams(selection, 'structure')).toEqual({
    isins: 'UA1',
    purchases: 'made',
  });
  expect(serializeReportParams(selection, 'fx')).toEqual({
    isins: 'UA1',
    targetCurrency: 'EUR',
    year: '2025',
  });
});

it('passes the selected year through the report route', () => {
  const selection = { ...parseReportParams({}, today, 'year'), year: '2028' };
  const params = serializeReportParams(selection, 'year');
  expect(params.year).toBe('2028');
  expect(parseReportParams(params, today, 'year').year).toBe('2028');
});
