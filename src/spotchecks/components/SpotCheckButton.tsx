import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import type { SpotcheckState } from "../state/spotcheckState";
import { componentStore } from "../state/componentState";
import { Builder } from "./Builder";
import { componentRegistry } from "./ComponentRegistry";
import { execute } from "../helpers/executables";

export const SpotCheckButton: React.FC = () => {
  const state = useSelector((state: SpotcheckState) => state.SpotCheckState);

  const [styles, setStyles] = useState({});

  const [componentState, setComponentState] = useState(componentStore.getState().componentState);

  useEffect(() => {
    const unsubscribe = componentStore.subscribe(() => {
      setComponentState(componentStore.getState().componentState);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const loadStyles = async () => {
      const result = await execute("spotCheckButton.getSpotCheckButtonStyles");
      if (result) {
        setStyles(result);
      }
    };
    loadStyles();
  }, [state.spotCheckDetails.spotCheckButtonConfig, state.spotCheckDetails.isSpotCheckButton, state.spotCheckDetails.sideTabButtonWidth]);

  const spotCheckButtonSchema = componentState?.schemas?.spotCheckButton;

  const context = useMemo(() => ({
    state,
    styles,
    handlers: {
      handleSpotCheckButtonPress: () => {
        execute("spotCheckButton.handleSpotCheckButtonPress");
      },
      handleSideTabLayout: (event: any) => {
        execute("spotCheckButton.handleSideTabLayout", { event });
      },
    },
  }), [state, styles]);

  // Wait for styles so the button never renders unstyled for a frame.
  if (spotCheckButtonSchema && componentState.isLoaded && Object.keys(styles).length > 0) {
    return <Builder schema={spotCheckButtonSchema} context={context} />;
  }

  return null;
};

componentRegistry.register('SpotCheckButton', SpotCheckButton);
