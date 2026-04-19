# Changelog

All notable changes to `react-native-accessibility-controller` are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] – 2026-04-19

Initial public release.

### Added

**Android native (Kotlin)**
- `AccessibilityControllerService` – `AccessibilityService` implementation with full capability flags
- `ScreenReader` – captures accessibility tree as `AccessibilityNode` objects; serializes to text
- `ActionDispatcher` – node-based actions: tap, long press, set text, scroll, focus
- `GestureDispatcher` – coordinate-based gestures via `GestureDescription` API (API 24+)
- `OverlayManager` – floating `TYPE_ACCESSIBILITY_OVERLAY` window management
- `EventEmitter` – streams `AccessibilityEvent` and window-change events to JavaScript

**TurboModule bridge**
- `AccessibilityControllerModule` – New Architecture TurboModule wiring all native APIs to JS
- Full codegen spec (`NativeAccessibilityController.ts`)

**JavaScript / TypeScript API**
- Screen reading: `getAccessibilityTree()`, `getScreenText()`, `takeScreenshot()`
- Node actions: `tapNode()`, `longPressNode()`, `setNodeText()`, `scrollNode()`
- Coordinate gestures: `tap()`, `longPress()`, `swipe()`
- Global actions: `globalAction()` (HOME, BACK, RECENTS, NOTIFICATIONS, QUICK_SETTINGS, POWER_DIALOG)
- App control: `openApp(packageName)`
- Overlay: `showOverlay()`, `hideOverlay()`
- Event streaming: `onAccessibilityEvent()`, `onWindowChange()`
- Service lifecycle: `isServiceEnabled()`, `requestServiceEnable()`

**React hooks**
- `useAccessibilityTree` – live accessibility tree with configurable poll interval
- `useAccessibilityEvents` – filtered event stream as a React hook

**Platform support**
- Android only (minSdk 26 / API 26)
- iOS: podspec stub (no-op); package installs without errors

[Unreleased]: https://github.com/bedda-tech/react-native-accessibility-controller/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/bedda-tech/react-native-accessibility-controller/releases/tag/v0.1.0
