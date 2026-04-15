package com.beddatech.accessibilitycontroller

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import com.facebook.react.bridge.ReadableMap

/**
 * Manages a single SYSTEM_ALERT_WINDOW overlay drawn on top of all apps.
 *
 * The overlay is a plain [View] whose background colour, size, and gravity
 * are set by the JS caller. The host app must hold the
 * `SYSTEM_ALERT_WINDOW` permission (requested at runtime via
 * `Settings.ACTION_MANAGE_OVERLAY_PERMISSION`).
 *
 * All WindowManager operations are dispatched on the main thread.
 */
object OverlayManager {

    private val mainHandler = Handler(Looper.getMainLooper())

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null

    /**
     * Returns `true` when the overlay permission has been granted.
     * On Android 6+ (M) this requires the user to explicitly allow it in
     * Settings.  On older versions it is granted automatically.
     */
    fun canDrawOverlays(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true
        }
    }

    /**
     * Shows the overlay window with the given [config].
     *
     * Config keys (all optional except width/height):
     *  - width  (number, dp)
     *  - height (number, dp)
     *  - gravity (string: "top-right" | "top-left" | "top-center" |
     *             "bottom-right" | "bottom-left" | "bottom-center" | "center")
     *  - touchable (boolean, default false)
     *  - backgroundColor (string, hex colour like "#FF0000", default transparent)
     *
     * Must be called from any thread; dispatches to the main thread internally.
     */
    fun show(context: Context, config: ReadableMap, onResult: (error: String?) -> Unit) {
        if (!canDrawOverlays(context)) {
            onResult("SYSTEM_ALERT_WINDOW permission not granted")
            return
        }

        val widthDp   = if (config.hasKey("width"))           config.getDouble("width").toFloat()        else 200f
        val heightDp  = if (config.hasKey("height"))          config.getDouble("height").toFloat()       else 100f
        val gravityStr = if (config.hasKey("gravity"))        config.getString("gravity") ?: "top-right" else "top-right"
        val touchable  = if (config.hasKey("touchable"))      config.getBoolean("touchable")             else false
        val bgHex      = if (config.hasKey("backgroundColor")) config.getString("backgroundColor")       else null

        mainHandler.post {
            try {
                val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
                val density  = context.resources.displayMetrics.density
                val widthPx  = (widthDp  * density).toInt()
                val heightPx = (heightDp * density).toInt()

                val windowType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                var flags = (WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        or WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN)
                if (!touchable) {
                    flags = flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                }

                val params = WindowManager.LayoutParams(
                    widthPx,
                    heightPx,
                    windowType,
                    flags,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = parseGravity(gravityStr)
                }

                val bgColor = try {
                    if (bgHex != null) Color.parseColor(bgHex) else Color.TRANSPARENT
                } catch (_: IllegalArgumentException) {
                    Color.TRANSPARENT
                }

                val view = View(context).apply { setBackgroundColor(bgColor) }

                // Remove any existing overlay before adding a new one
                removeExisting(wm)

                wm.addView(view, params)
                overlayView    = view
                windowManager  = wm
                onResult(null)
            } catch (e: Exception) {
                onResult(e.message ?: "showOverlay failed")
            }
        }
    }

    /**
     * Removes the overlay window if one is currently shown.
     * Must be called from any thread; dispatches to the main thread.
     */
    fun hide(onResult: (error: String?) -> Unit) {
        mainHandler.post {
            try {
                removeExisting(windowManager)
                onResult(null)
            } catch (e: Exception) {
                onResult(e.message ?: "hideOverlay failed")
            }
        }
    }

    private fun removeExisting(wm: WindowManager?) {
        val view = overlayView ?: return
        try {
            (wm ?: windowManager)?.removeView(view)
        } catch (_: Exception) {
            // View may already have been detached
        }
        overlayView   = null
        windowManager = null
    }

    private fun parseGravity(gravity: String): Int = when (gravity.lowercase()) {
        "top-left"      -> Gravity.TOP    or Gravity.START
        "top-right"     -> Gravity.TOP    or Gravity.END
        "top-center"    -> Gravity.TOP    or Gravity.CENTER_HORIZONTAL
        "bottom-left"   -> Gravity.BOTTOM or Gravity.START
        "bottom-right"  -> Gravity.BOTTOM or Gravity.END
        "bottom-center" -> Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
        "center"        -> Gravity.CENTER
        else            -> Gravity.TOP    or Gravity.END
    }
}
