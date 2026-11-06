import { periodColumn } from './periodLabel';

it('uses month names for ISO months and leaves year labels unchanged', () => {
  expect(periodColumn('2026-01')).toEqual({ label: 'січ', name: 'Січень 2026' });
  expect(periodColumn('2026-12')).toEqual({ label: 'гру', name: 'Грудень 2026' });
  expect(periodColumn('2026')).toEqual({ label: '2026', name: '2026' });
});
