package com.beddatech.accessibilitycontroller

import android.accessibilityservice.AccessibilityService
import android.annotation.SuppressLint
import android.content.ComponentName
import android.content.Intent
import android.graphics.Bitmap
import android.os.Build
import android.provider.Settings
import android.util.Base64
import androidx.annotation.RequiresApi
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.ByteArrayOutputStream
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

        // Wire the overlay stop button to emit an "onOverlayStop" event to JS.
        OverlayManager.onStopRequested = {
            try {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onOverlayStop", Arguments.createMap())
            } catch (_: Exception) {}
        }
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

    @SuppressLint("NewApi")   // guarded by the API-level check below
    @ReactMethod
    fun takeScreenshot(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            promise.reject(
                "ERR_API_LEVEL",
                "takeScreenshot requires Android 11 (API 30) or higher"
            )
            return
        }
        requireService(promise) ?: return
        captureScreenshotApi30(promise)
    }

    @RequiresApi(Build.VERSION_CODES.R)
    private fun captureScreenshotApi30(promise: Promise) {
        try {
            val service = AccessibilityControllerService.instance
                ?: return promise.reject("ERR_SERVICE_DISABLED", "AccessibilityService is not enabled")
            service.takeScreenshot(
                0,   // Display.DEFAULT_DISPLAY
                reactApplicationContext.mainExecutor,
                object : AccessibilityService.TakeScreenshotCallback {
                    override fun onSuccess(screenshot: AccessibilityService.ScreenCapture) {
                        try {
                            val hwBitmap  = screenshot.hardwareBitmap
                            val swBitmap  = hwBitmap.copy(Bitmap.Config.ARGB_8888, false)
                            val baos      = ByteArrayOutputStream()
                            swBitmap.compress(Bitmap.CompressFormat.PNG, 100, baos)
                            val base64    = Base64.encodeToString(baos.toByteArray(), Base64.NO_WRAP)
                            swBitmap.recycle()
                            screenshot.close()
                            promise.resolve(base64)
                        } catch (e: Exception) {
                            promise.reject("ERR_SCREENSHOT_ENCODE", "Failed to encode screenshot", e)
                        }
                    }
                    override fun onFailure(errorCode: Int) {
                        promise.reject(
                            "ERR_SCREENSHOT_FAILED",
                            "Screenshot capture failed: errorCode=$errorCode"
                        )
                    }
                }
            )
        } catch (e: Exception) {
            promise.reject("ERR_SCREENSHOT", "takeScreenshot failed", e)
        }
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
        try {
            requireService(promise) ?: return
            val service = AccessibilityControllerService.instance!!
            val actionId = when (action) {
                "home"          -> AccessibilityService.GLOBAL_ACTION_HOME
                "back"          -> AccessibilityService.GLOBAL_ACTION_BACK
                "recents"       -> AccessibilityService.GLOBAL_ACTION_RECENTS
                "notifications" -> AccessibilityService.GLOBAL_ACTION_NOTIFICATIONS
                "quickSettings" -> AccessibilityService.GLOBAL_ACTION_QUICK_SETTINGS
                "powerDialog"   -> AccessibilityService.GLOBAL_ACTION_POWER_DIALOG
                else -> {
                    promise.reject("ERR_UNKNOWN_ACTION", "Unknown global action: $action")
                    return
                }
            }
            promise.resolve(service.performGlobalAction(actionId))
        } catch (e: Exception) {
            promise.reject("ERR_GLOBAL_ACTION", "globalAction failed", e)
        }
    }

    @ReactMethod
    fun openApp(packageName: String, promise: Promise) {
        try {
            val intent = reactApplicationContext.packageManager
                .getLaunchIntentForPackage(packageName)
            if (intent == null) {
                promise.resolve(false)
                return
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_APP", "openApp failed", e)
        }
    }

    // -----------------------------------------------------------------------
    // Overlay
    // -----------------------------------------------------------------------

    @ReactMethod
    fun showOverlay(config: ReadableMap, promise: Promise) {
        OverlayManager.show(reactApplicationContext, config) { error ->
            if (error == null) promise.resolve(null)
            else promise.reject("ERR_OVERLAY_SHOW", error)
        }
    }

    @ReactMethod
    fun hideOverlay(promise: Promise) {
        OverlayManager.hide { error ->
            if (error == null) promise.resolve(null)
            else promise.reject("ERR_OVERLAY_HIDE", error)
        }
    }

    /**
     * Update the content of the existing overlay (action text + step count).
     * No-op if no overlay is currently shown.
     *
     * Config keys:
     *   - action    (string) – current action text
     *   - stepCount (number) – current step number
     */
    @ReactMethod
    fun updateOverlay(config: ReadableMap, promise: Promise) {
        val action = if (config.hasKey("action"))    config.getString("action")            ?: "" else ""
        val step   = if (config.hasKey("stepCount")) config.getDouble("stepCount").toInt()       else 0
        OverlayManager.update(action, step) { error ->
            if (error == null) promise.resolve(null)
            else promise.reject("ERR_OVERLAY_UPDATE", error)
        }
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
