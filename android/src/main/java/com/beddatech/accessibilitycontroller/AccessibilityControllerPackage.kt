package com.beddatech.accessibilitycontroller

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/**
 * TurboReactPackage that registers [AccessibilityControllerModule] with React Native.
 *
 * Using [TurboReactPackage] enables lazy module creation on New Architecture
 * while remaining compatible with the legacy bridge via the interop layer.
 *
 * Add this to your MainApplication's package list:
 *
 * ```kotlin
 * override fun getPackages(): List<ReactPackage> =
 *     PackageList(this).packages + listOf(AccessibilityControllerPackage())
 * ```
 */
class AccessibilityControllerPackage : TurboReactPackage() {

    override fun getModule(
        name: String,
        reactContext: ReactApplicationContext
    ): NativeModule? = if (name == AccessibilityControllerModule.NAME) {
        AccessibilityControllerModule(reactContext)
    } else {
        null
    }

    override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
        mapOf(
            AccessibilityControllerModule.NAME to ReactModuleInfo(
                /* _name                   */ AccessibilityControllerModule.NAME,
                /* _className              */ AccessibilityControllerModule.NAME,
                /* _canOverrideExistingModule */ false,
                /* _needsEagerInit         */ false,
                /* _isCxxModule            */ false,
                /* _isTurboModule          */ true
            )
        )
    }
}
