# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

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

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Code quality

Run the checks locally:

```bash
yarn format:check
yarn lint
yarn typecheck
```

Run `yarn format` to format project files, or `yarn validate` to run all checks together. Husky runs `yarn validate` before each commit.

### Other setup steps

- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
