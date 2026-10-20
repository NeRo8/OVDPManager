# OVDP Manager

Mobile Expo app for tracking Ukrainian government bonds, future payments, and local backups.

## Get started

This project pins its toolchain:

| Tool      | Version   | Source                                            |
| --------- | --------- | ------------------------------------------------- |
| Node.js   | `22.19.0` | `.node-version`, `engines.node` in `package.json` |
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

## Project structure

| Path                                          | Responsibility                                                          |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `src/app/`                                    | Thin routes; `_layout.tsx` files define the root stack and bottom tabs. |
| `src/pages/`                                  | Screen UI and page-specific model hooks.                                |
| `src/features/`                               | User actions: adding a bond and managing backups.                       |
| `src/entities/portfolio/`                     | Bond and holding models, local holdings, NBU bond data, and payment UI. |
| `src/shared/api/`                             | Shared Axios client for the NBU API.                                    |
| `src/shared/ui/`, `lib/`, `theme/`, `config/` | Reusable components, utilities, Unistyles theme, and app assets.        |

Each page, feature, and entity has an `index.ts` public API. Imports point down the stack: pages can use features, entities, and shared code; features can use entities and shared code; entities can use shared code. Imports inside a slice use relative paths. See [CODEBASE.md](CODEBASE.md) for entry points and data flow.

The app targets iOS and Android. Its four bottom tabs show upcoming payments, the monthly payment schedule, holdings, and backup actions. Bond details, adding a purchase, and backup screens are stack routes.

## Code quality

Run the checks locally:

```bash
yarn format:check
yarn lint
yarn lint:fsd
yarn typecheck
```

Run `yarn format` to format project files, or `yarn validate` to run all checks together. Husky runs `yarn validate` before each commit.
