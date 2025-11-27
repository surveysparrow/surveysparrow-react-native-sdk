import { useEffect, useRef } from 'react';
import { useSegments } from 'expo-router';
import { closeSpotCheck, handleSurveyEnd } from './HelperFunctions';
import type { SpotcheckState } from './SpotCheckState';

export function useSpotcheckNavigation(
  spotcheckRef: React.MutableRefObject<SpotcheckState>
) {
  const segments = useSegments();
  const previousRoute = useRef<string | null>(null);

  useEffect(() => {
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
  }, [segments]);
}