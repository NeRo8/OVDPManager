import { compareOperations, purchaseLots } from '@/lib/portfolio/operations';
import {
  bondKindLabel,
  groupPositions,
  type Currency,
  type Operation,
} from '@/lib/portfolio/portfolio';
import { walletPosition, type WalletPosition } from '@/lib/portfolio/position';
import type { ReportSection } from '@/screens/reports/shared/reportSection';
import { addDaysISO, addMonthsISO, daysBetween, formatDate } from '@/utils/date';
import { formatMoney, formatPercent } from '@/utils/format';
import { round2 } from '@/utils/number';

const BUCKETS = [
  { label: 'До 6 місяців', months: 6 },
  { label: '6–12 місяців', months: 12 },
  { label: '1–2 роки', months: 24 },
  { label: '2–3 роки', months: 36 },
  { label: 'Понад 3 роки', months: Infinity },
];

function validHistory(operations: Operation[]): boolean {
  let quantity = 0;
  for (const operation of [...operations].sort(compareOperations)) {
    quantity += operation.type === 'purchase' ? operation.quantity : -operation.quantity;
    if (quantity < 0) return false;
  }
  return true;
}

/** Cost of the remaining lots after sales and partial redemptions, for the selected scenario. */
export function structureReportSections(
  currency: Currency,
  positions: WalletPosition[],
  today: string,
  purchases: 'all' | 'made',
): ReportSection[] {
  const money = (amount: number) => formatMoney(amount, currency);
  const values: {
    item: WalletPosition;
    quantity: number;
    cost: number;
    annualYield: number | null;
  }[] = [];
  const unavailable: { item: WalletPosition; quantity: number | null; reason: string }[] = [];
  for (const item of positions) {
    const operations = item.position.operations.filter(
      (operation) => purchases === 'all' || !operation.planned,
    );
    if (!operations.length) continue;
    if (!validHistory(operations)) {
      unavailable.push({
        item,
        quantity: null,
        reason: 'Продаж залежить від непідтвердженої купівлі.',
      });
      continue;
    }
    const lots = purchaseLots(operations);
    const quantity = lots.reduce((sum, lot) => sum + lot.remaining, 0);
    if (!quantity) continue;
    const bond = item.bond;
    if (!bond) {
      unavailable.push({ item, quantity, reason: 'Немає даних облігації для розрахунку залишку.' });
      continue;
    }
    if (bond.maturityDate < today) continue;
    const nominalOn = (date: string, receivedOnly = false) =>
      bond.nominal -
      bond.payments
        .filter(
          (payment) =>
            payment.type === 'redemption' &&
            payment.date <= date &&
            (!receivedOnly || payment.date < today),
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
    if (lots.some((lot) => lot.remaining > 0 && nominalOn(lot.purchase.date) <= 0)) {
      unavailable.push({ item, quantity, reason: 'Неможливо визначити номінал на дату купівлі.' });
      continue;
    }
    const cost = round2(
      lots.reduce((sum, lot) => {
        const original = nominalOn(lot.purchase.date);
        const remaining = Math.min(original, Math.max(0, nominalOn(today, purchases === 'made')));
        return (
          sum +
          (original > 0
            ? (lot.purchase.amount * lot.remaining * remaining) / (lot.purchase.quantity * original)
            : 0)
        );
      }, 0),
    );
    if (cost > 0) {
      const annualYield =
        purchases === 'all'
          ? item.annualYield
          : walletPosition(groupPositions(operations)[0], bond, today).annualYield;
      values.push({ item, quantity, cost, annualYield });
    }
  }
  if (!values.length && !unavailable.length) return [];
  values.sort(
    (a, b) => b.cost - a.cost || a.item.position.isin.localeCompare(b.item.position.isin),
  );
  const total = round2(values.reduce((sum, entry) => sum + entry.cost, 0));
  const share = (amount: number) => formatPercent(round2((amount / total) * 100));
  const averageRate = total
    ? round2(values.reduce((sum, { item, cost }) => sum + item.bond!.rate * cost, 0) / total)
    : null;
  const averageDays = total
    ? Math.round(
        values.reduce(
          (sum, { item, cost }) => sum + daysBetween(today, item.bond!.maturityDate) * cost,
          0,
        ) / total,
      )
    : null;
  const summary: ReportSection = {
    title: `Підсумок · ${currency}`,
    rows: [
      { label: 'Собівартість залишку', value: total ? money(total) : '—' },
      { label: 'Випусків у розрахунку', value: String(values.length) },
      {
        label: 'Кількість облігацій',
        value: String(values.reduce((sum, item) => sum + item.quantity, 0)),
      },
      {
        label: 'Середня ставка купону',
        value: averageRate === null ? '—' : formatPercent(averageRate),
      },
      {
        label: 'Середня дата погашення',
        value: averageDays === null ? '—' : formatDate(addDaysISO(today, averageDays)),
      },
      ...(unavailable.length
        ? [{ label: 'Випусків без розрахунку', value: String(unavailable.length) }]
        : []),
    ],
    footer: `Собівартість залишку враховує продажі й часткові погашення, а не ринкову ціну. Середні показники зважені за собівартістю. ${purchases === 'all' ? 'Включено заплановані купівлі й продажі, зокрема майбутні.' : 'Лише підтверджені операції.'}${unavailable.length ? ' Позиції без розрахунку не входять до сум і часток.' : ''}`,
  };
  const charts: ReportSection[] = [];
  if (total) {
    const leading = values.length <= 5 ? values : values.slice(0, 4);
    const slices = leading.map(({ item, cost }) => ({ label: item.position.isin, value: cost }));
    if (values.length > 5)
      slices.push({
        label: 'Інші',
        value: round2(values.slice(4).reduce((sum, item) => sum + item.cost, 0)),
      });
    const buckets = BUCKETS.map((bucket, index) => {
      const previous = index > 0 ? BUCKETS[index - 1].months : 0;
      const amount = round2(
        values
          .filter(({ item }) => {
            const maturity = item.bond!.maturityDate;
            return (
              (index === 0 || maturity > addMonthsISO(today, previous)) &&
              (bucket.months === Infinity || maturity <= addMonthsISO(today, bucket.months))
            );
          })
          .reduce((sum, item) => sum + item.cost, 0),
      );
      return { label: bucket.label, value: amount };
    });
    charts.push(
      {
        title: `Розподіл за облігаціями · ${currency}`,
        rows: [],
        allocationChart: { currency, slices },
        footer: `${values.length > 5 ? '«Інші» об’єднує решту облігацій; кожну наведено нижче. ' : ''}Через округлення сума часток може відрізнятися від 100%.`,
      },
      {
        title: `За строками погашення · ${currency}`,
        chart: { currency, bars: buckets },
        rows: buckets.flatMap(({ label, value }) => [
          { label, value: money(value) },
          { label: `Частка · ${label}`, value: share(value) },
        ]),
      },
    );
  }
  return [
    summary,
    ...charts,
    ...values.map(({ item, quantity, cost, annualYield }): ReportSection => ({
      title: `${item.position.isin} · ${currency}`,
      rows: [
        { label: 'Кількість', value: String(quantity) },
        { label: 'Вид', value: bondKindLabel(item.bond!.kind) },
        { label: 'Собівартість залишку', value: money(cost) },
        { label: 'Частка у валюті', value: share(cost) },
        { label: 'Ставка купону', value: formatPercent(item.bond!.rate) },
        {
          label: 'Річна дохідність',
          value: annualYield === null ? '—' : formatPercent(annualYield),
        },
        { label: 'Дата погашення', value: formatDate(item.bond!.maturityDate) },
      ],
    })),
    ...unavailable.map(({ item, quantity, reason }): ReportSection => ({
      title: `${item.position.isin} · ${currency}`,
      rows: [
        { label: 'Кількість', value: quantity === null ? '—' : String(quantity) },
        { label: 'Собівартість залишку', value: '—' },
        { label: 'Ставка купону', value: item.bond ? formatPercent(item.bond.rate) : '—' },
        { label: 'Дата погашення', value: item.bond ? formatDate(item.bond.maturityDate) : '—' },
      ],
      footer: reason,
    })),
  ];
}
