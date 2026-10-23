const {
  AndroidConfig,
  withAndroidColors,
  withAndroidColorsNight,
  withAndroidStyles,
} = require('expo/config-plugins');

const DIALOG_THEME = 'DatePickerDialogTheme';
const PICKER_STYLE = 'DatePickerStyle';

/**
 * Colors the Android date picker dialog with the app theme. The dialog takes its colors from the
 * native theme, which JS cannot change at runtime. Unlike the datetimepicker plugin, whose dialog
 * is always light, this one follows day/night, so the dialog matches the theme chosen in the app
 * (`Appearance.setColorScheme`).
 *
 * Options mirror `src/shared/theme/palette.ts`:
 * - `accent: { light, dark }` — `accent`: selected day, year list, buttons;
 * - `header: { background, text, mutedText }` — the brand header colors, the same in both themes,
 *   as in the navigation header. Colors are `#RRGGBB` or `#AARRGGBB`.
 */
function withDatePickerAccent(config, { accent, header }) {
  const dayColors = {
    datePickerAccent: accent.light,
    datePickerHeaderBackground: header.background,
    datePickerHeaderText: header.text,
    datePickerHeaderMutedText: header.mutedText,
  };

  config = withAndroidColors(config, (config) => {
    config.modResults = assignColors(config.modResults, dayColors);
    return config;
  });

  config = withAndroidColorsNight(config, (config) => {
    config.modResults = assignColors(config.modResults, { datePickerAccent: accent.dark });
    return config;
  });

  return withAndroidStyles(config, (config) => {
    // The light picker style takes the header colors from the theme's inverse text colors in both
    // themes; the dark one would paint the header grey. The inverse colors also color the text of
    // the selected day.
    const pickerStyle = { name: PICKER_STYLE, parent: 'android:Widget.Material.Light.DatePicker' };
    const dialogTheme = { name: DIALOG_THEME, parent: 'Theme.AppCompat.DayNight.Dialog' };

    config.modResults = assignStyles(config.modResults, [
      [pickerStyle, 'android:headerBackground', '@color/datePickerHeaderBackground'],
      [dialogTheme, 'colorAccent', '@color/datePickerAccent'],
      [dialogTheme, 'android:datePickerStyle', `@style/${PICKER_STYLE}`],
      [dialogTheme, 'android:textColorPrimaryInverse', '@color/datePickerHeaderText'],
      [dialogTheme, 'android:textColorSecondaryInverse', '@color/datePickerHeaderMutedText'],
      [
        AndroidConfig.Styles.getAppThemeGroup(),
        'android:datePickerDialogTheme',
        `@style/${DIALOG_THEME}`,
      ],
    ]);
    return config;
  });
}

function assignColors(colors, values) {
  return Object.entries(values).reduce(
    (acc, [name, value]) => AndroidConfig.Colors.assignColorValue(acc, { name, value }),
    colors,
  );
}

function assignStyles(styles, items) {
  return items.reduce(
    (acc, [parent, name, value]) =>
      AndroidConfig.Styles.assignStylesValue(acc, { add: true, parent, name, value }),
    styles,
  );
}

module.exports = withDatePickerAccent;
