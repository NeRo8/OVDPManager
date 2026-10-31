import { redemptionsReport } from '../redemptionsReport';

import { plannedWallet } from './plannedWallet';

describe('redemptionsReport', () => {
  it('tells what of the redemptions ahead repays planned purchases', () => {
    const [report] = redemptionsReport(plannedWallet, 'upcoming');
    expect(report).toMatchObject({ total: 5000, expected: 5000, planned: 3000 });
  });
});
