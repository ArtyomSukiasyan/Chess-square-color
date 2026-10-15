# Square Color — mobile

Expo (React Native) app that wraps the [web game](../web) in a `react-native-webview`.

## Run in Expo Go

```bash
# 1. Start the web game, exposed on your LAN
cd ../web && npm install && npm run dev -- --host

# 2. Start the mobile app
cd ../mobile && npm install && npm start
```

Scan the QR code with Expo Go (phone on the same Wi‑Fi). In development the app loads
`http://<your-computer-ip>:5173` automatically.

## Point at a deployed site

Create `.env.local` (see `.env.example`):

```
EXPO_PUBLIC_WEBSITE_URL=https://your-deployment.example.com
```

Restart `npm start` after changing it. Release builds require this to be set.
