/**
 * React hooks for react-native-accessibility-controller.
 *
 * These hooks handle lifecycle management (cleanup on unmount, polling
 * teardown) so callers don't have to wire subscriptions manually.
 *
 * Imports are done directly from the native module (not from ./index) to
 * avoid a circular dependency.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { NativeEventEmitter, Platform } from 'react-native';
import NativeAccessibilityController from './NativeAccessibilityController';
import type { AccessibilityNode, A11yEvent, WindowInfo } from './types';

// ---------------------------------------------------------------------------
// Internal emitter (shared with index.ts subscribers)
// ---------------------------------------------------------------------------

const emitter =
  Platform.OS === 'android'
    ? new NativeEventEmitter(NativeAccessibilityController)
    : null;

// ---------------------------------------------------------------------------
// useAccessibilityTree
// ---------------------------------------------------------------------------

export interface UseAccessibilityTreeOptions {
  /**
   * Automatically poll the tree every `pollIntervalMs` milliseconds.
   * Pass `undefined` (default) to disable automatic polling — you can
   * still refresh manually via the returned `refresh()` callback.
   */
  pollIntervalMs?: number;
  /**
   * Fetch the tree immediately on mount (default: true).
   */
  fetchOnMount?: boolean;
}

export interface UseAccessibilityTreeResult {
  tree: AccessibilityNode[] | null;
  loading: boolean;
  error: Error | null;
  /** Manually trigger a fresh fetch. */
  refresh: () => void;
}

/**
 * Fetches and optionally polls the accessibility tree of the current screen.
 *
 * ```tsx
 * const { tree, loading, error, refresh } = useAccessibilityTree({
 *   pollIntervalMs: 1000,
 * });
 * ```
 */
export function useAccessibilityTree(
  options: UseAccessibilityTreeOptions = {},
): UseAccessibilityTreeResult {
  const { pollIntervalMs, fetchOnMount = true } = options;

  const [tree, setTree] = useState<AccessibilityNode[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);

  const fetchTree = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = (await NativeAccessibilityController.getAccessibilityTree()) as AccessibilityNode[];
      if (isMounted.current) setTree(result);
    } catch (e) {
      if (isMounted.current) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (fetchOnMount) {
      fetchTree();
    }

    if (pollIntervalMs != null && pollIntervalMs > 0) {
      const id = setInterval(fetchTree, pollIntervalMs);
      return () => {
        isMounted.current = false;
        clearInterval(id);
      };
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchOnMount, fetchTree, pollIntervalMs]);

  return { tree, loading, error, refresh: fetchTree };
}

// ---------------------------------------------------------------------------
// useAccessibilityEvents
// ---------------------------------------------------------------------------

export interface UseAccessibilityEventsOptions {
  /**
   * Maximum number of events to keep in the buffer (default: 50).
   * Oldest events are dropped when the buffer is full.
   */
  maxEvents?: number;
}

/**
 * Subscribes to raw accessibility events and returns a rolling buffer.
 *
 * ```tsx
 * const events = useAccessibilityEvents({ maxEvents: 20 });
 * ```
 */
export function useAccessibilityEvents(
  options: UseAccessibilityEventsOptions = {},
): A11yEvent[] {
  const { maxEvents = 50 } = options;
  const [events, setEvents] = useState<A11yEvent[]>([]);

  useEffect(() => {
    if (!emitter) return;
    const sub = emitter.addListener('onAccessibilityEvent', (event: A11yEvent) => {
      setEvents((prev) => {
        const next = [event, ...prev];
        return next.length > maxEvents ? next.slice(0, maxEvents) : next;
      });
    });
    return () => sub.remove();
  }, [maxEvents]);

  return events;
}

// ---------------------------------------------------------------------------
// useWindowChange
// ---------------------------------------------------------------------------

/**
 * Subscribes to window-change events and returns the latest active window.
 *
 * ```tsx
 * const win = useWindowChange();
 * console.log(win?.packageName); // "com.example.app"
 * ```
 */
export function useWindowChange(): WindowInfo | null {
  const [win, setWin] = useState<WindowInfo | null>(null);

  useEffect(() => {
    if (!emitter) return;
    const sub = emitter.addListener('onWindowChange', (info: WindowInfo) =>
      setWin(info),
    );
    return () => sub.remove();
  }, []);

  return win;
}
