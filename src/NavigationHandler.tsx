import { useEffect, useRef } from 'react';
import { closeSpotCheck, handleSurveyEnd } from './HelperFunctions';
import type { SpotcheckState } from './SpotCheckState';

function useSafeNavigation() {
  try {
    const { useNavigation } = require('@react-navigation/native');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useNavigation();
  } catch (error) {
    return null;
  }
}

export function useSpotcheckNavigation(
  spotcheckRef: React.MutableRefObject<SpotcheckState>
) {
  const navigation = useSafeNavigation();
  const previousRouteName = useRef<string | null>(null);

  useEffect(() => {
    if (!navigation) {
      return;
    }

    try {
      const unsubscribe = navigation.addListener('state', () => {
        const state = navigation.getState();
        const index = state?.index ?? 0;
        const currentRoute = state?.routes?.[index]?.name ?? null;
        const sc = spotcheckRef.current;
        if (
          currentRoute !== previousRouteName.current &&
          (sc.isVisible || sc.isSpotCheckButton)
        ) {
          closeSpotCheck(
            sc.domainName,
            sc.spotcheckContactID,
            sc.traceId,
            sc.triggerToken
          );
          handleSurveyEnd(true);
        }
        previousRouteName.current = currentRoute;
      });
      return unsubscribe;
    } catch (error) {
      console.log('Spotcheck: Navigation listener failed', error);
      return;
    }
  }, [navigation]);
}

export function onSpotcheckNavigationChange() {
  const { store } = require('./SpotCheckState');
  const state = store.getState().spotcheck;

  if (state.isVisible || state.isSpotCheckButton) {
    closeSpotCheck(
      state.domainName,
      state.spotcheckContactID,
      state.traceId,
      state.triggerToken
    );
    handleSurveyEnd(true);
  }
}
