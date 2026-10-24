# ОВДП Портфель

Mobile Expo app for tracking Ukrainian government bonds, their future payments, investment plans, and encrypted backups (to a file or to the cloud).

## Get started

This project pins its toolchain:

| Tool      | Version   | Source                                            |
| --------- | --------- | ------------------------------------------------- |
| Node.js   | `24.22.1` | `.node-version`, `engines.node` in `package.json` |
| Yarn      | `1.22.22` | `packageManager` in `package.json`                |
| Ruby      | `3.4.11`  | `.ruby-version`, `ruby` in `Gemfile`              |
| CocoaPods | `1.16.2`  | `Gemfile` / `Gemfile.lock`                        |

Any version manager that reads `.node-version` / `.ruby-version` picks these up automatically (fnm with `--use-on-cd`, mise, asdf, rbenv, chruby). `yarn install` fails on a different Node version, and Bundler refuses to run on a different Ruby version. When you bump a version, update both places listed in the table.

1. Install the toolchain and dependencies

   ```bash
   fnm install            # or: mise install
   corepack enable
   yarn install           # JS dependencies
   bundle install         # Ruby gems (CocoaPods) for iOS builds
   ```

2. Start the app

   ```bash
   yarn start             # dev server
   yarn expo run:ios      # native iOS build; Expo runs `bundle exec pod install`
   yarn expo run:android  # native Android build
   ```

This app uses Unistyles and other native modules. Run it in a [development build](https://docs.expo.dev/develop/development-builds/introduction/) on an Android emulator, iOS simulator, or device. Expo Go cannot load these modules.

## Builds (EAS)

iOS builds go through [EAS Build](https://docs.expo.dev/build/introduction/); Android is not shipped yet. The Expo project belongs to a personal account (`owner` in `app.json`), so sign in with `npx eas-cli login`. The scripts run EAS CLI through `npx eas-cli` (`24.8.0` or newer, `cli.version` in `eas.json`), so no global install is needed.

| Profile       | Distribution                 | EAS environment | Use                                    |
| ------------- | ---------------------------- | --------------- | -------------------------------------- |
| `development` | Internal, development client | `development`   | Dev builds for registered iPhones.     |
| `production`  | App Store                    | `production`    | TestFlight internal testing and later. |

Both profiles extend `base`, which pins Node 24.22.1, Yarn 1.22.22 and CocoaPods 1.16.2: EAS calls a bare `pod` and never reads the `Gemfile`, so change a version in every place that names it. Build numbers live on EAS (`appVersionSource: remote`) and the production profile raises them on its own; the user-facing version is `version` in `app.json`. Signing credentials are managed by EAS.

| Script                  | What it does                                                |
| ----------------------- | ----------------------------------------------------------- |
| `yarn build:dev:ios`    | Development build in the cloud.                             |
| `yarn build:ios`        | Production build only.                                      |
| `yarn build:ios:submit` | Production build, then upload to TestFlight (doesn't wait). |
| `yarn build:local:ios`  | Production build on this Mac (`--local`, needs fastlane).   |

Register an iPhone for development builds with `npx eas-cli device:create`. The first build of each profile asks for the Apple Developer login and lets EAS create the certificate and provisioning profile. Submissions go to App Store Connect app `6826422237`, team `W25YBRT2T2` (`ascAppId` and `appleTeamId` in `submit.production.ios` in `eas.json`). Internal testers get a build once Apple has processed it.

Backups are encrypted with standard algorithms (Argon2id, AES-256-GCM) from `react-native-quick-crypto`, not Apple's OS, so `app.json` declares `ios.config.usesNonExemptEncryption: true`. App Store Connect then asks about each build before testers get it: answer that the app uses standard encryption algorithms instead of, or in addition to, Apple's OS, and whether it is available in France. Only distribution in France needs a document (the French encryption declaration).

## Project structure

| Path                                          | Responsibility                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `src/app/`                                    | Thin routes; `_layout.tsx` files define the root stack and bottom tabs. |
| `src/pages/`                                  | Screen UI and page-specific model hooks.                                |
| `src/features/`                               | User actions: adding a bond, managing backups, filtering payments.      |
| `src/entities/portfolio/`                     | Bond and holding models, the wallet hook, NBU data, and shared blocks.  |
| `src/shared/api/`                             | Shared Axios client for the NBU API.                                    |
| `src/shared/ui/`, `lib/`, `theme/`, `config/` | Reusable components, utilities, Unistyles theme, and app assets.        |

Each page, feature, and entity has an `index.ts` public API. Imports point down the stack: pages can use features, entities, and shared code; features can use entities and shared code; entities can use shared code. Imports inside a slice use relative paths. See [CLAUDE.md](CLAUDE.md) for entry points and data flow.

The app targets iOS and Android. Its four bottom tabs show payments (upcoming, or a year with its chart, as swipeable top tabs; both filterable), the wallet, the active investment plan, and settings (backups, the cloud account, and the app theme). Bond details are one scrolling screen with the bond's parameters, totals, purchases, and payments. Bond details, the bond picker and its filters, adding a purchase, payment filters, the plan list, and restoring a backup are stack routes.

## Code quality

Run the checks locally:

```bash
yarn format:check
yarn lint
yarn lint:fsd
yarn typecheck
```

Run `yarn format` to format project files, or `yarn validate` to run all checks together. Husky runs `yarn validate` before each commit.
