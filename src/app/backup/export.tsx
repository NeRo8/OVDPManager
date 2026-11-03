import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import BackupExportScreen from '@/screens/backup/BackupExportScreen';

export default function BackupExportRoute() {
  return (
    <DeferredScreen skeleton="form">
      <BackupExportScreen />
    </DeferredScreen>
  );
}
