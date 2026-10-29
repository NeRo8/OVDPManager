import { BackupExportScreen } from '@/pages/backup';

import { DeferredScreen } from '@/shared/ui';

export default function BackupExportRoute() {
  return (
    <DeferredScreen skeleton="form">
      <BackupExportScreen />
    </DeferredScreen>
  );
}
