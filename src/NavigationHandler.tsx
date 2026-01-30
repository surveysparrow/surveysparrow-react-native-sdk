import { useEffect, useRef } from 'react';

import { closeSpotCheck, handleSurveyEnd } from './HelperFunctions';
import type { SpotcheckState } from './SpotCheckState';

function useSafeNavigation() {
  try {
    const { useSegments } = require('expo-router');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSegments();
  } catch (error) {
    return null;
  }
}

export function useSpotcheckNavigation(
  spotcheckRef: React.MutableRefObject<SpotcheckState>
) {
  const segments = useSafeNavigation();
  const previousRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!segments) {
      return;
    }
    try {
      const sc = spotcheckRef.current;
      const currentRoute = segments.join('/');

      if (
        currentRoute !== previousRoute.current &&
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

      previousRoute.current = currentRoute;
    } catch (error) {
      console.log('Spotcheck: Navigation listener failed', error);
    }
  }, [segments]);
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