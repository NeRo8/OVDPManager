import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Section, screenContent } from '@/components/ui';
import { backupFileName, parseBackup, serializeBackup } from '@/lib/backup';
import { canPickFile, exportBackupFile, pickBackupFile } from '@/lib/backup-file';
import { confirmDestructive } from '@/lib/confirm';
import { plural } from '@/lib/format';
import { replaceHoldings, useHoldings } from '@/lib/holdings';
import type { Holding } from '@/lib/ovdp';
import { useColors } from '@/theme/colors';

type Status = { tone: 'ok' | 'error'; text: string } | null;

function purchases(n: number) {
  return `${n} ${plural(n, 'покупка', 'покупки', 'покупок')}`;
}

export default function BackupScreen() {
  const colors = useColors();
  const holdings = useHoldings();
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState<Status>(null);
  const [isBusy, setBusy] = useState(false);

  async function exportFile() {
    try {
      await exportBackupFile(serializeBackup(holdings), backupFileName());
      setStatus({ tone: 'ok', text: `Копію створено: ${purchases(holdings.length)}.` });
    } catch (error) {
      setStatus({ tone: 'error', text: (error as Error).message });
    }
  }

  function restore(text: string, source: string) {
    let restored: Holding[];
    try {
      restored = parseBackup(text);
    } catch (error) {
      setStatus({ tone: 'error', text: (error as Error).message });
      return;
    }
    const apply = () => {
      replaceHoldings(restored);
      setPasted('');
      setStatus({ tone: 'ok', text: `Відновлено ${purchases(restored.length)} ${source}.` });
    };
    if (holdings.length === 0) {
      apply();
      return;
    }
    confirmDestructive(
      'Замінити дані гаманця?',
      `Зараз у гаманці ${purchases(holdings.length)}. Їх буде замінено на ${purchases(restored.length)} ${source}.`,
      'Замінити',
      apply,
    );
  }

  async function restoreFromFile() {
    const text = await pickBackupFile();
    if (text) restore(text, 'з файлу');
  }

  async function writeMock() {
    setBusy(true);
    try {
      const response = await fetch('/api/mock', {
        method: 'POST',
        body: serializeBackup(holdings),
      });
      const result = (await response.json()) as { file?: string; count?: number; error?: string };
      if (!response.ok) throw new Error(result.error ?? `Помилка ${response.status}`);
      setStatus({
        tone: 'ok',
        text: `Мок збережено в ${result.file}: ${purchases(result.count!)}.`,
      });
    } catch (error) {
      setStatus({ tone: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  // An existing mock may hold the real data, so overwriting it needs a confirmation.
  async function saveMock() {
    let existing: Holding[] | null = null;
    try {
      const response = await fetch('/api/mock');
      if (response.ok) existing = parseBackup(await response.text());
    } catch {
      // No readable mock yet — nothing to protect.
    }
    if (!existing) {
      await writeMock();
      return;
    }
    confirmDestructive(
      'Перезаписати мок?',
      `У проєкті вже є мок: ${purchases(existing.length)}. Його буде замінено поточними даними (${purchases(holdings.length)}).`,
      'Перезаписати',
      () => void writeMock(),
    );
  }

  async function loadMock() {
    setBusy(true);
    try {
      const response = await fetch('/api/mock');
      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          (JSON.parse(text) as { error?: string }).error ?? `Помилка ${response.status}`,
        );
      }
      restore(text, 'з мока');
    } catch (error) {
      setStatus({ tone: 'error', text: (error as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={screenContent}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {status && (
        <Text
          style={[styles.status, { color: status.tone === 'ok' ? colors.positive : colors.danger }]}
        >
          {status.text}
        </Text>
      )}

      <View style={styles.group}>
        <Section
          title="Зберегти копію"
          footer="Дані гаманця зберігаються лише на цьому пристрої (у вебі — у цьому браузері). Файл копії допоможе відновити їх після очищення даних чи на іншому пристрої."
        >
          <Text style={[styles.body, { color: colors.text }]}>
            У гаманці {purchases(holdings.length)}.
          </Text>
        </Section>
        <Button title="Експортувати копію" onPress={exportFile} disabled={holdings.length === 0} />
      </View>

      <View style={styles.group}>
        <Section
          title="Відновити з копії"
          footer="Поточні дані гаманця буде замінено даними з копії."
        >
          <TextInput
            value={pasted}
            onChangeText={setPasted}
            placeholder="Вставте сюди вміст файлу копії"
            placeholderTextColor={colors.secondaryText}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.textArea, { color: colors.text }]}
          />
        </Section>
        <Button
          title="Відновити зі вставленого"
          onPress={() => restore(pasted, 'з копії')}
          disabled={!pasted.trim()}
        />
        {canPickFile && (
          <Button title="Вибрати файл копії…" variant="secondary" onPress={restoreFromFile} />
        )}
      </View>

      {__DEV__ && (
        <View style={styles.group}>
          <Section
            title="Розробка"
            footer="Мок зберігається в проєкті (src/mocks/holdings.json) через dev-сервер. Цих кнопок немає в релізній збірці."
          >
            <Text style={[styles.body, { color: colors.text }]}>
              Зберегти поточні дані як мок, щоб потім завантажити їх знову.
            </Text>
          </Section>
          <Button
            title="Зберегти як мок у проєкт"
            onPress={saveMock}
            disabled={isBusy || holdings.length === 0}
          />
          <Button
            title="Завантажити мок"
            variant="secondary"
            onPress={loadMock}
            disabled={isBusy}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  group: { gap: 12 },
  status: { fontSize: 15, textAlign: 'center' },
  body: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 14 },
  textArea: {
    fontSize: 13,
    fontFamily: 'monospace',
    minHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
});
