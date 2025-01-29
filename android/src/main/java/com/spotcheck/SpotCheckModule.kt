package com.spotcheck

import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class SpotCheckModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  private val sharedPreferences: SharedPreferences = reactContext.getSharedPreferences(PREFERENCES_KEY, Context.MODE_PRIVATE)

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun saveString(key: String, value: String, promise: Promise) {
    val editor = sharedPreferences.edit()
    editor.putString(key, value)
    val success = editor.commit()
    if (success) {
      promise.resolve(true)
    } else {
      promise.reject("ERROR", "Could not save string")
    }
  }

  @ReactMethod
  fun getString(key: String, promise: Promise) {
    val value = sharedPreferences.getString(key, null)
    promise.resolve(value)
  }

  companion object {
    const val NAME = "SpotCheck"
    private const val PREFERENCES_KEY = "com.spotcheck.PREFERENCES"
  }
}
