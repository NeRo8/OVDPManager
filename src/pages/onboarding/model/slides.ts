import type { IconName } from '@/shared/ui';

export type OnboardingSlideContent = {
  icon: IconName;
  title: string;
  text: string;
};

/** One slide per part of the app, from adding a bond to keeping the data; icons follow the tabs'. */
export const ONBOARDING_SLIDES: OnboardingSlideContent[] = [
  {
    icon: 'wallet-outline',
    title: 'Гаманець ОВДП',
    text: 'Додавайте купівлі облігацій з каталогу НБУ. Купони й дати погашення застосунок знає сам.',
  },
  {
    icon: 'calendar-outline',
    title: 'Графік виплат',
    text: 'Скільки купонів і погашень надійде цього місяця, цього року й надалі — на одному графіку.',
  },
  {
    icon: 'document-text-outline',
    title: 'Звіти',
    text: 'Підсумки року, дохід і дохідність кожної облігації — усе на одному екрані.',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Інвестиційні плани',
    text: 'Плануйте майбутні купівлі в окремих планах і порівнюйте, скільки кожен принесе.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Дані лише у вас',
    text: 'Портфель зберігається на телефоні. Резервну копію у файлі чи в хмарі шифрує ключ, який знаєте лише ви.',
  },
];
