import { BackupImportScreen } from '@/pages/backup';

import { DeferredScreen } from '@/shared/ui';

export default function BackupImportRoute() {
  return (
    <DeferredScreen skeleton="form">
      <BackupImportScreen />
    </DeferredScreen>
  );
}
