# Changelog

All notable changes to `react-native-accessibility-controller` are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.0] – 2026-06-18

### Added
- `takeScreenshot()` now uses MediaProjection API (API 29+) for reliable, permission-gated screen capture; falls back to the legacy `AccessibilityService.takeScreenshot()` path on older devices

### Changed
- Full TurboModule v2 migration: `AccessibilityControllerModule` is now a proper Kotlin TurboModule with generated C++ JSI bindings (requires React Native New Architecture)
- Applied `com.facebook.react` Gradle plugin for proper TurboModule codegen wiring
- Updated `ActivityEventListener` API for React Native 0.81 compatibility

## [1.3.0] – 2026-05-01

### Fixed
- Replaced deprecated `AccessibilityAction.ACTION_CLEAR_TEXT` with the `ACTION_CLEAR_TEXT` int constant (removed in API 36)
- Used `UiAutomation` proxy for `takeScreenshot()` on API 36+ where `AccessibilityService.takeScreenshot()` was removed
- Replaced deprecated IME action constants with `AccessibilityNodeInfo` action variants for API 36 compat
- Aligned Kotlin and Java JVM targets to 17 to satisfy Gradle 8.10+ validation

### CI
- Upgraded to Node.js 22; opted into GitHub Actions Node.js 24 runtime

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

[Unreleased]: https://github.com/bedda-tech/react-native-accessibility-controller/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/bedda-tech/react-native-accessibility-controller/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/bedda-tech/react-native-accessibility-controller/compare/v1.2.0...v1.3.0
[0.1.0]: https://github.com/bedda-tech/react-native-accessibility-controller/releases/tag/v0.1.0
