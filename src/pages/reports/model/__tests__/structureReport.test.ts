import { structureReport } from '../structureReport';

import { plannedWallet } from './plannedWallet';

describe('structureReport', () => {
  it('counts the planned money only when planned purchases are let in', () => {
    expect(structureReport(plannedWallet, 'all').currencies[0]).toMatchObject({
      total: 4950,
      planned: 2950,
    });
    expect(structureReport(plannedWallet, 'made').currencies[0]).toMatchObject({
      total: 2000,
      planned: 0,
    });
  });
});
