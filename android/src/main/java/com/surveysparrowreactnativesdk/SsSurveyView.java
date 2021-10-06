package com.surveysparrowreactnativesdk;

import android.animation.ObjectAnimator;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.surveysparrow.ss_android_sdk.OnSsResponseEventListener;
import com.surveysparrow.ss_android_sdk.SsSurvey;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Iterator;

public class SsSurveyView<object> extends Fragment {
  private SsSurvey survey;
  private OnSsResponseEventListener onSsResponseEventListener;
  private WebView mWebView;
  private static ReactApplicationContext reactContext;
  private ProgressBar progressBar;
  private ObjectAnimator progressBarAnimator;

  public String generateUrl(String domain, String token, String type, String customParams) throws JSONException {
    JSONArray paramArr = new JSONArray(customParams);
    String customVariableString = "?";
    for(int i =0;i<paramArr.length();i++){
      JSONObject surveyParam = paramArr.getJSONObject(i);
      customVariableString += surveyParam.get("name") + "=" + surveyParam.get("value") + "&";
      Log.v("json data","value i "+i+" name is "+surveyParam.get("name")+" value is "+surveyParam.get("value"));
    }
    String baseUrl = "https://" + domain + "/" + (type == "nps" ? 'n' : 's') + "/android/" + token + customVariableString;
    return baseUrl;
  }

  @Nullable
  @Override
  public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
    Integer reactID = getArguments().getInt("reactId");
    FrameLayout ssLayout = new FrameLayout(getActivity());
    progressBar = new ProgressBar(getActivity(), null, android.R.attr.progressBarStyleHorizontal);
    progressBar.setMax(100);
    progressBar.setLayoutParams(new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 6, Gravity.TOP));

    WebView ssWebView = new WebView(getActivity());
    ssWebView.getSettings().setJavaScriptEnabled(true);
    ssWebView.getSettings().setDomStorageEnabled(true);
    JsObject jsObject = new JsObject();
    jsObject.reactNativeViewId = reactID;
    ssWebView.addJavascriptInterface(jsObject, "SsAndroidSdk");


    ssWebView.setWebViewClient(new WebViewClient() {
      @Override
      public boolean shouldOverrideUrlLoading(WebView view, String url) {
        if (url.contains("https://surveysparrow.com/thankyou")) {
          return super.shouldOverrideUrlLoading(view, url);
        } else {
          view.getContext().startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
          return true;
        }
      }
    });

    ssWebView.setWebChromeClient(new WebChromeClient() {
      @Override
      public void onProgressChanged(WebView view, int newProgress) {
        super.onProgressChanged(view, newProgress);
        if (newProgress == 100) {
          progressBar.setVisibility(View.GONE);
          return;
        }
        progressBarAnimator = ObjectAnimator.ofInt(progressBar, "progress", progressBar.getProgress(), newProgress);
        progressBarAnimator.setDuration(300);
        progressBarAnimator.start();
      }
    });

    String surveyUrl = null;
    try {
      surveyUrl = generateUrl(getArguments().getString("surveyDomain"),getArguments().getString("surveyToken"),getArguments().getString("surveyType"),getArguments().getString("surveyParams"));
    } catch (JSONException e) {
      e.printStackTrace();
    }
    ssWebView.loadUrl(surveyUrl);

    ssLayout.addView(ssWebView);
    ssLayout.addView(progressBar);
    return ssLayout;
  }

  public static class JsObject {
    public int reactNativeViewId;
    @JavascriptInterface
    public void shareData(String data) throws JSONException {
      JSONObject jsonObject = new JSONObject(data);
      SsSurveyViewManager.sendDataToJS(MapUtil.convertJsonToMap(jsonObject),reactNativeViewId);
    }
  }
}
