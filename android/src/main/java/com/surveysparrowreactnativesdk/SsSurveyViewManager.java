package com.surveysparrowreactnativesdk;

import android.os.Bundle;
import android.util.Log;
import android.view.Choreographer;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.events.RCTEventEmitter;
import com.surveysparrow.ss_android_sdk.SsSurvey;
import com.surveysparrow.ss_android_sdk.SurveySparrow;

import org.json.JSONArray;
import org.json.JSONException;

import java.util.ArrayList;
import java.util.Map;

public class SsSurveyViewManager extends ViewGroupManager<FrameLayout> {
  public static final String SS_DOMAIN = "your-domain";
  public static final String SS_TOKEN = "your-survey-token";
  private static final int COMMAND_CREATE = 1;
  private static final int COMMAND_REMOVE = 2;
  SsSurvey survey;
  SurveySparrow surveySparrow;

  public static final String REACT_NAME = "SsSurveyFragment";
  public static ReactApplicationContext mCallerContext;
  ThemedReactContext mContext;

  public SsSurveyViewManager(ReactApplicationContext reactContext) {
    mCallerContext  = reactContext ;
  }


  @NonNull
  @Override
  public String getName() {
    return REACT_NAME;
  }

  @NonNull
  @Override
  protected FrameLayout createViewInstance(@NonNull ThemedReactContext reactContext) {
    return new FrameLayout(reactContext);
  }

  @Nullable
  @Override
  public Map<String, Integer> getCommandsMap() {
    return MapBuilder.of(
      "create", COMMAND_CREATE,
      "remove",COMMAND_REMOVE
    );
  }

  @Override
  public void receiveCommand(@NonNull FrameLayout root,String commandId,@Nullable ReadableArray args) {
    super.receiveCommand(root,commandId,args);
    int reactNativeViewId = args.getInt(0);
    ReadableMap surveyLink = args.getMap(1);

    int commandIdInt = Integer.parseInt(commandId);
    switch (commandIdInt) {
      case COMMAND_CREATE:
        try {
          createFragment(root,reactNativeViewId,surveyLink);
        } catch (JSONException e) {
          e.printStackTrace();
        }
        break;
      case COMMAND_REMOVE:
        removeFragment(root,reactNativeViewId);
        break;
      default:{

      }
    }
  }

  private void removeFragment (FrameLayout parentLayout,int reactNativeViewId) {
    Fragment fragment = ((FragmentActivity) this.mCallerContext.getCurrentActivity()).getSupportFragmentManager().findFragmentByTag(String.valueOf(reactNativeViewId));
    if(fragment!=null){
      ((FragmentActivity) this.mCallerContext.getCurrentActivity()).getSupportFragmentManager().beginTransaction().remove(fragment).commit();
    }
  }
  private void createFragment(FrameLayout parentLayout, int reactNativeViewId, ReadableMap surveyLink) throws JSONException {
    View parentView = (ViewGroup) parentLayout.findViewById(reactNativeViewId).getParent();
    setupLayoutHack((ViewGroup) parentView);
    Bundle bundle = new Bundle();
    ReadableArray customparamMap = surveyLink.getArray("customParams");
    JSONArray surArr = ArrayUtil.toJSONArray(customparamMap);

    bundle.putInt("reactId",reactNativeViewId);
    bundle.putString("surveyDomain",surveyLink.getString("domain"));
    bundle.putString("surveyToken",surveyLink.getString("token"));
    bundle.putString("surveyType",surveyLink.getString("surveyType"));
    bundle.putString("surveyParams", surArr.toString());

    SsSurveyView ssSurveyView = new SsSurveyView();
    ssSurveyView.setArguments(bundle);
    ((FragmentActivity) this.mCallerContext.getCurrentActivity()).getSupportFragmentManager().beginTransaction().replace(reactNativeViewId,ssSurveyView,String.valueOf(reactNativeViewId)).commit();
    WritableMap sData = Arguments.createMap();
  }

  @Override
  public Map getExportedCustomBubblingEventTypeConstants() {
    return MapBuilder.builder()
      .put("onUpdate",MapBuilder.of("phasedRegistrationNames",MapBuilder.of("bubbled","onUpdate")))
      .put("onError",MapBuilder.of("phasedRegistrationNames",MapBuilder.of("bubbled","onError")))
      .build();
  }

  @Nullable
  @Override
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    return super.getExportedCustomDirectEventTypeConstants();
  }

  public static void sendDataToJS(WritableMap data, int reactNativeViewId){
    mCallerContext.getJSModule(RCTEventEmitter.class)
      .receiveEvent(reactNativeViewId,"onUpdate",data);
  }
  void setupLayoutHack(ViewGroup view){
    Choreographer.getInstance().postFrameCallback(new Choreographer.FrameCallback() {
      @Override
      public void doFrame(long frameTimeNanos) {
        manuallyLayoutChildren(view);
        view.getViewTreeObserver().dispatchOnGlobalLayout();
        Choreographer.getInstance().postFrameCallback(this);
      }
    });
  }

  void manuallyLayoutChildren(ViewGroup view){
    for (int i =0;i<view.getChildCount();i++){
      View child = view.getChildAt(i);
      child.measure(View.MeasureSpec.makeMeasureSpec(view.getMeasuredWidth(),View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(view.getMeasuredHeight(),View.MeasureSpec.EXACTLY));
      child.layout(0,0,child.getMeasuredWidth(),child.getMeasuredHeight());
    }
  }
}
