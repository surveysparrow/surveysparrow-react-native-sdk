import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { closeSpotCheck, handleSurveyEnd } from './HelperFunctions';
import type { SpotcheckState } from './SpotCheckState';

export function useSpotcheckNavigation(
  spotcheckRef: React.MutableRefObject<SpotcheckState>,
  useSegmentsHook?: () => string[]
) {
  const previousRouteName = useRef<string | null>(null);
  const navigation = useNavigation();
  const segments = useSegmentsHook?.() ?? [];
  useEffect(() => {
    const sc = spotcheckRef.current;
    if (segments.length > 0) {
      const currentRoute = segments.join('/');
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
      return;
    }

    if (navigation) {
      const unsubscribe = navigation.addListener('state', () => {
        const state = navigation.getState();
        const index = state?.index ?? 0;
        const currentRoute = state?.routes?.[index]?.name ?? null;
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
    }
  }, [navigation, spotcheckRef, segments]);
}
