import { waitForNode } from '../src/index';
import type { AccessibilityNode } from '../src/types';

// ---------------------------------------------------------------------------
// Mock react-native
// ---------------------------------------------------------------------------

jest.mock('react-native', () => ({
  NativeEventEmitter: jest.fn(() => ({ addListener: jest.fn() })),
  Platform: { OS: 'android' },
}));

jest.mock('../src/NativeAccessibilityController', () => ({
  __esModule: true,
  default: {
    getAccessibilityTree: jest.fn(),
    getScreenText: jest.fn(),
    takeScreenshot: jest.fn(),
    performAction: jest.fn(),
    tapNode: jest.fn(),
    longPressNode: jest.fn(),
    setNodeText: jest.fn(),
    scrollNode: jest.fn(),
    tap: jest.fn(),
    longPress: jest.fn(),
    swipe: jest.fn(),
    globalAction: jest.fn(),
    openApp: jest.fn(),
    getInstalledApps: jest.fn(),
    showOverlay: jest.fn(),
    updateOverlay: jest.fn(),
    hideOverlay: jest.fn(),
    isServiceEnabled: jest.fn(),
    requestServiceEnable: jest.fn(),
    canDrawOverlays: jest.fn(),
    requestOverlayPermission: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockController = require('../src/NativeAccessibilityController').default as {
  getAccessibilityTree: jest.Mock<Promise<AccessibilityNode[]>>;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(partial: Partial<AccessibilityNode> & { nodeId: string }): AccessibilityNode {
  return {
    className: 'android.widget.View',
    text: null,
    contentDescription: null,
    bounds: { left: 0, top: 0, right: 100, bottom: 50 },
    isClickable: false,
    isScrollable: false,
    isEditable: false,
    isFocused: false,
    isChecked: false,
    isEnabled: true,
    children: [],
    availableActions: [],
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.useFakeTimers();
  mockController.getAccessibilityTree.mockReset();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('waitForNode', () => {
  it('returns the node immediately if it is present on the first poll', async () => {
    const target = makeNode({ nodeId: 'n1', text: 'Submit' });
    mockController.getAccessibilityTree.mockResolvedValue([target]);

    const promise = waitForNode({ text: 'Submit' });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(target);
    expect(mockController.getAccessibilityTree).toHaveBeenCalledTimes(1);
  });

  it('polls until the node appears and then resolves', async () => {
    const target = makeNode({ nodeId: 'n2', text: 'Done' });
    // First two calls return empty, third returns the node
    mockController.getAccessibilityTree
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue([target]);

    const promise = waitForNode({ text: 'Done' }, { timeoutMs: 5000, pollIntervalMs: 100 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(target);
    expect(mockController.getAccessibilityTree).toHaveBeenCalledTimes(3);
  });

  it('throws a TimeoutError when the node never appears', async () => {
    mockController.getAccessibilityTree.mockResolvedValue([]);

    const promise = waitForNode({ text: 'Missing' }, { timeoutMs: 500, pollIntervalMs: 100 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({
      name: 'TimeoutError',
      message: expect.stringContaining('500ms'),
    });
  });

  it('finds a node deep in the tree', async () => {
    const deep = makeNode({ nodeId: 'deep', text: 'Nested' });
    const parent = makeNode({ nodeId: 'parent', children: [deep] });
    mockController.getAccessibilityTree.mockResolvedValue([parent]);

    const promise = waitForNode({ text: 'Nested' });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.nodeId).toBe('deep');
  });

  it('uses default timeoutMs of 10000 and pollIntervalMs of 500', async () => {
    mockController.getAccessibilityTree.mockResolvedValue([]);

    const promise = waitForNode({ text: 'Never' });
    // Advance 9500ms — should still be pending
    jest.advanceTimersByTime(9500);
    // Drain microtasks
    await Promise.resolve();
    // Advance past the 10000ms deadline
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('resolves with the correct node when multiple nodes are present', async () => {
    const a = makeNode({ nodeId: 'a', text: 'Cancel' });
    const b = makeNode({ nodeId: 'b', text: 'Submit' });
    mockController.getAccessibilityTree.mockResolvedValue([a, b]);

    const promise = waitForNode({ text: 'Submit' });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.nodeId).toBe('b');
  });
});
