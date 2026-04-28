import {
  performAction,
  tapNode,
  longPressNode,
  setNodeText,
  scrollNode,
  tap,
  longPress,
  swipe,
  globalAction,
  openApp,
  isServiceEnabled,
  canDrawOverlays,
  takeScreenshot,
  showOverlay,
  updateOverlay,
  hideOverlay,
  onAccessibilityEvent,
  onWindowChange,
  onOverlayStop,
} from '../src/index';

// ---------------------------------------------------------------------------
// Mock react-native
// ---------------------------------------------------------------------------

jest.mock('react-native', () => ({
  NativeEventEmitter: jest.fn(() => ({ addListener: jest.fn() })),
  Platform: { OS: 'android' },
}));

// ---------------------------------------------------------------------------
// Mock the native TurboModule
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
    requestOverlayPermission: jest.fn(),
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const native = require('../src/NativeAccessibilityController').default as Record<string, jest.Mock>;

// Capture the addListener mock from the emitter created when src/index.ts loaded.
// Must be captured in beforeAll before clearAllMocks() wipes NativeEventEmitter.mock.results.
let addListenerMock: jest.Mock;
beforeAll(() => {
  const MockNE = jest.requireMock('react-native').NativeEventEmitter as jest.Mock;
  addListenerMock = MockNE.mock.results[0].value.addListener;
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// performAction — includes the new clearText and imeEnter action types
// ---------------------------------------------------------------------------

describe('performAction', () => {
  it('delegates clearText action to native', async () => {
    native.performAction.mockResolvedValue(true);
    const result = await performAction('node-1', 'clearText');
    expect(native.performAction).toHaveBeenCalledWith('node-1', 'clearText');
    expect(result).toBe(true);
  });

  it('delegates imeEnter action to native', async () => {
    native.performAction.mockResolvedValue(true);
    const result = await performAction('node-1', 'imeEnter');
    expect(native.performAction).toHaveBeenCalledWith('node-1', 'imeEnter');
    expect(result).toBe(true);
  });

  it('propagates false result from native', async () => {
    native.performAction.mockResolvedValue(false);
    const result = await performAction('node-42', 'click');
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Node action convenience wrappers
// ---------------------------------------------------------------------------

describe('tapNode', () => {
  it('calls native tapNode with nodeId', async () => {
    native.tapNode.mockResolvedValue(true);
    await tapNode('btn-1');
    expect(native.tapNode).toHaveBeenCalledWith('btn-1');
  });
});

describe('longPressNode', () => {
  it('calls native longPressNode with nodeId', async () => {
    native.longPressNode.mockResolvedValue(true);
    await longPressNode('btn-2');
    expect(native.longPressNode).toHaveBeenCalledWith('btn-2');
  });
});

describe('setNodeText', () => {
  it('calls native setNodeText with nodeId and text', async () => {
    native.setNodeText.mockResolvedValue(true);
    await setNodeText('input-1', 'hello world');
    expect(native.setNodeText).toHaveBeenCalledWith('input-1', 'hello world');
  });
});

describe('scrollNode', () => {
  it('calls native scrollNode with nodeId and direction', async () => {
    native.scrollNode.mockResolvedValue(true);
    await scrollNode('list-1', 'down');
    expect(native.scrollNode).toHaveBeenCalledWith('list-1', 'down');
  });
});

// ---------------------------------------------------------------------------
// Coordinate-based gestures
// ---------------------------------------------------------------------------

describe('tap', () => {
  it('calls native tap with x and y coordinates', async () => {
    native.tap.mockResolvedValue(true);
    await tap(100, 200);
    expect(native.tap).toHaveBeenCalledWith(100, 200);
  });
});

describe('longPress', () => {
  it('calls native longPress with x and y coordinates', async () => {
    native.longPress.mockResolvedValue(true);
    await longPress(50, 75);
    expect(native.longPress).toHaveBeenCalledWith(50, 75);
  });
});

describe('swipe', () => {
  it('uses default durationMs of 300 when not specified', async () => {
    native.swipe.mockResolvedValue(true);
    await swipe(0, 500, 0, 100);
    expect(native.swipe).toHaveBeenCalledWith(0, 500, 0, 100, 300);
  });

  it('passes explicit durationMs through to native', async () => {
    native.swipe.mockResolvedValue(true);
    await swipe(0, 500, 0, 100, 600);
    expect(native.swipe).toHaveBeenCalledWith(0, 500, 0, 100, 600);
  });
});

// ---------------------------------------------------------------------------
// Global actions
// ---------------------------------------------------------------------------

describe('globalAction', () => {
  it('delegates home action to native', async () => {
    native.globalAction.mockResolvedValue(true);
    await globalAction('home');
    expect(native.globalAction).toHaveBeenCalledWith('home');
  });

  it('delegates back action to native', async () => {
    native.globalAction.mockResolvedValue(true);
    await globalAction('back');
    expect(native.globalAction).toHaveBeenCalledWith('back');
  });
});

describe('openApp', () => {
  it('calls native openApp with package name', async () => {
    native.openApp.mockResolvedValue(true);
    await openApp('com.android.settings');
    expect(native.openApp).toHaveBeenCalledWith('com.android.settings');
  });
});

// ---------------------------------------------------------------------------
// Service lifecycle
// ---------------------------------------------------------------------------

describe('isServiceEnabled', () => {
  it('returns true when native reports enabled', async () => {
    native.isServiceEnabled.mockResolvedValue(true);
    const result = await isServiceEnabled();
    expect(result).toBe(true);
  });

  it('returns false when native reports disabled', async () => {
    native.isServiceEnabled.mockResolvedValue(false);
    const result = await isServiceEnabled();
    expect(result).toBe(false);
  });
});

describe('canDrawOverlays', () => {
  it('delegates to native on Android', async () => {
    native.canDrawOverlays.mockResolvedValue(true);
    const result = await canDrawOverlays();
    expect(native.canDrawOverlays).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('returns false when overlay permission is not granted', async () => {
    native.canDrawOverlays.mockResolvedValue(false);
    const result = await canDrawOverlays();
    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Event subscriptions (Android path — emitter is non-null)
// ---------------------------------------------------------------------------

describe('onAccessibilityEvent', () => {
  it('calls emitter.addListener with onAccessibilityEvent', () => {
    const mockRemove = jest.fn();
    addListenerMock.mockReturnValue({ remove: mockRemove });

    const callback = jest.fn();
    const sub = onAccessibilityEvent(callback);

    expect(addListenerMock).toHaveBeenCalledWith('onAccessibilityEvent', callback);
    expect(sub).toHaveProperty('remove');
  });

  it('returned subscription remove() calls underlying remove', () => {
    const mockRemove = jest.fn();
    addListenerMock.mockReturnValue({ remove: mockRemove });

    const sub = onAccessibilityEvent(jest.fn());
    sub.remove();

    expect(mockRemove).toHaveBeenCalledTimes(1);
  });
});

describe('onWindowChange', () => {
  it('calls emitter.addListener with onWindowChange', () => {
    const mockRemove = jest.fn();
    addListenerMock.mockReturnValue({ remove: mockRemove });

    const callback = jest.fn();
    const sub = onWindowChange(callback);

    expect(addListenerMock).toHaveBeenCalledWith('onWindowChange', callback);
    expect(sub).toHaveProperty('remove');
  });
});

describe('onOverlayStop', () => {
  it('calls emitter.addListener with onOverlayStop', () => {
    const mockRemove = jest.fn();
    addListenerMock.mockReturnValue({ remove: mockRemove });

    const sub = onOverlayStop(jest.fn());

    expect(addListenerMock).toHaveBeenCalledWith('onOverlayStop', expect.any(Function));
    expect(sub).toHaveProperty('remove');
  });
});

// ---------------------------------------------------------------------------
// takeScreenshot
// ---------------------------------------------------------------------------

describe('takeScreenshot', () => {
  it('delegates to native takeScreenshot and returns the path', async () => {
    native.takeScreenshot.mockResolvedValue('/data/local/tmp/screen.png');

    const result = await takeScreenshot();

    expect(native.takeScreenshot).toHaveBeenCalledTimes(1);
    expect(result).toBe('/data/local/tmp/screen.png');
  });

  it('propagates rejection from native', async () => {
    native.takeScreenshot.mockRejectedValue(new Error('capture failed'));

    await expect(takeScreenshot()).rejects.toThrow('capture failed');
  });
});

// ---------------------------------------------------------------------------
// showOverlay
// ---------------------------------------------------------------------------

describe('showOverlay', () => {
  it('delegates to native showOverlay with the provided config', async () => {
    native.showOverlay.mockResolvedValue(undefined);

    await showOverlay({ gravity: 'top-right', action: 'Working…', stepCount: 0 });

    expect(native.showOverlay).toHaveBeenCalledWith({
      gravity: 'top-right',
      action: 'Working…',
      stepCount: 0,
    });
  });

  it('propagates rejection from native', async () => {
    native.showOverlay.mockRejectedValue(new Error('overlay permission denied'));

    await expect(showOverlay({ gravity: 'top-right' })).rejects.toThrow('overlay permission denied');
  });
});

// ---------------------------------------------------------------------------
// updateOverlay
// ---------------------------------------------------------------------------

describe('updateOverlay', () => {
  it('delegates to native updateOverlay with action and stepCount', async () => {
    native.updateOverlay.mockResolvedValue(undefined);

    await updateOverlay({ action: 'Tapping Settings', stepCount: 3 });

    expect(native.updateOverlay).toHaveBeenCalledWith({
      action: 'Tapping Settings',
      stepCount: 3,
    });
  });
});

// ---------------------------------------------------------------------------
// hideOverlay
// ---------------------------------------------------------------------------

describe('hideOverlay', () => {
  it('delegates to native hideOverlay', async () => {
    native.hideOverlay.mockResolvedValue(undefined);

    await hideOverlay();

    expect(native.hideOverlay).toHaveBeenCalledTimes(1);
  });

  it('propagates rejection from native', async () => {
    native.hideOverlay.mockRejectedValue(new Error('not shown'));

    await expect(hideOverlay()).rejects.toThrow('not shown');
  });
});
