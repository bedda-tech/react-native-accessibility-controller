package com.beddatech.accessibilitycontroller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.lang.ref.WeakReference

/**
 * Core AccessibilityService implementation.
 *
 * Declared in AndroidManifest.xml and configured via
 * res/xml/accessibility_service_config.xml. When enabled by the user it
 * receives system-wide accessibility events and can inspect / interact with
 * the UI of any foreground app.
 *
 * The singleton [instance] lets [AccessibilityControllerModule] (and future
 * modules like ScreenReader, ActionDispatcher) call into the live service from
 * the React Native bridge thread.
 *
 * Events are streamed to JS via [DeviceEventManagerModule.RCTDeviceEventEmitter]
 * using the shared [reactContextRef] registered by [AccessibilityControllerModule].
 *
 * JS event names:
 *   - [EVENT_A11Y]    -- every raw accessibility event from any foreground app
 *   - [EVENT_WINDOW]  -- window focus / foreground app changes
 */
class AccessibilityControllerService : AccessibilityService() {

    companion object {
        const val EVENT_A11Y = "onAccessibilityEvent"
        const val EVENT_WINDOW = "onWindowChange"

        /** Singleton reference set when the service connects. */
        @Volatile
        var instance: AccessibilityControllerService? = null
            private set

        /**
         * Weak reference to the React context, injected by
         * [AccessibilityControllerModule]. Using WeakReference prevents
         * the service from leaking the Activity/context on reload.
         */
        @Volatile
        var reactContextRef: WeakReference<ReactApplicationContext>? = null
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this

        serviceInfo = serviceInfo.apply {
            // Request all event types so we can stream them to JS.
            eventTypes = AccessibilityEvent.TYPES_ALL_MASK
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = flags or
                AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                AccessibilityServiceInfo.FLAG_RETRIEVE_INTERACTIVE_WINDOWS or
                AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 100
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    // -----------------------------------------------------------------------
    // Event handling
    // -----------------------------------------------------------------------

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        event ?: return
        val context = reactContextRef?.get() ?: return
        if (!context.hasActiveReactInstance()) return

        emitA11yEvent(context, event)

        // Also emit a simplified window-change event for foreground tracking.
        if (event.eventType == AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED ||
            event.eventType == AccessibilityEvent.TYPE_WINDOWS_CHANGED
        ) {
            emitWindowChange(context, event)
        }
    }

    override fun onInterrupt() {
        // Required override. Called when the system wants to interrupt feedback.
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    private fun emitA11yEvent(
        context: ReactApplicationContext,
        event: AccessibilityEvent
    ) {
        val params = Arguments.createMap().apply {
            putString("eventType", AccessibilityEvent.eventTypeToString(event.eventType))
            putString("packageName", event.packageName?.toString() ?: "")
            putString("className", event.className?.toString() ?: "")
            // Flatten the CharSequence list into a single space-separated string.
            val text = event.text?.mapNotNull { it?.toString() }?.joinToString(" ")
            if (text != null) putString("text", text) else putNull("text")
            putDouble("timestamp", event.eventTime.toDouble())
        }
        emit(context, EVENT_A11Y, params)
    }

    private fun emitWindowChange(
        context: ReactApplicationContext,
        event: AccessibilityEvent
    ) {
        val params = Arguments.createMap().apply {
            putString("packageName", event.packageName?.toString() ?: "")
            putString("className", event.className?.toString() ?: "")
            val title = event.text?.mapNotNull { it?.toString() }?.joinToString(" ")
            if (title != null) putString("title", title) else putNull("title")
            putBoolean("isActive", true)
        }
        emit(context, EVENT_WINDOW, params)
    }

    private fun emit(
        context: ReactApplicationContext,
        eventName: String,
        params: com.facebook.react.bridge.WritableMap
    ) {
        context
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
}
