/**
 * react-native-accessibility-controller — Example App
 *
 * Demonstrates the full API: screen reading, node actions, gestures,
 * global actions, overlay, event streaming, and React hooks.
 *
 * Run on a physical Android device or emulator with the Accessibility
 * Service enabled in Settings → Accessibility.
 */

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  // Core API
  getScreenText,
  takeScreenshot,
  tap,
  swipe,
  globalAction,
  openApp,
  showOverlay,
  hideOverlay,
  isServiceEnabled,
  requestServiceEnable,
  // Hooks
  useAccessibilityTree,
  useAccessibilityEvents,
  useWindowChange,
} from 'react-native-accessibility-controller';

// ---------------------------------------------------------------------------
// ServiceGate — shows enable prompt until service is active
// ---------------------------------------------------------------------------
function ServiceGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    isServiceEnabled().then(setEnabled);
  }, []);

  if (enabled === null) return <ActivityIndicator style={styles.center} />;

  if (!enabled) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.heading}>Accessibility Service Required</Text>
        <Text style={styles.muted}>
          Enable "Accessibility Controller" in Android Settings to use this
          demo.
        </Text>
        <Button
          title="Open Accessibility Settings"
          onPress={async () => {
            await requestServiceEnable();
            // Re-check after returning from settings
            setTimeout(() => isServiceEnabled().then(setEnabled), 2000);
          }}
        />
      </SafeAreaView>
    );
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Section helper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen Reading panel
// ---------------------------------------------------------------------------
function ScreenReadingPanel() {
  const { tree, loading, error, refresh } = useAccessibilityTree();
  const [screenText, setScreenText] = useState<string | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  return (
    <Section title="Screen Reading">
      <Button title={loading ? 'Refreshing…' : 'Refresh Tree'} onPress={refresh} />
      {error && <Text style={styles.error}>{error.message}</Text>}
      {tree && (
        <Text style={styles.mono}>
          {tree.length} root nodes — first: {tree[0]?.className ?? 'n/a'}
        </Text>
      )}

      <View style={styles.row}>
        <Button
          title="Get Screen Text"
          onPress={async () => {
            const text = await getScreenText();
            setScreenText(text.slice(0, 300) + (text.length > 300 ? '…' : ''));
          }}
        />
        <Button
          title="Screenshot"
          onPress={async () => {
            try {
              const b64 = await takeScreenshot();
              setScreenshot(b64.slice(0, 40) + '…');
            } catch (e: unknown) {
              setScreenshot(String(e));
            }
          }}
        />
      </View>
      {screenText && <Text style={styles.mono}>{screenText}</Text>}
      {screenshot && <Text style={styles.mono}>[Base64] {screenshot}</Text>}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Gestures panel
// ---------------------------------------------------------------------------
function GesturesPanel() {
  const [result, setResult] = useState<string>('');

  return (
    <Section title="Gestures">
      <View style={styles.row}>
        <Button
          title="Tap (500, 800)"
          onPress={async () => {
            const ok = await tap(500, 800);
            setResult(`tap → ${ok}`);
          }}
        />
        <Button
          title="Swipe Up"
          onPress={async () => {
            const ok = await swipe(500, 1400, 500, 400, 300);
            setResult(`swipe → ${ok}`);
          }}
        />
      </View>
      {result ? <Text style={styles.mono}>{result}</Text> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Global Actions panel
// ---------------------------------------------------------------------------
function GlobalActionsPanel() {
  const [result, setResult] = useState<string>('');

  return (
    <Section title="Global Actions">
      <View style={styles.row}>
        {(['home', 'back', 'recents'] as const).map((action) => (
          <Button
            key={action}
            title={action}
            onPress={async () => {
              const ok = await globalAction(action);
              setResult(`${action} → ${ok}`);
            }}
          />
        ))}
      </View>
      <Button
        title="Open Settings"
        onPress={async () => {
          const ok = await openApp('com.android.settings');
          setResult(`openApp → ${ok}`);
        }}
      />
      {result ? <Text style={styles.mono}>{result}</Text> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Overlay panel
// ---------------------------------------------------------------------------
function OverlayPanel() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState('');

  return (
    <Section title="Overlay">
      {!visible ? (
        <Button
          title="Show Overlay"
          onPress={async () => {
            try {
              await showOverlay({
                width: 200,
                height: 60,
                gravity: 'top-right',
                backgroundColor: '#FF6B35CC',
                touchable: false,
              });
              setVisible(true);
              setStatus('Overlay visible — top-right corner');
            } catch (e: unknown) {
              setStatus(String(e));
            }
          }}
        />
      ) : (
        <Button
          title="Hide Overlay"
          onPress={async () => {
            await hideOverlay();
            setVisible(false);
            setStatus('Overlay hidden');
          }}
        />
      )}
      {status ? <Text style={styles.mono}>{status}</Text> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Events panel (uses hooks)
// ---------------------------------------------------------------------------
function EventsPanel() {
  const events = useAccessibilityEvents({ maxEvents: 10 });
  const win = useWindowChange();

  return (
    <Section title="Live Events">
      <Text style={styles.label}>
        Foreground app: {win?.packageName ?? '—'}
      </Text>
      <Text style={styles.label}>Recent events ({events.length}):</Text>
      {events.slice(0, 5).map((e, i) => (
        <Text key={i} style={styles.mono}>
          {e.eventType} · {e.packageName}
        </Text>
      ))}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Node Tap by ID
// ---------------------------------------------------------------------------
function NodeTapPanel() {
  const [nodeId, setNodeId] = useState('');
  const [result, setResult] = useState('');
  const { tree } = useAccessibilityTree();

  return (
    <Section title="Tap Node by ID">
      <TextInput
        style={styles.input}
        value={nodeId}
        onChangeText={setNodeId}
        placeholder="e.g. node-42"
        autoCapitalize="none"
      />
      <Button
        title="Tap Node"
        onPress={async () => {
          const node = tree
            ?.flatMap(function flatten(n): typeof n[] {
              return [n, ...n.children.flatMap(flatten)];
            })
            .find((n) => n.nodeId === nodeId);
          if (!node) {
            setResult(`Node "${nodeId}" not found in tree`);
            return;
          }
          const { tapNode } = await import(
            'react-native-accessibility-controller'
          );
          const ok = await tapNode(nodeId);
          setResult(`tapNode → ${ok}`);
        }}
      />
      {result ? <Text style={styles.mono}>{result}</Text> : null}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <ServiceGate>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>A11y Controller Demo</Text>
          <ScreenReadingPanel />
          <GesturesPanel />
          <GlobalActionsPanel />
          <OverlayPanel />
          <EventsPanel />
          <NodeTapPanel />
        </ScrollView>
      </SafeAreaView>
    </ServiceGate>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  scroll: { padding: 16, gap: 8 },
  heading: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  section: {
    backgroundColor: '#1e1e1e',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  mono: { fontFamily: 'monospace', fontSize: 12, color: '#ccc' },
  muted: { color: '#888', textAlign: 'center', marginVertical: 8 },
  label: { color: '#bbb', fontSize: 13 },
  error: { color: '#ff6b6b', fontSize: 13 },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    fontSize: 13,
    fontFamily: 'monospace',
  },
});
