package com.beddatech.accessibilitycontroller

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import java.lang.ref.WeakReference

/**
 * TurboModule entry point for react-native-accessibility-controller.
 *
 * Bridges JavaScript calls to the underlying [AccessibilityControllerService].
 * All methods return Promises that resolve once the native operation completes.
 *
 * Event streaming: JS can subscribe via NativeEventEmitter. Two events are
 * emitted by [AccessibilityControllerService]:
 *   - "onAccessibilityEvent" -- raw a11y events from any foreground app
 *   - "onWindowChange"       -- window focus / foreground app change
 */
@ReactModule(name = AccessibilityControllerModule.NAME)
class AccessibilityControllerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AccessibilityController"
    }

    init {
        // Provide the ReactApplicationContext to the service so it can emit
        // events back to JS without a direct dependency on this module.
        AccessibilityControllerService.reactContextRef =
            WeakReference(reactContext)
    }

    override fun getName(): String = NAME

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    /**
     * Rejects [promise] with ERR_SERVICE_DISABLED and returns null if the
     * AccessibilityService is not connected. Returns a non-null unit value
     * otherwise (use as a guard: `requireService(promise) ?: return`).
     */
    private fun requireService(promise: Promise): Unit? {
        return if (AccessibilityControllerService.instance == null) {
            promise.reject("ERR_SERVICE_DISABLED", "AccessibilityService is not enabled")
            null
        } else {
            Unit
        }
    }

    // -----------------------------------------------------------------------
    // NativeEventEmitter plumbing (required by React Native)
    // -----------------------------------------------------------------------

    /** Called when JS adds the first listener for a given event type. */
    @ReactMethod
    fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {
        // No-op: bookkeeping is handled by React Native internals.
    }

    /** Called when JS removes listeners. */
    @ReactMethod
    fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Int) {
        // No-op: bookkeeping is handled by React Native internals.
    }

    // -----------------------------------------------------------------------
    // Screen reading
    // -----------------------------------------------------------------------

    @ReactMethod
    fun getAccessibilityTree(promise: Promise) {
        try {
            if (AccessibilityControllerService.instance == null) {
                promise.reject("ERR_SERVICE_DISABLED", "AccessibilityService is not enabled")
                return
            }
            promise.resolve(ScreenReader.getTree())
        } catch (e: Exception) {
            promise.reject("ERR_GET_TREE", "Failed to capture accessibility tree", e)
        }
    }

    @ReactMethod
    fun getScreenText(promise: Promise) {
        try {
            if (AccessibilityControllerService.instance == null) {
                promise.reject("ERR_SERVICE_DISABLED", "AccessibilityService is not enabled")
                return
            }
            promise.resolve(ScreenReader.getText())
        } catch (e: Exception) {
            promise.reject("ERR_GET_TEXT", "Failed to capture screen text", e)
        }
    }

    @ReactMethod
    fun takeScreenshot(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "takeScreenshot is not yet implemented")
    }

    // -----------------------------------------------------------------------
    // Node actions
    // -----------------------------------------------------------------------

    @ReactMethod
    fun performAction(nodeId: String, action: String, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(ActionDispatcher.performAction(nodeId, action))
        } catch (e: Exception) {
            promise.reject("ERR_PERFORM_ACTION", "performAction failed", e)
        }
    }

    @ReactMethod
    fun tapNode(nodeId: String, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(ActionDispatcher.tapNode(nodeId))
        } catch (e: Exception) {
            promise.reject("ERR_TAP_NODE", "tapNode failed", e)
        }
    }

    @ReactMethod
    fun longPressNode(nodeId: String, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(ActionDispatcher.longPressNode(nodeId))
        } catch (e: Exception) {
            promise.reject("ERR_LONG_PRESS_NODE", "longPressNode failed", e)
        }
    }

    @ReactMethod
    fun setNodeText(nodeId: String, text: String, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(ActionDispatcher.setNodeText(nodeId, text))
        } catch (e: Exception) {
            promise.reject("ERR_SET_NODE_TEXT", "setNodeText failed", e)
        }
    }

    @ReactMethod
    fun scrollNode(nodeId: String, direction: String, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(ActionDispatcher.scrollNode(nodeId, direction))
        } catch (e: Exception) {
            promise.reject("ERR_SCROLL_NODE", "scrollNode failed", e)
        }
    }

    // -----------------------------------------------------------------------
    // Coordinate-based gestures
    // -----------------------------------------------------------------------

    @ReactMethod
    fun tap(x: Double, y: Double, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(GestureDispatcher.tap(x.toFloat(), y.toFloat()))
        } catch (e: Exception) {
            promise.reject("ERR_TAP", "tap failed", e)
        }
    }

    @ReactMethod
    fun longPress(x: Double, y: Double, promise: Promise) {
        try {
            requireService(promise) ?: return
            promise.resolve(GestureDispatcher.longPress(x.toFloat(), y.toFloat()))
        } catch (e: Exception) {
            promise.reject("ERR_LONG_PRESS", "longPress failed", e)
        }
    }

    @ReactMethod
    fun swipe(
        startX: Double, startY: Double,
        endX: Double, endY: Double,
        durationMs: Int,
        promise: Promise
    ) {
        try {
            requireService(promise) ?: return
            promise.resolve(
                GestureDispatcher.swipe(
                    startX.toFloat(), startY.toFloat(),
                    endX.toFloat(), endY.toFloat(),
                    durationMs.toLong(),
                )
            )
        } catch (e: Exception) {
            promise.reject("ERR_SWIPE", "swipe failed", e)
        }
    }

    // -----------------------------------------------------------------------
    // Global actions
    // -----------------------------------------------------------------------

    @ReactMethod
    fun globalAction(action: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "globalAction is not yet implemented")
    }

    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "openApp is not yet implemented")
    }

    // -----------------------------------------------------------------------
    // Overlay
    // -----------------------------------------------------------------------

    @ReactMethod
    fun showOverlay(config: ReadableMap, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "showOverlay is not yet implemented")
    }

    @ReactMethod
    fun hideOverlay(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "hideOverlay is not yet implemented")
    }

    // -----------------------------------------------------------------------
    // Service lifecycle
    // -----------------------------------------------------------------------

    /**
     * Resolves `true` if the AccessibilityControllerService is currently
     * listed in Android's enabled accessibility services.
     */
    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        try {
            val context = reactApplicationContext
            val enabled = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            )
            val component = ComponentName(
                context,
                AccessibilityControllerService::class.java
            ).flattenToString()
            promise.resolve(enabled?.contains(component) == true)
        } catch (e: Exception) {
            promise.reject("ERR_SERVICE_CHECK", "Failed to read accessibility settings", e)
        }
    }

    /**
     * Opens Android's Accessibility Settings screen so the user can enable
     * the service manually (required by OS policy).
     */
    @ReactMethod
    fun requestServiceEnable(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
            promise.resolve(null)
        } catch (e: Exception) {
            promise.reject("ERR_SETTINGS_OPEN", "Failed to open accessibility settings", e)
        }
    }
}
