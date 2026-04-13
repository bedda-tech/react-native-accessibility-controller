export type {
  AccessibilityNode,
  NodeAction,
  GlobalAction,
  ScrollDirection,
  OverlayConfig,
  A11yEvent,
  WindowInfo,
  Subscription,
} from './types';

import type {
  AccessibilityNode,
  NodeAction,
  GlobalAction,
  ScrollDirection,
  OverlayConfig,
  A11yEvent,
  WindowInfo,
  Subscription,
} from './types';

// ---------------------------------------------------------------------------
// Screen reading
// ---------------------------------------------------------------------------

/**
 * Capture the full accessibility tree of the current screen.
 */
export async function getAccessibilityTree(): Promise<AccessibilityNode[]> {
  throw new Error('Not implemented: getAccessibilityTree');
}

/**
 * Get a serialised text representation of the current screen.
 */
export async function getScreenText(): Promise<string> {
  throw new Error('Not implemented: getScreenText');
}

/**
 * Take a screenshot and return it as a base64-encoded image string.
 */
export async function takeScreenshot(): Promise<string> {
  throw new Error('Not implemented: takeScreenshot');
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
  throw new Error('Not implemented: performAction');
}

/**
 * Tap (click) a node.
 */
export async function tapNode(nodeId: string): Promise<boolean> {
  throw new Error('Not implemented: tapNode');
}

/**
 * Long-press a node.
 */
export async function longPressNode(nodeId: string): Promise<boolean> {
  throw new Error('Not implemented: longPressNode');
}

/**
 * Set the text content of an editable node.
 */
export async function setNodeText(
  nodeId: string,
  text: string,
): Promise<boolean> {
  throw new Error('Not implemented: setNodeText');
}

/**
 * Scroll a scrollable node in the given direction.
 */
export async function scrollNode(
  nodeId: string,
  direction: ScrollDirection,
): Promise<boolean> {
  throw new Error('Not implemented: scrollNode');
}

// ---------------------------------------------------------------------------
// Coordinate-based gestures
// ---------------------------------------------------------------------------

/**
 * Tap at screen coordinates.
 */
export async function tap(x: number, y: number): Promise<boolean> {
  throw new Error('Not implemented: tap');
}

/**
 * Long-press at screen coordinates.
 */
export async function longPress(x: number, y: number): Promise<boolean> {
  throw new Error('Not implemented: longPress');
}

/**
 * Swipe between two screen coordinates.
 */
export async function swipe(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs?: number,
): Promise<boolean> {
  throw new Error('Not implemented: swipe');
}

// ---------------------------------------------------------------------------
// Global actions
// ---------------------------------------------------------------------------

/**
 * Execute a system-level global action (home, back, recents, etc.).
 */
export async function globalAction(action: GlobalAction): Promise<boolean> {
  throw new Error('Not implemented: globalAction');
}

/**
 * Open an app by its Android package name.
 */
export async function openApp(packageName: string): Promise<boolean> {
  throw new Error('Not implemented: openApp');
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

/**
 * Show a floating overlay window with the given configuration.
 */
export async function showOverlay(config: OverlayConfig): Promise<void> {
  throw new Error('Not implemented: showOverlay');
}

/**
 * Hide the floating overlay window.
 */
export async function hideOverlay(): Promise<void> {
  throw new Error('Not implemented: hideOverlay');
}

// ---------------------------------------------------------------------------
// Event streaming
// ---------------------------------------------------------------------------

/**
 * Subscribe to raw accessibility events.
 */
export function onAccessibilityEvent(
  _callback: (event: A11yEvent) => void,
): Subscription {
  throw new Error('Not implemented: onAccessibilityEvent');
}

/**
 * Subscribe to window-change events.
 */
export function onWindowChange(
  _callback: (window: WindowInfo) => void,
): Subscription {
  throw new Error('Not implemented: onWindowChange');
}

// ---------------------------------------------------------------------------
// Service lifecycle
// ---------------------------------------------------------------------------

/**
 * Check whether the AccessibilityService is currently enabled.
 */
export async function isServiceEnabled(): Promise<boolean> {
  throw new Error('Not implemented: isServiceEnabled');
}

/**
 * Prompt the user to enable the AccessibilityService in Android settings.
 */
export async function requestServiceEnable(): Promise<void> {
  throw new Error('Not implemented: requestServiceEnable');
}
