import { getInstalledApps } from '../src/index';
import type { InstalledApp } from '../src/types';

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
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const mockController = require('../src/NativeAccessibilityController').default as {
  getInstalledApps: jest.Mock<Promise<InstalledApp[]>>;
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getInstalledApps', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the list of installed apps from the native module', async () => {
    const apps: InstalledApp[] = [
      { packageName: 'com.android.settings', label: 'Settings' },
      { packageName: 'com.google.android.apps.maps', label: 'Maps' },
    ];
    mockController.getInstalledApps.mockResolvedValue(apps);

    const result = await getInstalledApps();

    expect(mockController.getInstalledApps).toHaveBeenCalledTimes(1);
    expect(result).toEqual(apps);
  });

  it('returns an empty array when no launchable apps are found', async () => {
    mockController.getInstalledApps.mockResolvedValue([]);

    const result = await getInstalledApps();

    expect(result).toEqual([]);
  });

  it('each app has packageName and label strings', async () => {
    mockController.getInstalledApps.mockResolvedValue([
      { packageName: 'com.example.app', label: 'My App' },
    ]);

    const [app] = await getInstalledApps();
    expect(typeof app.packageName).toBe('string');
    expect(typeof app.label).toBe('string');
  });

  it('propagates errors thrown by the native module', async () => {
    mockController.getInstalledApps.mockRejectedValue(
      new Error('ERR_GET_INSTALLED_APPS'),
    );

    await expect(getInstalledApps()).rejects.toThrow('ERR_GET_INSTALLED_APPS');
  });
});
