/**
 * TurboModule spec for react-native-accessibility-controller.
 *
 * This file is the source-of-truth for codegen. React Native's codegen reads
 * it to generate the C++ TurboModule glue that bridges Kotlin ↔ JS without
 * going through the legacy bridge.
 *
 * All method signatures here must match AccessibilityControllerModule.kt.
 */

import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Screen reading
  getAccessibilityTree(): Promise<Object[]>;
  getScreenText(): Promise<string>;
  takeScreenshot(): Promise<string>;

  // Node actions
  performAction(nodeId: string, action: string): Promise<boolean>;
  tapNode(nodeId: string): Promise<boolean>;
  longPressNode(nodeId: string): Promise<boolean>;
  setNodeText(nodeId: string, text: string): Promise<boolean>;
  scrollNode(nodeId: string, direction: string): Promise<boolean>;

  // Coordinate-based gestures
  tap(x: number, y: number): Promise<boolean>;
  longPress(x: number, y: number): Promise<boolean>;
  swipe(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    durationMs: number,
  ): Promise<boolean>;

  // Global actions
  globalAction(action: string): Promise<boolean>;
  openApp(packageName: string): Promise<boolean>;

  // Overlay
  showOverlay(config: Object): Promise<void>;
  updateOverlay(config: Object): Promise<void>;
  hideOverlay(): Promise<void>;

  // Service lifecycle
  isServiceEnabled(): Promise<boolean>;
  requestServiceEnable(): Promise<void>;
  canDrawOverlays(): Promise<boolean>;
  requestOverlayPermission(): Promise<void>;

  // Required by NativeEventEmitter
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AccessibilityController');
