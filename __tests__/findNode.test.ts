import { findNode, findAllNodes } from '../src/index';
import type { AccessibilityNode, FindNodeQuery } from '../src/types';

// ---------------------------------------------------------------------------
// Mock react-native (avoids native module resolution in Jest)
// ---------------------------------------------------------------------------

jest.mock('react-native', () => ({
  NativeEventEmitter: jest.fn(() => ({ addListener: jest.fn() })),
  Platform: { OS: 'android' },
}));

// ---------------------------------------------------------------------------
// Mock the native TurboModule — factory uses only jest.fn() (safe to hoist)
// ---------------------------------------------------------------------------

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
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// Retrieve the mock after jest.mock has run so we can configure return values.
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
    children: [],
    availableActions: [],
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('findNode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('text matching', () => {
    it('returns the node whose text contains the query string', async () => {
      const target = makeNode({ nodeId: 'btn-submit', text: 'Submit Form' });
      mockController.getAccessibilityTree.mockResolvedValue([target]);

      const result = await findNode({ text: 'Submit' });

      expect(result).not.toBeNull();
      expect(result?.nodeId).toBe('btn-submit');
    });

    it('returns null when no node text contains the query string', async () => {
      const node = makeNode({ nodeId: 'btn-cancel', text: 'Cancel' });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      const result = await findNode({ text: 'Submit' });

      expect(result).toBeNull();
    });

    it('does not match nodes with null text', async () => {
      const node = makeNode({ nodeId: 'container', text: null });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      const result = await findNode({ text: 'anything' });

      expect(result).toBeNull();
    });

    it('is case-sensitive', async () => {
      const node = makeNode({ nodeId: 'btn', text: 'Submit' });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      const lower = await findNode({ text: 'submit' });
      const upper = await findNode({ text: 'Submit' });

      expect(lower).toBeNull();
      expect(upper?.nodeId).toBe('btn');
    });
  });

  describe('contentDescription matching', () => {
    it('returns the node whose contentDescription contains the query', async () => {
      const target = makeNode({ nodeId: 'icon-settings', contentDescription: 'Settings icon' });
      mockController.getAccessibilityTree.mockResolvedValue([target]);

      const result = await findNode({ contentDescription: 'Settings' });

      expect(result?.nodeId).toBe('icon-settings');
    });

    it('returns null when no contentDescription matches', async () => {
      const node = makeNode({ nodeId: 'n1', contentDescription: 'Back button' });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      const result = await findNode({ contentDescription: 'Settings' });

      expect(result).toBeNull();
    });
  });

  describe('className matching', () => {
    it('returns the first node whose className exactly matches', async () => {
      const other = makeNode({ nodeId: 'n1', className: 'android.widget.View' });
      const target = makeNode({ nodeId: 'n2', className: 'android.widget.EditText' });
      mockController.getAccessibilityTree.mockResolvedValue([other, target]);

      const result = await findNode({ className: 'android.widget.EditText' });

      expect(result?.nodeId).toBe('n2');
    });

    it('requires exact class name (not substring)', async () => {
      const node = makeNode({ nodeId: 'n1', className: 'android.widget.EditText' });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      const result = await findNode({ className: 'EditText' });

      expect(result).toBeNull();
    });
  });

  describe('nested tree search', () => {
    it('finds a node nested deep in the tree', async () => {
      const deep = makeNode({ nodeId: 'deep-btn', text: 'Deep Button', className: 'android.widget.Button' });
      const mid = makeNode({ nodeId: 'mid', children: [deep] });
      const root = makeNode({ nodeId: 'root', children: [mid] });
      mockController.getAccessibilityTree.mockResolvedValue([root]);

      const result = await findNode({ text: 'Deep Button' });

      expect(result?.nodeId).toBe('deep-btn');
    });

    it('returns the first matching node in depth-first order', async () => {
      const first = makeNode({ nodeId: 'first', text: 'Target' });
      const second = makeNode({ nodeId: 'second', text: 'Target' });
      const parent = makeNode({ nodeId: 'parent', children: [first, second] });
      mockController.getAccessibilityTree.mockResolvedValue([parent]);

      const result = await findNode({ text: 'Target' });

      expect(result?.nodeId).toBe('first');
    });

    it('returns null on an empty tree', async () => {
      mockController.getAccessibilityTree.mockResolvedValue([]);

      const result = await findNode({ text: 'anything' });

      expect(result).toBeNull();
    });
  });

  describe('multi-field query (OR logic)', () => {
    it('matches a node that satisfies any one of the query fields', async () => {
      const node = makeNode({ nodeId: 'txt', text: 'Hello', className: 'android.widget.TextView' });
      mockController.getAccessibilityTree.mockResolvedValue([node]);

      // Query specifies both text and className; node matches text but not className.
      const query: FindNodeQuery = { text: 'Hello', className: 'android.widget.Button' };
      const result = await findNode(query);

      expect(result?.nodeId).toBe('txt');
    });
  });
});

// ---------------------------------------------------------------------------
// findAllNodes
// ---------------------------------------------------------------------------

describe('findAllNodes', () => {
  let mockController: { getAccessibilityTree: jest.Mock };

  beforeEach(() => {
    mockController = require('../src/NativeAccessibilityController').default;
    mockController.getAccessibilityTree.mockReset();
  });

  it('returns all nodes whose text contains the query string', async () => {
    const a = makeNode({ nodeId: 'a', text: 'Settings' });
    const b = makeNode({ nodeId: 'b', text: 'Not matching' });
    const c = makeNode({ nodeId: 'c', text: 'Advanced Settings' });
    mockController.getAccessibilityTree.mockResolvedValue([a, b, c]);

    const results = await findAllNodes({ text: 'Settings' });

    expect(results.map(n => n.nodeId)).toEqual(['a', 'c']);
  });

  it('returns an empty array when nothing matches', async () => {
    const node = makeNode({ nodeId: 'n1', text: 'Home' });
    mockController.getAccessibilityTree.mockResolvedValue([node]);

    const results = await findAllNodes({ text: 'Settings' });

    expect(results).toEqual([]);
  });

  it('returns all matching nodes across a nested tree', async () => {
    const btn1 = makeNode({ nodeId: 'btn1', className: 'android.widget.Button' });
    const btn2 = makeNode({ nodeId: 'btn2', className: 'android.widget.Button' });
    const container = makeNode({ nodeId: 'c1', children: [btn1] });
    const root = makeNode({ nodeId: 'root', children: [container, btn2] });
    mockController.getAccessibilityTree.mockResolvedValue([root]);

    const results = await findAllNodes({ className: 'android.widget.Button' });

    expect(results.map(n => n.nodeId)).toEqual(['btn1', 'btn2']);
  });

  it('returns an empty array on an empty tree', async () => {
    mockController.getAccessibilityTree.mockResolvedValue([]);

    const results = await findAllNodes({ text: 'anything' });

    expect(results).toEqual([]);
  });

  it('returns all matches when using contentDescription', async () => {
    const a = makeNode({ nodeId: 'a', contentDescription: 'Close button' });
    const b = makeNode({ nodeId: 'b', contentDescription: 'Back button' });
    const c = makeNode({ nodeId: 'c', contentDescription: 'Menu button' });
    mockController.getAccessibilityTree.mockResolvedValue([a, b, c]);

    const results = await findAllNodes({ contentDescription: 'button' });

    expect(results.map(n => n.nodeId)).toEqual(['a', 'b', 'c']);
  });
});
