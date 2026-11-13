import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { SpotcheckState } from "../state/spotcheckState";
import { componentStore } from "../state/componentState";
import { Builder } from "./Builder";
import { componentRegistry } from "./ComponentRegistry";
import { execute } from "../helpers/executables";

export const CloseButton: React.FC = () => {
  const state = useSelector((state: SpotcheckState) => state.SpotCheckState);

  const [styles, setStyles] = useState({
    width: 15,
    height: 1.6,
    color: "#000000",
    closeButtonContainerStyle: {},
    closeButtonOverlayStyle: {},
  });

  const [componentState, setComponentState] = useState(componentStore.getState().componentState);

  useEffect(() => {
    const unsubscribe = componentStore.subscribe(() => {
      setComponentState(componentStore.getState().componentState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadStyles = async () => {
      const result = await execute("closeButton.getCloseButtonStyles");
      if (result) {
        setStyles(result);
      }
    };
    loadStyles();
  }, [state.spotCheckDetails.closeButton, state.spotCheckDetails.isRTLLanguage]);

  const closeButtonSchema = componentState?.schemas?.closeButton;

  const context = useMemo(() => ({
    state,
    styles,
    handlers: {
      handleClosePress: () => {
        execute("closeButton.handleCloseButton");
      },
    },
  }), [state, styles]);

  if (closeButtonSchema && componentState.isLoaded) {
    return <Builder schema={closeButtonSchema} context={context} />;
  }

  return null;
};

componentRegistry.register('CloseButton', CloseButton);
