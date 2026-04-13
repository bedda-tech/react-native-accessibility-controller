package com.beddatech.accessibilitycontroller

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * ReactPackage that registers [AccessibilityControllerModule] with the React
 * Native bridge.
 *
 * Add this to your MainApplication's package list:
 *
 * ```kotlin
 * override fun getPackages(): List<ReactPackage> =
 *     PackageList(this).packages + listOf(AccessibilityControllerPackage())
 * ```
 */
class AccessibilityControllerPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(AccessibilityControllerModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
