import { portfolioReport } from '../portfolioReport';

import { plannedWallet } from './plannedWallet';

describe('portfolioReport', () => {
  it('tells what of the money in a bond is still planned', () => {
    const [report] = portfolioReport(plannedWallet, 'all');
    expect(report.planned).toBe(2950);
    expect(report.bonds[0]).toMatchObject({ invested: 4950, planned: 2950 });
  });
});
