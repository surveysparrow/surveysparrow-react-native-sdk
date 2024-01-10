package com.surveysparrowreactnativesdk;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.surveysparrow.ss_android_sdk.OnSsResponseEventListener;
import com.surveysparrow.ss_android_sdk.SsSurvey;
import com.surveysparrow.ss_android_sdk.SurveySparrow;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.concurrent.TimeUnit;

@ReactModule(name = SurveysparrowReactNativeSdkModule.NAME)
public class SurveysparrowReactNativeSdkModule extends ReactContextBaseJavaModule implements OnSsResponseEventListener {
    public static final String NAME = "SsSurveyModule";
    public static ReactApplicationContext reactContext;
    SsSurvey survey;
    SurveySparrow surveySparrow;
    private Promise resultPromise;
    public static final String LOG_TAG = "SS_SAMPLE";
    public static final int SURVEY_REQUEST_CODE = 1;
    public static final int SURVEY_SCHEDULE_REQUEST_CODE = 2;
    private DeviceEventManagerModule.RCTDeviceEventEmitter mEmitter = null;

    public SurveysparrowReactNativeSdkModule(ReactApplicationContext context) {
      super(context);
      reactContext = context;
      reactContext.addActivityEventListener(activityEventListener);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }


    @ReactMethod
    public void openSurvey(ReadableMap surveyConfig) throws JSONException {
      String domain = surveyConfig.getString("domain");
      String token = surveyConfig.getString("token");
      String surveyType = surveyConfig.getString("surveyType");
      Integer thankYouPageTime = surveyConfig.getInt("thankYouPageTimeLimit");
      ReadableArray customparamMap = surveyConfig.getArray("customParams");
      JSONArray surveyParamsArray = ArrayUtil.toJSONArray(customparamMap);
      survey = new SsSurvey(domain,token);
      if(surveyType == "nps"){
        survey.setSurveyType(SurveySparrow.NPS);
      }
      else if(surveyType == "chat"){
        survey.setSurveyType(SurveySparrow.CHAT);
      }
      else{
        survey.setSurveyType(SurveySparrow.CLASSIC);
      }
      for(int i =0;i<surveyParamsArray.length();i++){
        JSONObject surveyParam = surveyParamsArray.getJSONObject(i);
        survey.addCustomParam(surveyParam.get("name").toString(),surveyParam.get("value").toString());
      }

      final Activity activity = getCurrentActivity();
      if(activity == null)
        return;
      surveySparrow = new SurveySparrow(activity, survey)
        .enableBackButton(true)
        .setWaitTime(thankYouPageTime);
      surveySparrow.startSurveyForResult(SURVEY_REQUEST_CODE);
    }

    @ReactMethod
    public void scheduleSsSurvey(ReadableMap surveyConfig) throws JSONException {
      String domain = surveyConfig.getString("domain");
      String token = surveyConfig.getString("token");
      String surveyType = surveyConfig.getString("surveyType");
      Integer thankYouPageTime = surveyConfig.getInt("thankYouPageTimeLimit");

      String alertTitle = surveyConfig.getString("alertTitle");
      String alertMessage = surveyConfig.getString("alertMessage");
      String positiveBtnMsg = surveyConfig.getString("alertPositiveText");
      String negativeBtnMsg = surveyConfig.getString("alertNegativeText");

      Integer startAfter = surveyConfig.getInt("startAfter");
      Integer repeatInterval =surveyConfig.getInt("repeatInterval");

      Boolean isIncremental = surveyConfig.getBoolean("incrementalRepeat");
      Boolean isRepeatSurvey = surveyConfig.getBoolean("repeatSurvey");

      ReadableArray customparamMap = surveyConfig.getArray("customParams");
      JSONArray surveyParamsArray = ArrayUtil.toJSONArray(customparamMap);

      survey = new SsSurvey(domain,token);

      if(surveyType == "nps"){
        survey.setSurveyType(SurveySparrow.NPS);
      }
      else if(surveyType == "chat"){
        survey.setSurveyType(SurveySparrow.CHAT);
      }
      else{
        survey.setSurveyType(SurveySparrow.CLASSIC);
      }

      for(int i =0;i<surveyParamsArray.length();i++){
        JSONObject surveyParam = surveyParamsArray.getJSONObject(i);
        survey.addCustomParam(surveyParam.get("name").toString(),surveyParam.get("value").toString());
      }

      final Activity activity = getCurrentActivity();
      if(activity == null)
        return;
      surveySparrow = new SurveySparrow(activity, survey)
        .enableBackButton(true)
        .setWaitTime(thankYouPageTime)
        .setDialogTitle(alertTitle)
        .setDialogMessage(alertMessage)
        .setDialogPositiveButtonText(positiveBtnMsg)
        .setDialogNegativeButtonText(negativeBtnMsg)
        .setStartAfter(startAfter)
        .setRepeatInterval(repeatInterval);
      if(isIncremental){
        surveySparrow.setRepeatType(SurveySparrow.REPEAT_TYPE_INCREMENTAL);
      }
      else{
        surveySparrow.setRepeatType(SurveySparrow.REPEAT_TYPE_CONSTANT);
      }
      if(isRepeatSurvey){
        surveySparrow.setFeedbackType(SurveySparrow.MULTIPLE_FEEDBACK);
      }
      else{
        surveySparrow.setFeedbackType(SurveySparrow.SINGLE_FEEDBACK);
      }
      surveySparrow.scheduleSurvey(SURVEY_SCHEDULE_REQUEST_CODE);

    }

    @ReactMethod
    public void clearScheduleSsSurvey(ReadableMap surveyConfig){
      try{
        surveySparrow.clearSchedule();
      }
      catch (Exception e){
        Log.v(LOG_TAG, e.toString());
      }
    }

    @Override
    public void onSsResponseEvent(JSONObject data) {
      Log.v(LOG_TAG, data.toString());
    }


    public void sendEventEmit(String result) {
      if(mEmitter == null){
        mEmitter = getReactApplicationContext().getJSModule((DeviceEventManagerModule.RCTDeviceEventEmitter.class));
      }
      if(mEmitter != null){
        mEmitter.emit("onSurveyResponse",result);
      }
    }

    private final ActivityEventListener activityEventListener = new ActivityEventListener() {
    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
      if (requestCode == SURVEY_REQUEST_CODE || requestCode == SURVEY_SCHEDULE_REQUEST_CODE ) {
        if (resultCode == Activity.RESULT_OK) {
          JSONObject responses = SurveySparrow.toJSON(data.getData().toString());
          sendEventEmit(responses.toString());
        } else {
          Log.v(LOG_TAG, "No Response");
        }
      }
    }
    @Override
    public void onNewIntent(Intent intent) {

    }
  };

}
