import { Button } from '@/components/button/Button';
import { ColumnChart } from '@/components/chart/ColumnChart';
import { Card } from '@/components/layout/Card';
import { EmptyState } from '@/components/layout/EmptyState';
import { InfoRow } from '@/components/layout/InfoRow';
import { Section } from '@/components/layout/Section';
import { goalYearMonths, type CouponGoalPlan } from '@/lib/coupon-goal/couponGoal';
import type { CouponGoal } from '@/lib/portfolio/plan';
import { bondKindLabel } from '@/lib/portfolio/portfolio';
import { formatDate } from '@/utils/date';
import { formatMoney, MONTHS, MONTHS_SHORT } from '@/utils/format';

const columns = MONTHS.map((name, index) => ({ name, label: MONTHS_SHORT[index] }));
type Props = {
  goal: CouponGoal | null;
  preview: CouponGoalPlan | null;
  missingData: boolean;
  onCreate: () => void;
};
export function CouponGoalPreview({ goal, preview, missingData, onCreate }: Props) {
  return (
    <>
      {!goal || !preview ? (
        <EmptyState
          layout="inline"
          title="Вкажіть ціль"
          message="Введіть бажану суму купонів на місяць."
        />
      ) : (
        <>
          {Array.from({ length: goal.incomeYears }, (_, index) => goal.year + index).map(
            (cardYear) => {
              const months = goalYearMonths(preview.months, goal, cardYear);
              return (
                <Card
                  key={cardYear}
                  title={`Купони ${cardYear}`}
                  footer={`Ціль — ${formatMoney(goal.monthly, goal.currency)} щомісяця.`}
                >
                  <ColumnChart
                    columns={columns}
                    currency={goal.currency}
                    series={[
                      {
                        label: 'купони',
                        color: 'coupon',
                        values: months.map((month) => month.plan + month.added),
                      },
                    ]}
                  />
                </Card>
              );
            },
          )}
          {missingData && (
            <EmptyState
              layout="inline"
              title="Неповні дані плану"
              message="Для розрахунку потрібні збережені умови та повний графік виплат облігацій цієї валюти."
            />
          )}
          {preview.shortMonths.length > 0 && (
            <EmptyState
              layout="inline"
              title="Не всі місяці покрито"
              message="У деякі місяці немає доступних у каталозі кандидатів для цілі."
            />
          )}
          {!preview.bonds.length && !preview.shortMonths.length && (
            <EmptyState
              layout="inline"
              title="Ціль уже досягнута"
              message="Купони плану вже покривають ціль у кожному місяці."
            />
          )}
          {preview.bonds.length > 0 && (
            <>
              <Section
                title="Що купити"
                footer="Вибір і ціни орієнтовні. Наявність та ціни у банків і брокерів можуть відрізнятися; вибір не гарантує найнижчих витрат."
              >
                {preview.bonds.map(({ bond, quantity, amount }) => (
                  <InfoRow
                    key={bond.isin}
                    label={bond.isin}
                    hint={`${bondKindLabel(bond.kind)} · ${bond.currency} · погашення ${formatDate(bond.maturityDate)}`}
                    value={`${quantity} шт · ${formatMoney(amount, goal.currency)}`}
                  />
                ))}
              </Section>
              <Section
                title="Гроші"
                footer="Майбутні виплати, ціни та доступність можуть змінитися. Комісії не враховано."
              >
                <InfoRow
                  label="Купівлі під ціль"
                  value={formatMoney(preview.cost, goal.currency)}
                />
                <InfoRow
                  label="Уже заплановані купівлі"
                  value={formatMoney(preview.plannedCost, goal.currency)}
                />
                <InfoRow
                  label="Виплати й продажі плану"
                  hint={
                    goal.reinvest
                      ? 'Спрямовуються на заплановані купівлі'
                      : 'Не використовуються на заплановані купівлі'
                  }
                  value={formatMoney(preview.planMoney, goal.currency)}
                />
                <InfoRow
                  label="Власні кошти на місяць"
                  value={formatMoney(preview.monthlyTopUp, goal.currency)}
                />
              </Section>
              <Section
                title="Купівлі за датами"
                footer="Буде створено копію плану з новими запланованими купівлями. Вихідний план не зміниться."
              >
                {preview.purchases.map((purchase, index) => (
                  <InfoRow
                    key={`${purchase.isin}-${purchase.date}-${index}`}
                    label={`${formatDate(purchase.date)} · ${purchase.isin}`}
                    value={`${purchase.quantity} шт · ${formatMoney(purchase.amount, goal.currency)}`}
                  />
                ))}
              </Section>
              {!preview.complete && (
                <EmptyState
                  layout="inline"
                  title="Не вдалося розрахувати фінансування"
                  message="Змініть ціль або період купівель."
                />
              )}
              <Button
                title="Створити план з ціллю"
                disabled={!preview.complete || !!missingData || preview.purchases.length === 0}
                onPress={onCreate}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
