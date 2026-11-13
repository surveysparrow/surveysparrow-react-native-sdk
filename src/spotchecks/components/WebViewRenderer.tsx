import React from "react";
import { View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { WebViewErrorEvent } from "react-native-webview/lib/WebViewTypes";

// react-native-webview typings target newer @types/react than this package uses.
const NativeWebView = WebView as unknown as React.ComponentType<any>;

export const WebViewRenderer = React.forwardRef<
  WebView,
  {
    uri: string;
    canShow: boolean;
    onMessage: (event: WebViewMessageEvent) => void;
    onError: (event: WebViewErrorEvent) => void;
    config?: any;
    scrollEnabled?: boolean;
  }
>(({ canShow, uri, onMessage, onError = () => { }, config, scrollEnabled = true }, ref) => {
  return uri ? (
    <View
      style={
        canShow
          ? {
            width: "100%",
            height: "100%",
          }
          : {
            // Legacy kept hidden webviews 1x1 off-screen so they keep loading.
            position: "absolute",
            left: -1000,
            width: 1,
            height: 1,
            opacity: 0,
          }
      }
    >
      <NativeWebView
        ref={ref}
        source={{ uri }}
        scrollEnabled={scrollEnabled}
        {...config}
        onMessage={onMessage}
        onError={onError}
      />
    </View>
  ) : (
    <></>
  );
});
