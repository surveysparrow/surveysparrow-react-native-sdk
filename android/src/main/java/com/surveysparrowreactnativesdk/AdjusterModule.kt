package com.surveysparrowreactnativesdk

import android.app.Activity
import android.view.WindowManager
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AdjusterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "AdjusterModule"
    }

    @ReactMethod
    fun setAdjustNothing() {
        val activity: Activity? = reactApplicationContext.currentActivity

        activity?.runOnUiThread {
            activity.window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING)
        }
    }

    @ReactMethod
    fun setAdjustResize() {
        val activity: Activity? = reactApplicationContext.currentActivity
        activity?.runOnUiThread {
            activity.window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE)
        }
    }
}
