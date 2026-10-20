# Кодова база OVDP Manager

Це карта коду для мобільного застосунку Expo SDK 58 на iOS та Android. Маршрути працюють через Expo Router, тема — через Unistyles 3, HTTP-запити до НБУ — через Axios, а локальний стан — через Zustand з `persist`. Веб-платформу не налаштовано.

## Шари

| Шлях                                          | Призначення                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `index.ts`                                    | Спершу реєструє тему Unistyles, потім запускає Expo Router.                                               |
| `src/app/`                                    | Тонкі входи маршрутів. Кожен екран рендерить компонент із `pages`; `_layout.tsx` визначають Stack і Tabs. |
| `src/pages/payments/`                         | Майбутні виплати та помісячний графік.                                                                    |
| `src/pages/holdings/`                         | Список ОВДП, додавання та деталі позиції.                                                                 |
| `src/pages/forecast/`                         | Прогноз доходу та екран налаштувань плану.                                                                |
| `src/pages/backup/`                           | Екрани копії, експорту, імпорту й мока для розробки.                                                      |
| `src/features/`                               | Сценарії додавання ОВДП, розрахунку плану та роботи з копіями; UI цих сценаріїв належить сторінкам.       |
| `src/entities/portfolio/`                     | Типи й обчислення ОВДП, сховище покупок, каталог НБУ та рядок виплати.                                    |
| `src/shared/api/`                             | Axios-клієнт НБУ і кеш курсу долара.                                                                      |
| `src/shared/ui/`, `lib/`, `theme/`, `config/` | Базові компоненти, утиліти, тема Unistyles і ресурси застосунку.                                          |

Зовнішні імпорти проходять через `index.ts` зрізу. Усередині зрізу використовуються відносні імпорти. Шари залежать лише від нижчих: `app` → `pages` → `features` → `entities` → `shared`. Steiger перевіряє ці межі через `yarn lint:fsd`. Евристика `insignificant-slice` вимкнена для `features`: у цьому невеликому застосунку кожен сценарій має один екран входу.

## Дані та зберігання

- Zustand `persist` використовує синхронний адаптер `expo-sqlite/kv-store` із `src/shared/lib/storage.ts`. `src/shared/lib/persistedStorage.ts` читає старий JSON і новий формат Zustand; ключі не змінені.
- `src/entities/portfolio/model/holdings.store.ts` зберігає покупки під `holdings-v1`.
- `src/entities/portfolio/api/` завантажує каталог облігацій і графіки виплат НБУ через спільний Axios-клієнт; локальний кеш зберігається під `nbu-bonds-v1`.
- `src/shared/api/nbu/useUsdRate.hook.ts` кешує курс USD під `nbu-usd-rate-v1`.
- `src/features/forecast/model/forecastPlan.store.ts` зберігає план під `forecast-plan-v1`; чисті розрахунки — у `forecast.ts`.
- `src/features/backup/model/backup.ts` перевіряє та створює JSON-копії; файлові дії — у `api/backupFile.ts`. Особиста копія `src/ovdp-backup-*.json` ігнорується Git та не є частиною коду.

Ресурси іконок лежать у `src/shared/config/app-icon/`; посилання на них визначено в `app.json`. Нативні каталоги `ios/` і `android/` генерує Expo, їх не слід редагувати вручну.

## Перевірка

`yarn validate` запускає Prettier, ESLint, Steiger, TypeScript і `yarn test:persistence`. Остання команда перевіряє читання старого формату та повторне збереження через Zustand. `npx expo export --platform ios` та `--platform android` перевіряють складання JS-бандлів; вони не замінюють запуск на пристрої.
