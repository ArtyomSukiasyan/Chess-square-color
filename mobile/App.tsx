import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const WEBSITE_URL = 'https://chess-square-color-ten.vercel.app/';

// Mirrors --bg / --text in web/src/App.css so there's no flash around the page.
const THEME = {
  light: { bg: '#f6f5f2', text: '#1f1f1f', muted: '#6b6b6b', accent: '#2f7de1' },
  dark: { bg: '#1c1c1e', text: '#ededed', muted: '#9a9a9a', accent: '#5aa0ff' },
};

export default function App() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = THEME[scheme];
  // react-native-webview 14 defaults the generic to `undefined`, which collapses the props to `never`.
  const webViewRef = useRef<WebView<object>>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Android hardware back navigates inside the site before leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      webViewRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const retry = useCallback(() => {
    setError(null);
    webViewRef.current?.reload();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        {error ? (
          <View style={styles.center}>
            <Text style={[styles.message, { color: theme.text }]}>Couldn&apos;t load the game.</Text>
            <Text style={[styles.detail, { color: theme.muted }]}>
              {error}
              {'\n'}
              {WEBSITE_URL}
            </Text>
            <Pressable onPress={retry} style={styles.button}>
              <Text style={[styles.buttonText, { color: theme.accent }]}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.flex, error ? styles.hidden : null]}>
          <WebView
            ref={webViewRef}
            source={{ uri: WEBSITE_URL }}
            style={{ backgroundColor: theme.bg }}
            onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
            onError={(e) => setError(e.nativeEvent.description || 'Failed to load page')}
            onHttpError={(e) => setError(`HTTP ${e.nativeEvent.statusCode}`)}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.center, styles.overlay, { backgroundColor: theme.bg }]}>
                <ActivityIndicator size="large" color={theme.accent} />
              </View>
            )}
            // localStorage keeps the best streak between launches.
            domStorageEnabled
            // Feel like a native game: no bounce, zoom or text-selection callouts.
            bounces={false}
            overScrollMode="never"
            setBuiltInZoomControls={false}
            textInteractionEnabled={false}
            allowsBackForwardNavigationGestures
          />
        </View>

        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hidden: { display: 'none' },
  overlay: { ...StyleSheet.absoluteFill },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  message: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  detail: { fontSize: 14, textAlign: 'center' },
  button: { paddingHorizontal: 16, paddingVertical: 8 },
  buttonText: { fontSize: 17, fontWeight: '600' },
});
