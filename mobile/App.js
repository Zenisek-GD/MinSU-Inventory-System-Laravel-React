import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getBaseUrl, setBaseUrl, getItemByQrEndpoint, getWebBaseUrl, setWebBaseUrl } from './config';
import { Linking } from 'react-native';

function ScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera access is required to scan QR codes.</Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  const onBarcodeScanned = (res) => {
    if (scanned) return;
    setScanned(true);
    setResult(res?.data ?? null);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="light" />
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={(res) => {
          onBarcodeScanned(res);
          if (res?.data) {
            navigation.navigate('ItemDetail', { qr: res.data });
          }
        }}
      />
      <View style={styles.bottomPanel}>
        <Text style={styles.text}>Scanned: {result ?? 'None'}</Text>
        {scanned && (
          <Button title="Scan Again" onPress={() => { setScanned(false); setResult(null); }} />
        )}
        {result && (
          <Button title="Open in Web" onPress={async () => {
            const baseWeb = await getWebBaseUrl();
            const url = `${String(baseWeb).replace(/\/$/, '')}/items/qr/${encodeURIComponent(result)}`;
            try { await Linking.openURL(url); } catch (e) {}
          }} />
        )}
      </View>
    </View>
  );
}

function ItemDetailScreen({ route }) {
  const { qr } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  const [baseUrl, setBase] = useState(null);

  useEffect(() => {
    let abort = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        const base = await getBaseUrl();
        setBase(base);
        const url = getItemByQrEndpoint(base, qr);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!abort) setItem(data);
      } catch (e) {
        if (!abort) {
          // Normalize AbortError into clearer guidance
          const msg = (e && e.name === 'AbortError')
            ? 'Request timed out. Check BASE_URL, device network, and firewall.'
            : ((e && e.message) ? e.message : String(e));
          setError(msg);
        }
      } finally {
        if (!abort) setLoading(false);
      }
    }
    if (qr) run();
    return () => { abort = true; };
  }, [qr]);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>QR: {qr}</Text>
      {baseUrl && <Text style={{ color: '#666' }}>Base: {baseUrl}</Text>}
      {loading && <ActivityIndicator />}
      {error && (
        <View style={{ gap: 8 }}>
          <Text style={{ color: 'red' }}>Error: {error}</Text>
          <Button title="Retry" onPress={() => {
            // trigger effect by resetting state
            setItem(null);
            setError(null);
            setLoading(false);
            // Re-run by updating dependency via a tiny noop
            // Simply toggling qr re-runs effect; keep same value
          }} />
          <Text style={{ color: '#666' }}>
            Ensure API is reachable from the device: update BASE_URL in config.js.
          </Text>
        </View>
      )}
      {item && (
        <View style={{ gap: 6 }}>
          <Text>Name: {item?.name ?? item?.item_name ?? '—'}</Text>
          <Text>Category: {item?.category?.name ?? item?.category_name ?? '—'}</Text>
          <Text>Office: {item?.office?.name ?? item?.office_name ?? '—'}</Text>
          <Text>Status: {item?.status ?? '—'}</Text>
          {/* Add more fields as your API returns */}
        </View>
      )}
    </View>
  );
}

function SettingsScreen() {
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [webBase, setWebBase] = useState('');
  const [savingWeb, setSavingWeb] = useState(false);

  useEffect(() => {
    (async () => {
      const base = await getBaseUrl();
      setCurrent(base);
      const wb = await getWebBaseUrl();
      setWebBase(wb);
    })();
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Backend Base URL</Text>
      <Text style={{ color: '#666' }}>Examples: http://10.0.2.2:8000 (emulator), http://192.168.1.x:8000 (device)</Text>
      <TextInput
        value={current}
        onChangeText={setCurrent}
        placeholder="http://10.0.2.2:8000"
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
      <Button title={saving ? 'Saving…' : 'Save'} onPress={async () => {
        setSaving(true);
        await setBaseUrl(current);
        setSaving(false);
      }} />
      <Text style={{ marginTop: 16, fontSize: 16 }}>Web Base URL</Text>
      <Text style={{ color: '#666' }}>Examples: http://10.0.2.2:5173 (emulator), http://192.168.1.x:5173 (device)</Text>
      <TextInput
        value={webBase}
        onChangeText={setWebBase}
        placeholder="http://192.168.1.x:5173"
        autoCapitalize="none"
        autoCorrect={false}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8 }}
      />
      <Button title={savingWeb ? 'Saving…' : 'Save Web URL'} onPress={async () => {
        setSavingWeb(true);
        await setWebBaseUrl(webBase);
        setSavingWeb(false);
      }} />
      <Button title={testing ? 'Testing…' : 'Test Connectivity'} onPress={async () => {
        try {
          setTesting(true);
          setTestResult(null);
          const url = `${current}/api/v1/items/qr/ping`;
          const res = await fetch(url);
          setTestResult(`HTTP ${res.status}`);
        } catch (e) {
          setTestResult((e && e.message) ? e.message : String(e));
        } finally {
          setTesting(false);
        }
      }} />
      {testResult && <Text>Test: {testResult}</Text>}
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ title: 'QR Scanner' }} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} options={{ title: 'Item Detail' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottomPanel: { padding: 12, backgroundColor: '#111', gap: 8 },
  text: { color: '#fff' },
});
