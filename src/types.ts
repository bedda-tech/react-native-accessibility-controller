/**
 * Represents a single node in the accessibility tree.
 */
export interface AccessibilityNode {
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

/**
 * Actions that can be performed on a specific accessibility node.
 */
export type NodeAction =
  | 'click'
  | 'longClick'
  | 'scrollForward'
  | 'scrollBackward'
  | 'setText'
  | 'clearFocus'
  | 'select';

/**
 * System-level global actions.
 */
export type GlobalAction =
  | 'home'
  | 'back'
  | 'recents'
  | 'notifications'
  | 'quickSettings'
  | 'powerDialog';

/**
 * Scroll direction for scrollable nodes.
 */
export type ScrollDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Configuration for the floating overlay window.
 */
export interface OverlayConfig {
  /** Width in density-independent pixels. */
  width?: number;
  /** Height in density-independent pixels. */
  height?: number;
  /** Gravity/position on screen (e.g., 'top-right', 'bottom-center'). */
  gravity?: string;
  /** Whether the overlay should be interactive. */
  touchable?: boolean;
  /** Background color (hex string). */
  backgroundColor?: string;
  /** Initial action text to display. */
  action?: string;
  /** Initial step count to display. */
  stepCount?: number;
}

/**
 * Content update for the agent-status overlay.
 */
export interface OverlayUpdateConfig {
  /** Current action being performed by the agent. */
  action: string;
  /** Current step number in the agent loop. */
  stepCount: number;
}

/**
 * An event emitted by the AccessibilityService.
 */
export interface A11yEvent {
  eventType: string;
  packageName: string;
  className: string;
  text: string | null;
  timestamp: number;
}

/**
 * Information about the currently active window.
 */
export interface WindowInfo {
  packageName: string;
  className: string;
  title: string | null;
  isActive: boolean;
}

/**
 * A subscription handle for event listeners. Call remove() to unsubscribe.
 */
export interface Subscription {
  remove(): void;
}
