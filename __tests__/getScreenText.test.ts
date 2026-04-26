import { getScreenText } from '../src/index';

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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockController = require('../src/NativeAccessibilityController').default as {
  getScreenText: jest.Mock<Promise<string>>;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getScreenText', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the serialised screen text from the native module', async () => {
    mockController.getScreenText.mockResolvedValue('Button: Submit\nText: Hello world');

    const result = await getScreenText();

    expect(mockController.getScreenText).toHaveBeenCalledTimes(1);
    expect(result).toBe('Button: Submit\nText: Hello world');
  });

  it('returns an empty string when the screen has no elements', async () => {
    mockController.getScreenText.mockResolvedValue('');

    const result = await getScreenText();

    expect(result).toBe('');
  });

  it('propagates errors thrown by the native module', async () => {
    mockController.getScreenText.mockRejectedValue(new Error('Service not enabled'));

    await expect(getScreenText()).rejects.toThrow('Service not enabled');
  });
});
