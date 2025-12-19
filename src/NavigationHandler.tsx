import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  closeSpotCheck,
  handleSurveyEnd,
  captureP1Error,
} from './HelperFunctions';
import type { SpotcheckState } from './SpotCheckState';

export function useSpotcheckNavigation(
  spotcheckRef: React.MutableRefObject<SpotcheckState>
) {
  const navigation = useNavigation();
  const previousRouteName = useRef<string | null>(null);
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', () => {
      const state = navigation.getState();
      const index = state?.index ?? 0;
      const currentRoute = state?.routes?.[index]?.name ?? null;
      const sc = spotcheckRef.current;
      if (
        currentRoute !== previousRouteName.current &&
        (sc.isVisible || sc.isSpotCheckButton)
      ) {
        try {
          closeSpotCheck(
            sc.domainName,
            sc.spotcheckContactID,
            sc.traceId,
            sc.triggerToken
          );
          handleSurveyEnd(true);
        } catch (error) {
          captureP1Error(error, 'CLOSE_SPOTCHECK', {
            component: 'NavigationHandler',
            action: 'closeSpotCheckOnNavigation',
            currentRoute,
            previousRouteName: previousRouteName.current,
          });
        }
      }
      previousRouteName.current = currentRoute;
    });
    return unsubscribe;
  }, [navigation]);
}
