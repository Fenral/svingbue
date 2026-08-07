// Browser/source default. Native release builds replace the relevant public
// RevenueCat SDK key in www/ after copy-web. These are public app identifiers,
// not secret API credentials, but placeholders must keep checkout fail-closed.
export const REVENUECAT_PUBLIC_SDK_KEYS = Object.freeze({
  ios: 'appl_REPLACE_ME',
  android: 'goog_REPLACE_ME',
});
