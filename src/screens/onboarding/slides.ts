import type { IconName } from '@/components/icon/ThemedIcon';

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
    text: 'Додавайте купівлі ОВДП з каталогу НБУ. Купони й дати погашення застосунок знає сам.',
  },
  {
    icon: 'calendar-outline',
    title: 'Виплати',
    text: 'Скільки купонів і погашень надійде цього місяця, цього року й надалі — на одному графіку.',
  },
  {
    icon: 'bar-chart-outline',
    title: 'Плани',
    text: 'Плануйте майбутні купівлі та переглядайте очікувані виплати для кожного плану.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Дані лише у вас',
    text: 'Портфель зберігається на телефоні без додаткового шифрування застосунком. Резервна копія у файлі чи в хмарі захищена вашим ключем.',
  },
];
