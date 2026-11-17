# Brand Nation mobile app prototype

This is a **Capacitor development prototype**, not a store-approved release. It currently loads the live https://brand-nation.in storefront using Capacitor's remote server setting. The website and its Google Drive catalogue remain the source of truth.

## Build prerequisites
- Node.js 20+ and npm
- Android Studio + Android SDK for Android builds
- macOS + Xcode for iOS builds

## Setup
```bash
cd mobile
npm install
npx cap add android
npx cap add ios  # macOS only
npm run sync
npm run android # or npm run ios on macOS
```

Android release AAB/APK must be built and signed in Android Studio; iOS must be signed and archived using Xcode and an Apple Developer account. Never commit signing keys, certificates, passwords, or payment secrets.

## Before app-store submission
- Replace remote-site loading with bundled app assets or a native-feature-rich mobile experience. A thin website wrapper may be rejected by Apple and can be unsuitable for Google Play.
- Implement and test native navigation, offline/error states, product deep links, and app-specific features.
- Verify Razorpay payment behavior, COD, WhatsApp external links, image uploads, cart state, and privacy policies on real devices.
- Confirm Android package ID and Apple bundle ID ownership; `in.brandnation.shop` is provisional.
- Prepare 1024x1024 app icon, launch screen, screenshots, privacy disclosures and store listings.
- Keep existing GitHub Pages deployment workflow scoped to website files; mobile folder is separate.

This prototype does not change the live website or publish an app.
