package com.surveysparrowreactnativesdk

import android.content.SharedPreferences
import android.preference.PreferenceManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SurveysparrowReactNativeSdkModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val sharedPreferences: SharedPreferences =
        PreferenceManager.getDefaultSharedPreferences(reactContext)

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun putString(key: String, value: String, promise: Promise) {
        val editor = sharedPreferences.edit()
        editor.putString(key, value)
        if (editor.commit()) {
            promise.resolve(true)
        } else {
            promise.reject("SAVE_ERROR", "Could not save string")
        }
    }

    @ReactMethod
    fun getString(key: String, promise: Promise) {
        val value = sharedPreferences.getString(key, null)
        promise.resolve(value)
    }

    companion object {
        const val NAME = "SurveysparrowReactNativeSdk"
    }
}
