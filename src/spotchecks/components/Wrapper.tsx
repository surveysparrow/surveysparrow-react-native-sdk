import { Dimensions } from "react-native";

import { useSelector } from "react-redux";
import type { SpotcheckState } from "../state/spotcheckState";
import { componentStore } from "../state/componentState";
import { Builder } from "./Builder";
import { execute } from "../helpers/executables";
import { useEffect, useState, useMemo } from "react";

export const Wrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const state = useSelector((state: SpotcheckState) => state.SpotCheckState);

  const [screenDimensions, setScreenDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription.remove();
  }, []);

  const { height: screenHeight, width: screenWidth } = screenDimensions;
  
  const [styles, setStyles] = useState({
    overlayStyle: {
      height: 0,
      opacity: 0,
      zIndex: -999999,
    },
    wrapperStyle: {},
  });

  const [componentState, setComponentState] = useState(componentStore.getState().componentState);

  useEffect(() => {
    const unsubscribe = componentStore.subscribe(() => {
      setComponentState(componentStore.getState().componentState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    execute("wrapper.getWrapperStyles", { screenHeight, screenWidth, setStyles });
  }, [screenHeight, screenWidth, state.showSpotCheck, state.spotCheckDetails, state.currentSpotcheck]);

  // Keeps the injected focus script's screen height correct after rotation.
  useEffect(() => {
    const script = `window.__ssScreenHeight = ${screenHeight}; true;`;
    state.webViewDetails.classicWebViewRef?.injectJavaScript?.(script);
    state.webViewDetails.chatWebViewRef?.injectJavaScript?.(script);
  }, [screenHeight, state.webViewDetails.classicWebViewRef, state.webViewDetails.chatWebViewRef]);

  const wrapperSchema = componentState?.schemas?.wrapper;

  const context = useMemo(() => ({
    state,
    styles,
    slots: {
      children,
    },
  }), [state, styles, children]);

  if (wrapperSchema && componentState.isLoaded) {
    return <Builder schema={wrapperSchema} context={context} />;
  }

  return null;

};
