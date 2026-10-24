// The domain's tests import slices whose public API also gives their screens' parts, which load
// the whole UI kit and its native modules (Skia, Reanimated, glass, pickers). The tests render
// nothing, so under Jest the kit is an empty module: it is only used inside render functions.
export {};
