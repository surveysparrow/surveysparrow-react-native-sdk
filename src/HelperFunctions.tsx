import { Platform } from 'react-native';
import {
  store,
  setIsVisible,
  setIsCloseButtonEnabled,
  setIsFullScreenMode,
  setSpotcheckID,
  setCurrentQuestionHeight,
  setCloseButtonStyle,
  setSpotcheckContactID,
  setSpotcheckURL,
  setSpotcheckPosition,
  setIsLoading,
  setIsBannerImageOn,
  setMaxHeight,
  setTriggerToken,
} from './SpotCheckState';
import uuid from 'react-native-uuid';

export function generateTraceId() {
  const uuidString = uuid.v4();
  const timestamp = Date.now();
  return `${uuidString}-${timestamp}`;
}

export const setAppearance = async (
  responseJson: any,
  screen: string,
  domainName: string,
  traceId: string,
  variables: Record<string, any>
) => {
  if (responseJson) {
    const appearance = responseJson?.appearance;

    if (appearance) {
      const tposition = appearance?.position;
      switch (tposition) {
        case 'top_full':
          store.dispatch(setSpotcheckPosition('top'));
          break;
        case 'center_center':
          store.dispatch(setSpotcheckPosition('center'));
          break;
        case 'bottom_full':
          store.dispatch(setSpotcheckPosition('bottom'));
          break;
        default:
          break;
      }
      console.log(store.getState().spotcheck.spotcheckPosition);
      store.dispatch(setIsCloseButtonEnabled(appearance?.closeButton ?? true));
      store.dispatch(setCloseButtonStyle(appearance.colors?.overrides ?? {}));

      const cardProp = appearance.cardProperties;
      if (cardProp?.maxHeight) {
        const mxHeight =
          typeof cardProp.maxHeight === 'string'
            ? parseFloat(cardProp.maxHeight)
            : cardProp.maxHeight;

        store.dispatch(setMaxHeight(mxHeight / 100));
      } else {
        store.dispatch(setMaxHeight(0));
      }

      store.dispatch(setIsFullScreenMode(appearance?.mode === 'fullScreen'));
      store.dispatch(
        setIsBannerImageOn(appearance?.bannerImage?.enabled ?? false)
      );
    }

    store.dispatch(
      setSpotcheckID(
        responseJson?.spotCheckId ?? responseJson?.spotCheckId ?? 0
      )
    );
    store.dispatch(
      setSpotcheckContactID(
        responseJson?.spotCheckContactId ??
          responseJson?.spotCheckContact?.id ??
          0
      )
    );
    store.dispatch(setTriggerToken(responseJson?.triggerToken ?? ''));

    const baseSpotcheckURL = `https://${domainName}/n/spotcheck/${store.getState().spotcheck.triggerToken}?spotcheckContactId=${store.getState().spotcheck.spotcheckContactID}&traceId=${traceId}&spotcheckUrl=${screen}`;
    let fullSpotcheckURL = baseSpotcheckURL;

    Object.entries(variables).forEach(([key, value]) => {
      fullSpotcheckURL += `&${key}=${value}`;
    });

    if (Platform.OS === 'android') {
      fullSpotcheckURL += '&isAndroidMobileTarget=true';
    }

    store.dispatch(setSpotcheckURL(fullSpotcheckURL));
  }
};

export const start = () => {
  setTimeout(() => {
    store.dispatch(setIsVisible(true));
  }, store.getState().spotcheck.afterDelay * 1000);
};

export const handleSurveyEnd = () => {
  store.dispatch(setIsVisible(false));
  store.dispatch(setIsCloseButtonEnabled(false));
  store.dispatch(setIsFullScreenMode(false));
  store.dispatch(setSpotcheckID(0));
  store.dispatch(setCurrentQuestionHeight(0));
  store.dispatch(setCloseButtonStyle({}));
  store.dispatch(setSpotcheckContactID(0));
  store.dispatch(setSpotcheckURL(''));
  store.dispatch(setSpotcheckPosition('bottom'));
  store.dispatch(setIsLoading(true));
};

export const closeSpotCheck = async (
  domainName: string,
  spotcheckContactID: number,
  traceId: string,
  triggerToken: string
) => {
  try {
    const payload = {
      traceId: traceId,
      triggerToken: triggerToken,
    };

    const response = await fetch(
      `https://${domainName}/api/internal/spotcheck/dismiss/${spotcheckContactID}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.status === 200) {
      const data = await response.json();
      if (data.success) {
        console.log('SpotCheck Closed');
      }
    } else {
      console.log(`Error: ${response.status}`);
    }
  } catch (error) {
    console.log('Error parsing JSON:', error);
  }
};
