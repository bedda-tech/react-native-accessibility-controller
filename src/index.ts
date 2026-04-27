export type {
  AccessibilityNode,
  NodeAction,
  GlobalAction,
  ScrollDirection,
  OverlayConfig,
  OverlayUpdateConfig,
  A11yEvent,
  WindowInfo,
  Subscription,
  FindNodeQuery,
  InstalledApp,
} from './types';

import type {
  AccessibilityNode,
  NodeAction,
  GlobalAction,
  ScrollDirection,
  OverlayConfig,
  OverlayUpdateConfig,
  A11yEvent,
  WindowInfo,
  Subscription,
  FindNodeQuery,
  InstalledApp,
} from './types';

import { NativeEventEmitter, Platform } from 'react-native';
import NativeAccessibilityController from './NativeAccessibilityController';

// ---------------------------------------------------------------------------
// Event emitter (singleton) — only instantiated on Android
// ---------------------------------------------------------------------------

const emitter =
  Platform.OS === 'android'
    ? new NativeEventEmitter(NativeAccessibilityController)
    : null;

// ---------------------------------------------------------------------------
// Screen reading
// ---------------------------------------------------------------------------

/**
 * Capture the full accessibility tree of the current screen.
 */
export async function getAccessibilityTree(): Promise<AccessibilityNode[]> {
  return NativeAccessibilityController.getAccessibilityTree() as Promise<
    AccessibilityNode[]
  >;
}

/**
 * Search the current accessibility tree for the first node matching the query.
 *
 * String fields use substring matching (case-sensitive). Returns null when no
 * node matches.
 *
 * @example
 * const node = await findNode({ text: 'Submit' })
 * if (node) await tapNode(node.nodeId)
 */
export async function findNode(
  query: FindNodeQuery,
): Promise<AccessibilityNode | null> {
  const tree = await getAccessibilityTree();
  return findInTree(tree, query);
}

/**
 * Search the current accessibility tree for ALL nodes matching the query.
 *
 * String fields use substring matching (case-sensitive). Returns an empty
 * array when no nodes match.
 *
 * @example
 * const buttons = await findAllNodes({ className: 'android.widget.Button' })
 * // Tap each one in turn
 * for (const btn of buttons) await tapNode(btn.nodeId)
 */
export async function findAllNodes(
  query: FindNodeQuery,
): Promise<AccessibilityNode[]> {
  const tree = await getAccessibilityTree();
  const results: AccessibilityNode[] = [];
  collectFromTree(tree, query, results);
  return results;
}

function nodeMatches(node: AccessibilityNode, query: FindNodeQuery): boolean {
  const textMatch =
    query.text !== undefined &&
    node.text !== null &&
    node.text.includes(query.text);
  const descMatch =
    query.contentDescription !== undefined &&
    node.contentDescription !== null &&
    node.contentDescription.includes(query.contentDescription);
  const classMatch =
    query.className !== undefined && node.className === query.className;
  return textMatch || descMatch || classMatch;
}

function findInTree(
  nodes: AccessibilityNode[],
  query: FindNodeQuery,
): AccessibilityNode | null {
  for (const node of nodes) {
    if (nodeMatches(node, query)) return node;
    const found = findInTree(node.children, query);
    if (found) return found;
  }
  return null;
}

function collectFromTree(
  nodes: AccessibilityNode[],
  query: FindNodeQuery,
  results: AccessibilityNode[],
): void {
  for (const node of nodes) {
    if (nodeMatches(node, query)) results.push(node);
    collectFromTree(node.children, query, results);
  }
}

/**
 * Get a serialised text representation of the current screen.
 */
export async function getScreenText(): Promise<string> {
  return NativeAccessibilityController.getScreenText();
}

/**
 * Take a screenshot and return it as a base64-encoded image string.
 */
export async function takeScreenshot(): Promise<string> {
  return NativeAccessibilityController.takeScreenshot();
}

// ---------------------------------------------------------------------------
// Node actions
// ---------------------------------------------------------------------------

/**
 * Perform an arbitrary action on a node identified by its ID.
 */
export async function performAction(
  nodeId: string,
  action: NodeAction,
): Promise<boolean> {
  return NativeAccessibilityController.performAction(nodeId, action);
}

/**
 * Tap (click) a node.
 */
export async function tapNode(nodeId: string): Promise<boolean> {
  return NativeAccessibilityController.tapNode(nodeId);
}

/**
 * Long-press a node.
 */
export async function longPressNode(nodeId: string): Promise<boolean> {
  return NativeAccessibilityController.longPressNode(nodeId);
}

/**
 * Set the text content of an editable node.
 */
export async function setNodeText(
  nodeId: string,
  text: string,
): Promise<boolean> {
  return NativeAccessibilityController.setNodeText(nodeId, text);
}

/**
 * Scroll a scrollable node in the given direction.
 */
export async function scrollNode(
  nodeId: string,
  direction: ScrollDirection,
): Promise<boolean> {
  return NativeAccessibilityController.scrollNode(nodeId, direction);
}

// ---------------------------------------------------------------------------
// Coordinate-based gestures
// ---------------------------------------------------------------------------

/**
 * Tap at screen coordinates.
 */
export async function tap(x: number, y: number): Promise<boolean> {
  return NativeAccessibilityController.tap(x, y);
}

/**
 * Long-press at screen coordinates.
 */
export async function longPress(x: number, y: number): Promise<boolean> {
  return NativeAccessibilityController.longPress(x, y);
}

/**
 * Swipe between two screen coordinates.
 */
export async function swipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs: number = 300,
): Promise<boolean> {
  return NativeAccessibilityController.swipe(
    startX,
    startY,
    endX,
    endY,
    durationMs,
  );
}

// ---------------------------------------------------------------------------
// Global actions
// ---------------------------------------------------------------------------

/**
 * Execute a system-level global action (home, back, recents, etc.).
 */
export async function globalAction(action: GlobalAction): Promise<boolean> {
  return NativeAccessibilityController.globalAction(action);
}

/**
 * Open an app by its Android package name.
 */
export async function openApp(packageName: string): Promise<boolean> {
  return NativeAccessibilityController.openApp(packageName);
}

/**
 * Returns a list of all user-launchable apps installed on the device.
 * Each entry includes the Android package name and the human-readable label.
 */
export async function getInstalledApps(): Promise<InstalledApp[]> {
  return NativeAccessibilityController.getInstalledApps() as Promise<InstalledApp[]>;
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Show a floating overlay window with the given configuration.
 */
export async function showOverlay(config: OverlayConfig): Promise<void> {
  return NativeAccessibilityController.showOverlay(config);
}

/**
 * Update the content of the agent-status overlay (action text + step count).
 * No-op if no overlay is currently shown.
 */
export async function updateOverlay(config: OverlayUpdateConfig): Promise<void> {
  return NativeAccessibilityController.updateOverlay(config);
}

/**
 * Hide the floating overlay window.
 */
export async function hideOverlay(): Promise<void> {
  return NativeAccessibilityController.hideOverlay();
}

/**
 * Subscribe to the overlay stop button tap event.
 * Fired when the user taps the Stop (■) button in the agent-status overlay.
 *
 * Returns a Subscription — call `.remove()` to unsubscribe.
 */
export function onOverlayStop(callback: () => void): Subscription {
  if (!emitter) {
    console.warn(
      'react-native-accessibility-controller: onOverlayStop is only supported on Android',
    );
    return { remove: () => {} };
  }
  const sub = emitter.addListener('onOverlayStop', callback);
  return { remove: () => sub.remove() };
}

// ---------------------------------------------------------------------------
// Event streaming
// ---------------------------------------------------------------------------

/**
 * Subscribe to raw accessibility events.
 *
 * Returns a Subscription — call `.remove()` to unsubscribe when done.
 */
export function onAccessibilityEvent(
  callback: (event: A11yEvent) => void,
): Subscription {
  if (!emitter) {
    console.warn(
      'react-native-accessibility-controller: onAccessibilityEvent is only supported on Android',
    );
    return { remove: () => {} };
  }
  const sub = emitter.addListener('onAccessibilityEvent', callback);
  return { remove: () => sub.remove() };
}

/**
 * Subscribe to window-change events.
 *
 * Returns a Subscription — call `.remove()` to unsubscribe when done.
 */
export function onWindowChange(
  callback: (window: WindowInfo) => void,
): Subscription {
  if (!emitter) {
    console.warn(
      'react-native-accessibility-controller: onWindowChange is only supported on Android',
    );
    return { remove: () => {} };
  }
  const sub = emitter.addListener('onWindowChange', callback);
  return { remove: () => sub.remove() };
}

// ---------------------------------------------------------------------------
// Service lifecycle
// ---------------------------------------------------------------------------

/**
 * Check whether the AccessibilityService is currently enabled.
 */
export async function isServiceEnabled(): Promise<boolean> {
  return NativeAccessibilityController.isServiceEnabled();
}

/**
 * Prompt the user to enable the AccessibilityService in Android settings.
 */
export async function requestServiceEnable(): Promise<void> {
  return NativeAccessibilityController.requestServiceEnable();
}

/**
 * Check whether the SYSTEM_ALERT_WINDOW ("Draw over other apps") permission
 * has been granted. Returns true on non-Android platforms.
 */
export async function canDrawOverlays(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  return NativeAccessibilityController.canDrawOverlays();
}

/**
 * Opens the system "Draw over other apps" settings page for this package.
 * Call canDrawOverlays() after the user returns to verify the grant.
 * No-op on non-Android platforms (always permitted).
 */
export async function requestOverlayPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  return NativeAccessibilityController.requestOverlayPermission();
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

export type {
  UseAccessibilityTreeOptions,
  UseAccessibilityTreeResult,
  UseScreenTextOptions,
  UseScreenTextResult,
  UseAccessibilityEventsOptions,
  ServiceStatus,
} from './hooks';

export {
  useAccessibilityTree,
  useScreenText,
  useAccessibilityEvents,
  useWindowChange,
  useServiceStatus,
} from './hooks';
