import { useState } from 'react';
import { View } from 'react-native';

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Button } from '@/components/button/Button';
import { DateField } from '@/components/form/DateField';
import { FieldRow } from '@/components/form/FieldRow';
import { SegmentedSelect } from '@/components/form/SegmentedSelect';
import { CheckRow } from '@/components/layout/CheckRow';
import { EmptyState } from '@/components/layout/EmptyState';
import { ScreenScrollView } from '@/components/layout/ScreenScrollView';
import { Section } from '@/components/layout/Section';
import { YearNav } from '@/components/YearNav';
import { useWallet } from '@/hooks/useWallet.hook';
import { buildWallet } from '@/lib/portfolio/wallet';
import { PERIOD_OPTIONS, periodDates } from '@/screens/reports/shared/periodDates';
import {
  parseReportParams,
  REPORT_ROUTES,
  REPORT_TITLES,
  serializeReportParams,
  type ReportName,
} from '@/screens/reports/shared/reportParams';
import { fitReportScope, scopedWallet } from '@/screens/reports/shared/reportScope';

import { ReportScopePicker } from './ReportScopePicker';

type Props = { report: ReportName };
const STATUSES = [
  { label: 'Усі', value: 'all' },
  { label: 'В обігу', value: 'inCirculation' },
  { label: 'Погашені', value: 'redeemed' },
] as const;
const TIMES = [
  { label: 'Очікуються', value: 'upcoming' },
  { label: 'Отримані', value: 'past' },
  { label: 'Усі', value: 'all' },
] as const;
const PURCHASES = [
  { label: 'Усі купівлі', value: 'all' },
  { label: 'Зроблені', value: 'made' },
] as const;
const TARGETS = [
  { label: 'USD', value: 'USD' },
  { label: 'EUR', value: 'EUR' },
] as const;
const FX_PERIODS = [
  { label: 'Увесь час', value: 'all' },
  { label: 'Рік', value: 'year' },
] as const;

export default function ReportFiltersScreen({ report }: Props) {
  const wallet = useWallet();
  const params = useLocalSearchParams();
  const [selection, setSelection] = useState(() => {
    const initial = parseReportParams(params, wallet.today, report);
    return { ...initial, isin: initial.isin ?? wallet.positions[0]?.position.isin ?? null };
  });
  const [period, setPeriod] = useState(() => {
    const initial = parseReportParams(params, wallet.today, report);
    const scoped = scopedWallet(wallet, { currency: initial.currency, isins: initial.isins });
    return (
      PERIOD_OPTIONS.filter((option) => option.value !== 'custom').find((option) => {
        const dates = periodDates(option.value, scoped);
        return dates.from === initial.from && dates.to === initial.to;
      })?.value ?? 'custom'
    );
  });
  const availableWallet =
    report === 'fx'
      ? buildWallet(
          wallet.operations.filter((operation) => operation.currency === 'UAH'),
          wallet.byIsin,
          wallet.today,
        )
      : wallet;
  const scope = fitReportScope(availableWallet, {
    currency: selection.currency,
    isins: selection.isins,
  });
  const narrowed = scopedWallet(availableWallet, scope);
  const dates =
    period === 'custom'
      ? { from: selection.from, to: selection.to }
      : periodDates(period, narrowed);
  const selectedBondExists = wallet.positions.some(
    ({ position }) => position.isin === selection.isin,
  );
  const date = `${selection.year ?? wallet.today.slice(0, 4)}-01-01`;
  const selectPeriod = (value: string) => {
    setPeriod(value);
    setSelection((previous) => ({
      ...previous,
      ...(value === 'custom' ? dates : periodDates(value, narrowed)),
    }));
  };
  const show = () => {
    const final = { ...selection, ...scope, ...(report === 'period' ? dates : {}) };
    router.dismissTo({
      pathname: REPORT_ROUTES[report],
      params: serializeReportParams(final, report),
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: `Фільтри · ${REPORT_TITLES[report]}` }} />
      <ScreenScrollView>
        {report === 'year' && (
          <Section title="Рік">
            <View style={styles.picker}>
              <YearNav
                year={Number(selection.year ?? wallet.today.slice(0, 4))}
                min={1}
                max={9999}
                onChange={(value) =>
                  setSelection((previous) => ({
                    ...previous,
                    year: String(value).padStart(4, '0'),
                  }))
                }
              />
            </View>
          </Section>
        )}
        {report === 'period' && (
          <>
            <Section title="Період">
              {PERIOD_OPTIONS.map((option) => (
                <CheckRow
                  key={option.value}
                  title={option.label}
                  checked={period === option.value}
                  onPress={() => selectPeriod(option.value)}
                />
              ))}
            </Section>
            <Section title="Дати">
              <FieldRow label="Від">
                <DateField
                  value={dates.from}
                  maximumDate={dates.to}
                  onChange={(value) => {
                    setPeriod('custom');
                    setSelection((previous) => ({ ...previous, from: value, to: dates.to }));
                  }}
                />
              </FieldRow>
              <FieldRow label="До">
                <DateField
                  value={dates.to}
                  minimumDate={dates.from}
                  onChange={(value) => {
                    setPeriod('custom');
                    setSelection((previous) => ({ ...previous, from: dates.from, to: value }));
                  }}
                />
              </FieldRow>
            </Section>
          </>
        )}
        {report === 'fx' && (
          <>
            <Section title="Валюта порівняння">
              <View style={styles.picker}>
                <SegmentedSelect
                  options={[...TARGETS]}
                  value={selection.targetCurrency}
                  onChange={(value) =>
                    setSelection((previous) => ({ ...previous, targetCurrency: value }))
                  }
                />
              </View>
            </Section>
            <Section title="Період">
              <View style={styles.picker}>
                <SegmentedSelect
                  options={[...FX_PERIODS]}
                  value={selection.year ? 'year' : 'all'}
                  onChange={(value) =>
                    setSelection((previous) => ({
                      ...previous,
                      year: value === 'all' ? null : wallet.today.slice(0, 4),
                    }))
                  }
                />
              </View>
              {selection.year && (
                <FieldRow label="Оберіть дату року">
                  <DateField
                    value={date}
                    maximumDate={wallet.today}
                    onChange={(value) =>
                      setSelection((previous) => ({ ...previous, year: value.slice(0, 4) }))
                    }
                  />
                </FieldRow>
              )}
            </Section>
          </>
        )}
        {(report === 'portfolio' || report === 'yield') && (
          <Section title="Стан">
            <View style={styles.picker}>
              <SegmentedSelect
                options={[...STATUSES]}
                value={selection.status}
                onChange={(value) => setSelection((previous) => ({ ...previous, status: value }))}
              />
            </View>
          </Section>
        )}
        {report === 'redemptions' && (
          <Section title="Час">
            <View style={styles.picker}>
              <SegmentedSelect
                options={[...TIMES]}
                value={selection.time}
                onChange={(value) => setSelection((previous) => ({ ...previous, time: value }))}
              />
            </View>
          </Section>
        )}
        {report === 'structure' && (
          <Section title="Купівлі">
            <View style={styles.picker}>
              <SegmentedSelect
                options={[...PURCHASES]}
                value={selection.purchases}
                onChange={(value) =>
                  setSelection((previous) => ({ ...previous, purchases: value }))
                }
              />
            </View>
          </Section>
        )}
        {report === 'bond' && wallet.positions.length > 0 && (
          <Section title="Оберіть облігацію">
            {wallet.positions.map(({ position }) => (
              <CheckRow
                key={position.isin}
                title={position.isin}
                checked={selection.isin === position.isin}
                onPress={() => setSelection((previous) => ({ ...previous, isin: position.isin }))}
              />
            ))}
          </Section>
        )}
        {report === 'bond' && wallet.positions.length === 0 && (
          <EmptyState
            layout="inline"
            icon="bar-chart-outline"
            title="Облігацій немає"
            message="Додайте облігацію до плану."
          />
        )}
        {report !== 'bond' && (
          <ReportScopePicker
            wallet={availableWallet}
            value={scope}
            onChange={(value) => setSelection((previous) => ({ ...previous, ...value }))}
          />
        )}
        <Button
          title="Застосувати"
          disabled={report === 'bond' && !selectedBondExists}
          onPress={show}
        />
      </ScreenScrollView>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({ picker: { padding: theme.space.md } }));
