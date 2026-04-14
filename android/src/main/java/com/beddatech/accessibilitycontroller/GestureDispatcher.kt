package com.beddatech.accessibilitycontroller

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Dispatches coordinate-based touch gestures (tap, long-press, swipe) via
 * [AccessibilityService.dispatchGesture] and the [GestureDescription] API.
 *
 * This approach works on any app — even those without accessibility labels —
 * because it synthesises touch events at raw screen coordinates.
 *
 * Requires API 24+; minSdkVersion 26 is enforced in build.gradle so all
 * GestureDescription API is unconditionally available.
 *
 * All public functions block until the gesture completes or the timeout
 * expires, then return true on success and false on cancellation/timeout.
 */
object GestureDispatcher {

    private const val TAP_DURATION_MS        = 50L
    private const val LONG_PRESS_DURATION_MS = 1_000L
    private const val GESTURE_TIMEOUT_MS     = 5_000L

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Simulate a tap (brief press-and-release) at screen coordinates [x], [y].
     */
    fun tap(x: Float, y: Float): Boolean {
        val path = Path().apply { moveTo(x, y) }
        return dispatchGesture(
            GestureDescription.StrokeDescription(path, 0, TAP_DURATION_MS)
        )
    }

    /**
     * Simulate a long-press at screen coordinates [x], [y].
     *
     * A 1-second hold reliably triggers the long-press threshold across all
     * Android versions and OEM customisations.
     */
    fun longPress(x: Float, y: Float): Boolean {
        val path = Path().apply { moveTo(x, y) }
        return dispatchGesture(
            GestureDescription.StrokeDescription(path, 0, LONG_PRESS_DURATION_MS)
        )
    }

    /**
     * Simulate a swipe from ([startX], [startY]) to ([endX], [endY]) over
     * [durationMs] milliseconds.
     *
     * Typical values: 200–500 ms for a smooth swipe. A value of 0 is clamped
     * to 1 ms so [GestureDescription.StrokeDescription] does not throw.
     */
    fun swipe(
        startX: Float, startY: Float,
        endX: Float, endY: Float,
        durationMs: Long,
    ): Boolean {
        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        return dispatchGesture(
            GestureDescription.StrokeDescription(path, 0, durationMs.coerceAtLeast(1L))
        )
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /**
     * Build a [GestureDescription] from [stroke], dispatch it on the live
     * accessibility service, and block until the gesture completes or the
     * timeout elapses.
     *
     * Returns true only when [GestureResultCallback.onCompleted] fires within
     * the timeout; cancellation, immediate rejection, or timeout returns false.
     */
    private fun dispatchGesture(stroke: GestureDescription.StrokeDescription): Boolean {
        val service = AccessibilityControllerService.instance ?: return false

        val gesture = GestureDescription.Builder()
            .addStroke(stroke)
            .build()

        val latch   = CountDownLatch(1)
        var success = false

        val accepted = service.dispatchGesture(
            gesture,
            object : AccessibilityService.GestureResultCallback() {
                override fun onCompleted(gestureDescription: GestureDescription) {
                    success = true
                    latch.countDown()
                }
                override fun onCancelled(gestureDescription: GestureDescription) {
                    latch.countDown()           // success stays false
                }
            },
            null,                              // run callback on service's main handler
        )

        if (!accepted) return false            // service rejected the gesture outright
        latch.await(GESTURE_TIMEOUT_MS, TimeUnit.MILLISECONDS)
        return success
    }
}
