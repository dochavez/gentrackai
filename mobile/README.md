# GentrackAI Mobile App (React Native + Expo)

The cross-platform GentrackAI app (iOS, Android and web). See the [main README](../README.md) for the full product description.

## Structure

- `src/app/`: Expo Router routes (owner experience, authentication and Technician Panel).
- `src/features/`: feature modules: `generators`, `maintenance`, `chat`, `insights`, `tasks`, `team`, `billing`, `technician`, `maintenance-requests`, `auth`, `account`, `home`.
- `src/components/`: shared UI components and SVG icons.
- `src/config/env.ts`: public configuration read from `EXPO_PUBLIC_*` variables.
- `docs/`: App Store submission notes (credentials replaced with placeholders).

## Development

```bash
npm install
cp .env.example .env      # public keys only; never secrets
npx expo start
```

For EAS Build, set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` as *EAS environment variables*, and replace `YOUR_GOOGLE_IOS_CLIENT_ID` and `YOUR_EAS_PROJECT_ID` in `app.json`.
