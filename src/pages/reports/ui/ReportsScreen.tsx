import { router, type Href } from 'expo-router';

import { LinkRow, ScreenScrollView, Section } from '@/shared/ui';

type Report = {
  title: string;
  description: string;
  href: Href;
};

const MONEY_FLOW_REPORTS: Report[] = [
  {
    title: 'Звіт за рік',
    description: 'Купівлі, купони, погашення й чистий дохід за обраний рік.',
    href: '/reports/year',
  },
  {
    title: 'Валютний еквівалент',
    description: 'Гривневі ОВДП за весь час або рік: купівлі, виплати й залишок у валюті.',
    href: '/reports/fx',
  },
  {
    title: 'Звіт за період',
    description: 'Купівлі, купони, погашення й чистий дохід між двома обраними датами.',
    href: '/reports/period',
  },
  {
    title: 'Звіт від року до року',
    description: 'Роки поруч: скільки вкладено, скільки виплат і який чистий дохід у кожному.',
    href: '/reports/year-over-year',
  },
  {
    title: 'Графік погашень',
    description: 'Коли й скільки грошей повернуть погашення — за роками й кварталами.',
    href: '/reports/redemptions',
  },
];

const PORTFOLIO_REPORTS: Report[] = [
  {
    title: 'Звіт по портфелю',
    description: 'Усі ОВДП у гаманці: вкладено, виплати й чистий дохід за кожною та разом.',
    href: '/reports/portfolio',
  },
  {
    title: 'Структура портфеля',
    description: 'Як розподілені гроші в гаманці: за валютами, строками до погашення й випусками.',
    href: '/reports/structure',
  },
  {
    title: 'Річна дохідність',
    description: 'Середньозважена річна дохідність портфеля поруч з обліковою ставкою НБУ.',
    href: '/reports/yield',
  },
  {
    title: 'Звіт по ОВДП',
    description: 'Купівлі, купони, погашення й чистий дохід однієї ОВДП з гаманця.',
    href: '/reports/bond',
  },
];

const SECTIONS = [
  { title: 'Рух грошей', reports: MONEY_FLOW_REPORTS },
  { title: 'Портфель', reports: PORTFOLIO_REPORTS },
];

export default function ReportsScreen() {
  return (
    <ScreenScrollView>
      {SECTIONS.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.reports.map((report) => (
            <LinkRow
              key={report.title}
              title={report.title}
              subtitle={report.description}
              onPress={() => router.push(report.href)}
            />
          ))}
        </Section>
      ))}
    </ScreenScrollView>
  );
}
