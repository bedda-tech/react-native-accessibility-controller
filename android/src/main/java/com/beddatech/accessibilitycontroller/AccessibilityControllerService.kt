package com.beddatech.accessibilitycontroller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.view.accessibility.AccessibilityEvent

/**
 * Core AccessibilityService implementation.
 *
 * This service is declared in AndroidManifest.xml and configured via
 * res/xml/accessibility_service_config.xml. When enabled by the user it
 * receives system-wide accessibility events and can inspect / interact with
 * the UI of any foreground app.
 *
 * The service instance is stored in [instance] so that
 * [AccessibilityControllerModule] can call into it from the React Native
 * bridge thread.
 */
class AccessibilityControllerService : AccessibilityService() {

    companion object {
        /** Singleton reference set in [onServiceConnected]. */
        @Volatile
        var instance: AccessibilityControllerService? = null
            private set
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
        // TODO: Forward events to JS via EventEmitter
    }

    override fun onInterrupt() {
        // Required override. Called when the system wants to interrupt feedback.
    }
}
