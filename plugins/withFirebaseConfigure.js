const { withAppDelegate } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const CONFIGURE = 'FirebaseApp.configure()';

/**
 * Starts Firebase on iOS. The `@react-native-firebase/app` plugin puts `FirebaseApp.configure()`
 * above `factory.startReactNative(`, which Expo SDK 58 moved out of AppDelegate into
 * SceneDelegate, so it only warns and skips it; without the call no Firebase app exists and every
 * Firebase call throws. This puts the call in `didFinishLaunchingWithOptions`, before React Native
 * starts. It does nothing once the call is there, so a fixed upstream plugin and this
 * one do not add it twice.
 */
function withFirebaseConfigure(config) {
  return withAppDelegate(config, (config) => {
    const { language, contents } = config.modResults;
    if (language !== 'swift') {
      throw new Error(`withFirebaseConfigure: expected a Swift AppDelegate, got ${language}`);
    }
    if (contents.includes(CONFIGURE)) return config;

    let next = contents;
    if (!/^\s*import\s+FirebaseCore\s*$/m.test(next)) {
      next = next.replace(/^(\s*import\s+React\s*)$/m, 'import FirebaseCore\n$1');
    }
    config.modResults.contents = mergeContents({
      tag: 'with-firebase-configure',
      src: next,
      newSrc: `    ${CONFIGURE}`,
      // Right above the hand-over to Expo, which goes on to start React Native.
      anchor: /return super\.application\(application, didFinishLaunchingWithOptions:/,
      offset: 0,
      comment: '//',
    }).contents;
    return config;
  });
}

module.exports = withFirebaseConfigure;
