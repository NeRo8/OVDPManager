import { DeferredScreen } from '@/components/navigation/DeferredScreen';
import BackupImportScreen from '@/screens/backup/BackupImportScreen';

export default function BackupImportRoute() {
  return (
    <DeferredScreen skeleton="form">
      <BackupImportScreen />
    </DeferredScreen>
  );
}
