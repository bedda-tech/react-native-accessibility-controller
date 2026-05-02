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
  mockController.getAccessibilityTree.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('waitForNode', () => {
  it('returns the node immediately when found on the first poll', async () => {
    const target = makeNode({ nodeId: 'n1', text: 'Submit' });
    mockController.getAccessibilityTree.mockResolvedValue([target]);

    const result = await waitForNode({ text: 'Submit' }, { timeoutMs: 5000, pollIntervalMs: 0 });

    expect(result).toBe(target);
    expect(mockController.getAccessibilityTree).toHaveBeenCalledTimes(1);
  });

  it('polls until the node appears and then resolves', async () => {
    const target = makeNode({ nodeId: 'n2', text: 'Done' });
    mockController.getAccessibilityTree
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValue([target]);

    const result = await waitForNode({ text: 'Done' }, { timeoutMs: 5000, pollIntervalMs: 0 });

    expect(result).toBe(target);
    expect(mockController.getAccessibilityTree).toHaveBeenCalledTimes(3);
  });

  it('throws a TimeoutError when the deadline has already passed on entry', async () => {
    // Simulate time advancing past the deadline before the loop body runs.
    // Call 0: returns startTime for deadline calculation.
    // Call 1+: returns a time well past the deadline so the while condition is false.
    let call = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => (call++ === 0 ? 1000 : 2000));

    mockController.getAccessibilityTree.mockResolvedValue([]);

    await expect(
      waitForNode({ text: 'Missing' }, { timeoutMs: 100, pollIntervalMs: 0 }),
    ).rejects.toMatchObject({
      name: 'TimeoutError',
      message: expect.stringContaining('100ms'),
    });
  });

  it('throws a TimeoutError when the node never appears within the timeout', async () => {
    // Call 0: startTime=1000, deadline=1100.
    // Call 1: Date.now()=1050 (< deadline, enters loop).
    // Call 2: Date.now()=1100 (remaining=0, breaks).
    const times = [1000, 1050, 1100];
    let call = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => times[Math.min(call++, times.length - 1)]);

    mockController.getAccessibilityTree.mockResolvedValue([]);

    await expect(
      waitForNode({ text: 'Never' }, { timeoutMs: 100, pollIntervalMs: 0 }),
    ).rejects.toMatchObject({ name: 'TimeoutError' });
  });

  it('finds a node deep in the accessibility tree', async () => {
    const deep = makeNode({ nodeId: 'deep', text: 'Nested' });
    const parent = makeNode({ nodeId: 'parent', children: [deep] });
    mockController.getAccessibilityTree.mockResolvedValue([parent]);

    const result = await waitForNode({ text: 'Nested' }, { timeoutMs: 5000, pollIntervalMs: 0 });

    expect(result.nodeId).toBe('deep');
  });

  it('returns the first matching node when multiple nodes are present', async () => {
    const a = makeNode({ nodeId: 'a', text: 'Cancel' });
    const b = makeNode({ nodeId: 'b', text: 'Submit' });
    mockController.getAccessibilityTree.mockResolvedValue([a, b]);

    const result = await waitForNode({ text: 'Submit' }, { timeoutMs: 5000, pollIntervalMs: 0 });

    expect(result.nodeId).toBe('b');
  });
});
