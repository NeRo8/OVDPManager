// EAS Metadata config (`submit.production.ios.metadataPath` in eas.json). The public listing lives in
// store.config.json; the App Review contact is added here, with the phone read from .env
// so it stays out of git (see .env.example).
const fs = require('node:fs');
const path = require('node:path');

const listing = require('./store.config.json');

const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const phone = process.env.REVIEW_PHONE;
if (!phone) {
  throw new Error('REVIEW_PHONE is not set: add it to .env (see .env.example).');
}

module.exports = {
  ...listing,
  apple: {
    ...listing.apple,
    review: {
      firstName: 'Artur',
      lastName: 'Duchenko',
      email: 'artur.duchenko@gmail.com',
      phone,
      demoRequired: false,
      notes: [
        'No account or sign-in is needed to use the app. The interface is in Ukrainian.',
        '',
        'To try it:',
        '1. On the first screen enter any plan name and continue.',
        '2. On the «Гаманець» (Wallet) tab tap + and pick any bond from the list.',
        '3. Enter a date, a quantity and the amount paid, then save.',
        "4. The «Виплати» (Payments), «Звіти» (Reports) and «План» (Plan) tabs now show the bond's coupons and redemption.",
        '',
        'Bond and key rate data come from the National Bank of Ukraine open data API (bank.gov.ua), which is free to reuse under Ukrainian law.',
        '',
        '«Увійти через Google» in «Налаштування» (Settings) is optional and is not an app account: it only stores one encrypted backup copy in Firebase. The backup is encrypted on the device with a key the user types (Argon2id + AES-256-GCM); the developer cannot read it. «Видалити дані з хмари» in Settings deletes the cloud copy and the Firebase account.',
      ].join('\n'),
    },
  },
};
