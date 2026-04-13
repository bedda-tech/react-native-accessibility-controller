package com.beddatech.accessibilitycontroller

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.module.annotations.ReactModule

/**
 * TurboModule entry point for react-native-accessibility-controller.
 *
 * Bridges JavaScript calls to the underlying AccessibilityService via
 * [AccessibilityControllerService]. All methods return Promises that
 * resolve once the native operation completes.
 */
@ReactModule(name = AccessibilityControllerModule.NAME)
class AccessibilityControllerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "AccessibilityController"
    }

    override fun getName(): String = NAME

    // -----------------------------------------------------------------------
    // Screen reading
    // -----------------------------------------------------------------------

    @ReactMethod
    fun getAccessibilityTree(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "getAccessibilityTree is not yet implemented")
    }

    @ReactMethod
    fun getScreenText(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "getScreenText is not yet implemented")
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
        promise.reject("ERR_NOT_IMPLEMENTED", "performAction is not yet implemented")
    }

    @ReactMethod
    fun tapNode(nodeId: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "tapNode is not yet implemented")
    }

    @ReactMethod
    fun longPressNode(nodeId: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "longPressNode is not yet implemented")
    }

    @ReactMethod
    fun setNodeText(nodeId: String, text: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "setNodeText is not yet implemented")
    }

    @ReactMethod
    fun scrollNode(nodeId: String, direction: String, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "scrollNode is not yet implemented")
    }

    // -----------------------------------------------------------------------
    // Coordinate-based gestures
    // -----------------------------------------------------------------------

    @ReactMethod
    fun tap(x: Double, y: Double, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "tap is not yet implemented")
    }

    @ReactMethod
    fun longPress(x: Double, y: Double, promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "longPress is not yet implemented")
    }

    @ReactMethod
    fun swipe(
        startX: Double, startY: Double,
        endX: Double, endY: Double,
        durationMs: Int,
        promise: Promise
    ) {
        promise.reject("ERR_NOT_IMPLEMENTED", "swipe is not yet implemented")
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

    @ReactMethod
    fun isServiceEnabled(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "isServiceEnabled is not yet implemented")
    }

    @ReactMethod
    fun requestServiceEnable(promise: Promise) {
        promise.reject("ERR_NOT_IMPLEMENTED", "requestServiceEnable is not yet implemented")
    }
}
