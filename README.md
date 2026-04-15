# react-native-accessibility-controller

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm version](https://img.shields.io/npm/v/react-native-accessibility-controller.svg)](https://www.npmjs.com/package/react-native-accessibility-controller)
[![build](https://img.shields.io/github/actions/workflow/status/bedda-tech/react-native-accessibility-controller/ci.yml?branch=main)](https://github.com/bedda-tech/react-native-accessibility-controller/actions)

**Android AccessibilityService for React Native.** Full read/write access to any app's UI tree, coordinate-based gestures, and system actions -- all from JavaScript.

Part of the [Deft](https://github.com/bedda-tech/deft) ecosystem: an open-source, fully on-device AI phone agent.

---

## Architecture

```
 React Native (JavaScript)
         |
         v
 TurboModule Bridge (Kotlin)
         |
         v
 AccessibilityControllerModule.kt -----> AccessibilityControllerService.kt
         |                                         |
         |   getAccessibilityTree()                |   onAccessibilityEvent()
         |   performAction()                       |   rootInActiveWindow
         |   tap(x, y) / swipe(...)                |   dispatchGesture()
         |   globalAction()                        |   performGlobalAction()
         |                                         |
         v                                         v
 +-------------------------------------------------+
 |            Android AccessibilityService          |
 |  (system-level access to any foreground app)     |
 +-------------------------------------------------+
         |
         v
   Any app on screen
```

## Features

- **Screen reading** -- capture the full accessibility tree of any app, serialise to text, or take screenshots
- **Node actions** -- tap, long press, set text, scroll any UI element by its accessibility node ID
- **Coordinate gestures** -- tap, long press, and swipe at arbitrary screen coordinates
- **Global actions** -- home, back, recents, notifications, open any app by package name
- **Overlay** -- floating overlay window for agent UI
- **Event streaming** -- subscribe to real-time accessibility and window-change events
- **Service lifecycle** -- check status and prompt the user to enable the service

## Installation

```bash
npm install react-native-accessibility-controller
# or
yarn add react-native-accessibility-controller
```

### Requirements

- React Native >= 0.76 (New Architecture)
- Android only (iOS is a no-op stub)

### Android Setup

Add the service declaration to your app's `AndroidManifest.xml`:

```xml
<service
    android:name="com.beddatech.accessibilitycontroller.AccessibilityControllerService"
    android:exported="false"
    android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE">
    <intent-filter>
        <action android:name="android.accessibilityservice.AccessibilityService" />
    </intent-filter>
    <meta-data
        android:name="android.accessibilityservice"
        android:resource="@xml/accessibility_service_config" />
</service>
```

## API

### Screen Reading

```typescript
import {
  getAccessibilityTree,
  getScreenText,
  takeScreenshot,
} from 'react-native-accessibility-controller';

// Full tree
const tree = await getAccessibilityTree();

// Serialised text (useful as LLM input)
const text = await getScreenText();

// Base64 screenshot
const base64 = await takeScreenshot();
```

### Node Actions

```typescript
import {
  tapNode,
  longPressNode,
  setNodeText,
  scrollNode,
  performAction,
} from 'react-native-accessibility-controller';

await tapNode('node-42');
await longPressNode('node-42');
await setNodeText('input-7', 'Hello world');
await scrollNode('list-1', 'down');
await performAction('node-42', 'select');
```

### Coordinate Gestures

```typescript
import { tap, longPress, swipe } from 'react-native-accessibility-controller';

await tap(500, 800);
await longPress(500, 800);
await swipe(200, 1000, 200, 400, 300); // swipe up, 300ms
```

### Global Actions

```typescript
import { globalAction, openApp } from 'react-native-accessibility-controller';

await globalAction('home');
await globalAction('back');
await openApp('com.android.settings');
```

### Overlay

```typescript
import { showOverlay, hideOverlay } from 'react-native-accessibility-controller';

await showOverlay({ width: 200, height: 100, gravity: 'top-right' });
await hideOverlay();
```

### Event Streaming

```typescript
import {
  onAccessibilityEvent,
  onWindowChange,
} from 'react-native-accessibility-controller';

const sub = onAccessibilityEvent((event) => {
  console.log(event.eventType, event.packageName);
});

// Later:
sub.remove();
```

### Service Lifecycle

```typescript
import {
  isServiceEnabled,
  requestServiceEnable,
} from 'react-native-accessibility-controller';

const enabled = await isServiceEnabled();
if (!enabled) {
  await requestServiceEnable(); // Opens Android settings
}
```

### React Hooks

Three hooks are provided for idiomatic React usage. They handle subscription
cleanup and polling teardown automatically.

#### `useAccessibilityTree(options?)`

Fetches the accessibility tree on mount and (optionally) polls it on an
interval. Returns `{ tree, loading, error, refresh }`.

```tsx
import { useAccessibilityTree } from 'react-native-accessibility-controller';

function ScreenDebugger() {
  const { tree, loading, error, refresh } = useAccessibilityTree({
    pollIntervalMs: 1000,   // re-fetch every second
    fetchOnMount: true,     // default
  });

  if (loading) return <ActivityIndicator />;
  if (error)   return <Text>{error.message}</Text>;

  return (
    <View>
      <Button title="Refresh" onPress={refresh} />
      <Text>{tree?.length ?? 0} root nodes</Text>
    </View>
  );
}
```

#### `useAccessibilityEvents(options?)`

Subscribes to raw accessibility events and returns a rolling buffer (newest
first). Defaults to keeping 50 events.

```tsx
import { useAccessibilityEvents } from 'react-native-accessibility-controller';

function EventLog() {
  const events = useAccessibilityEvents({ maxEvents: 20 });
  return (
    <>
      {events.map((e, i) => (
        <Text key={i}>{e.eventType} — {e.packageName}</Text>
      ))}
    </>
  );
}
```

#### `useWindowChange()`

Returns the most recently focused window (or `null` before the first event).

```tsx
import { useWindowChange } from 'react-native-accessibility-controller';

function ForegroundApp() {
  const win = useWindowChange();
  return <Text>Active: {win?.packageName ?? '—'}</Text>;
}
```

## Types

```typescript
interface AccessibilityNode {
  nodeId: string;
  className: string;
  text: string | null;
  contentDescription: string | null;
  bounds: { left: number; top: number; right: number; bottom: number };
  isClickable: boolean;
  isScrollable: boolean;
  isEditable: boolean;
  isFocused: boolean;
  children: AccessibilityNode[];
  availableActions: NodeAction[];
}

type NodeAction = 'click' | 'longClick' | 'scrollForward' | 'scrollBackward' | 'setText' | 'clearFocus' | 'select';
type GlobalAction = 'home' | 'back' | 'recents' | 'notifications' | 'quickSettings' | 'powerDialog';
type ScrollDirection = 'up' | 'down' | 'left' | 'right';

interface OverlayConfig {
  width: number;       // dp
  height: number;      // dp
  gravity?: string;    // 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center' | 'center'
  touchable?: boolean; // default false — overlay passes touches through
  backgroundColor?: string; // hex, e.g. '#FF6B35CC' (RGBA)
}
```

## Deft Ecosystem

| Package | Description |
|---------|-------------|
| [react-native-accessibility-controller](https://github.com/bedda-tech/react-native-accessibility-controller) | Android AccessibilityService for React Native (this repo) |
| [react-native-device-agent](https://github.com/bedda-tech/react-native-device-agent) | Agent loop connecting LLM to phone control |
| [react-native-executorch](https://github.com/bedda-tech/react-native-executorch) | On-device LLM inference (Gemma 4) via ExecuTorch |
| [deft](https://github.com/bedda-tech/deft) | The consumer app combining all three |

## Example App

`example/src/App.tsx` is a single-screen React Native app that exercises
every API: screen reading, node tap, gestures, global actions, overlay, and
live event streaming.

```bash
cd example
npm install
npx react-native run-android
```

Requires the Accessibility Service to be enabled for the demo app in
**Settings → Accessibility → Accessibility Controller**.

## Contributing

Contributions are welcome. This library targets Android's AccessibilityService APIs, so a physical device or emulator with Android 10+ (API 30+) is needed for most testing.

**Setup**

```bash
git clone https://github.com/bedda-tech/react-native-accessibility-controller.git
cd react-native-accessibility-controller
npm install
```

**Guidelines**

- All new APIs must have TypeScript types exported from `src/index.ts`
- Kotlin code should follow the existing singleton pattern (`ActionDispatcher`, `GestureDispatcher`)
- `GestureDescription.StrokeDescription` requires duration >= 1ms -- coerce any zero values
- Screenshot APIs require API 30+; guard with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.R` and delegate to a `@RequiresApi(Build.VERSION_CODES.R)` private method
- Hardware bitmaps must be copied to `ARGB_8888` before compression
- Open an issue before starting large changes

## License

MIT
