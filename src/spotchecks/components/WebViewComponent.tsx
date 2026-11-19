import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Keyboard, Platform } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";
import type { WebViewErrorEvent } from "react-native-webview/lib/WebViewTypes";
import { useSelector } from "react-redux";
import type { SpotcheckState } from "../state/spotcheckState";
import { componentStore } from "../state/componentState";
import { Builder } from "./Builder";
import { WebViewRenderer } from "./WebViewRenderer";
import { execute, dispatchWrapper } from "../helpers/executables";

export const WebViewComponent: React.FC = () => {
  const state = useSelector((state: SpotcheckState) => state.SpotCheckState);

  const [componentState, setComponentState] = useState(componentStore.getState().componentState);

  useEffect(() => {
    const unsubscribe = componentStore.subscribe(() => {
      setComponentState(componentStore.getState().componentState);
    });
    return unsubscribe;
  }, []);

  const classicWebViewRefCallback = useCallback((ref: WebView | null) => {
    execute("webviewComponent.classicWebViewRefCallback", { ref });
  }, []);

  const chatWebViewRefCallback = useCallback((ref: WebView | null) => {
    execute("webviewComponent.chatWebViewRefCallback", { ref });
  }, []);

  const handleOnMessage = (event: WebViewMessageEvent) => {
    execute("webviewComponent.handleWebViewMessage", { event });
  };

  const handleOnError = (error: WebViewErrorEvent) => {
    execute("webviewComponent.handleWebViewError", { error });
  };

  useEffect(() => {
    execute("webviewComponent.handleWebViewInjection");
  }, [state.webViewDetails.isChatLoading, state.webViewDetails.isClassicLoading, state.webViewDetails.webViewInjectionData]);

  useEffect(() => {
    const showEvent = Platform.OS === 'android' ? 'keyboardDidShow' : 'keyboardWillShow';
    const hideEvent = Platform.OS === 'android' ? 'keyboardDidHide' : 'keyboardWillHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      dispatchWrapper({
        spotCheckDetails: {
          keyBoardHeight: event.endCoordinates.height,
        },
        webViewDetails: {
          scrollEnabled: false,
        },
      });
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      dispatchWrapper({
        spotCheckDetails: {
          keyBoardHeight: 0,
        },
        webViewDetails: {
          scrollEnabled: true,
        },
      });
      // Toggle true -> false to force WebView re-layout
      setTimeout(() => {
        dispatchWrapper({
          webViewDetails: {
            scrollEnabled: false,
          },
        });
      }, 0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const webviewSchema = componentState?.schemas?.webviewComponent;

  const context = useMemo(() => ({
    state,
    handlers: {
      classicWebViewRefCallback,
      chatWebViewRefCallback,
      handleOnMessage,
      handleOnError,
    },
  }), [state, classicWebViewRefCallback, chatWebViewRefCallback]);

  if (webviewSchema && componentState.isLoaded) {
    return <Builder schema={webviewSchema} context={context} />;
  }

  return (
    <WebViewRenderer
      canShow={false}
      uri={state?.webViewDetails?.classicUrl || ""}
      onMessage={handleOnMessage}
      onError={handleOnError}
    />
  );
};

export default WebViewComponent;
