# Square Color — mobile

Expo (React Native) app that wraps the deployed [web game](../web)
(https://chess-square-color-ten.vercel.app/) in a `react-native-webview`.

## Run in Expo Go

```bash
npm install
npm start
```

Scan the QR code with Expo Go. To point the app at a different deployment, change
`WEBSITE_URL` in `App.tsx`.

## Checks

```bash
npx tsc --noEmit
npm run lint
npx expo-doctor
```
