import 'react-native-unistyles/mocks';

// MMKV mocks its storage under Jest by itself, but its import still loads Nitro, which looks for
// the native module at once; Nitro is only used lazily, so an empty one is enough.
jest.mock('react-native-nitro-modules', () => ({ NitroModules: {} }));
