import axios from 'axios';
import { Platform, Dimensions } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import { generateTraceId, setAppearance } from './HelperFunctions';
import { loadData, saveData } from './LocalStorage';
import { store, updateState } from './SpotCheckState';
import type { TrackEventProps } from './Types';

export const sendTrackScreenRequest = async (
  screen: string,
  options: {
    variables?: Record<string, any>;
    customProperties?: Record<string, any>;
    userDetails?: Record<string, any>;
  }
) => {
  try {
    const oldState = store.getState().spotcheck;

    if (options.variables && Object.keys(options.variables).length > 0) {
      store.dispatch(
        updateState({
          variables: {
            ...oldState.variables,
            ...options.variables,
          },
        })
      );
    }

    if (
      options.customProperties &&
      Object.keys(options.customProperties).length > 0
    ) {
      store.dispatch(
        updateState({
          customProperties: {
            ...oldState.customProperties,
            ...options.customProperties,
          },
        })
      );
    }

    if (options.userDetails && Object.keys(options.userDetails).length > 0) {
      store.dispatch(
        updateState({
          userDetails: {
            ...oldState.userDetails,
            ...options.userDetails,
          },
        })
      );
    }

    const state = store.getState().spotcheck;

    if (!state) {
      throw new Error('Failed to retrieve state.');
    }

    let traceId = state.traceId;
    let { isSpotPassed, isChecksPassed } = state;
    if (!traceId) {
      traceId = generateTraceId();
      store.dispatch(updateState({ traceId }));
    }

    let payloadUserDetails = { ...state.userDetails };

    if (
      !payloadUserDetails.email &&
      !payloadUserDetails.uuid &&
      !payloadUserDetails.mobile
    ) {
      const uuid = await loadData();
      if (typeof uuid === 'string') {
        payloadUserDetails.uuid = uuid;
      }
    }

    const payload = {
      screenName: screen,
      variables: state.variables,
      userDetails: payloadUserDetails,
      visitor: {
        deviceType: 'MOBILE',
        operatingSystem: Platform.OS,
        screenResolution: {
          height: Dimensions.get('window').height,
          width: Dimensions.get('window').width,
        },
        currentDate: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      traceId,
      customProperties: state.customProperties,
    };

    const url = `https://${state.domainName}/api/internal/spotcheck/widget/${state.targetToken}/properties?isSpotCheck=true&sdk=EXPO`;

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      const responseJson = response.data;

      if (responseJson.uuid) {
        await saveData(responseJson.uuid);
      }

      if (responseJson?.show) {
        if (responseJson?.show) {
          const appearance_response = await setAppearance(
            responseJson,
            screen,
            state.domainName,
            traceId,
            state.variables
          );
          if (appearance_response) {
            isSpotPassed = true;
            store.dispatch(updateState({ isSpotPassed: true }));
            return { valid: true };
          }
        } else {
          throw new Error('');
        }
      }

      if (!isSpotPassed && responseJson?.checkPassed) {
        if (responseJson.checkCondition) {
          const checkCondition = responseJson.checkCondition;
          store.dispatch(
            updateState({ afterDelay: checkCondition.afterDelay || 0 })
          );
          if (checkCondition.customEvent) {
            store.dispatch(
              updateState({ customEventsSpotChecks: [responseJson] })
            );
            throw new Error('');
          }
        }

        const appearance_response = await setAppearance(
          responseJson,
          screen,
          state.domainName,
          traceId,
          state.variables
        );
        if (appearance_response) {
          isChecksPassed = true;
          store.dispatch(updateState({ isChecksPassed: true }));
          return { valid: true };
        }
      }

      if (!isSpotPassed && !isChecksPassed && responseJson?.multiShow != null) {
        if (responseJson.multiShow) {
          store.dispatch(
            updateState({
              customEventsSpotChecks: responseJson.resultantSpotCheck,
            })
          );

          let selectedSpotCheck = {};
          let minDelay: Double = Infinity;

          for (const spotcheck of responseJson.resultantSpotCheck) {
            const checks = spotcheck?.checks || {};
            if (Object.keys(checks).length === 0) {
              minDelay = 0;
              selectedSpotCheck = spotcheck;
            } else if (checks.afterDelay != null) {
              const delay = parseFloat(checks.afterDelay);
              if (minDelay > delay) {
                minDelay = delay;
                selectedSpotCheck = spotcheck;
              }
            }
          }

          if (Object.keys(selectedSpotCheck).length > 0) {
            store.dispatch(updateState({ afterDelay: minDelay }));
            const appearance_response = await setAppearance(
              selectedSpotCheck,
              screen,
              state.domainName,
              traceId,
              state.variables
            );
            if (appearance_response) {
              return { valid: true };
            }
          }
        }
      }

      throw new Error(responseJson?.reason.toString());
    } else {
      throw new Error(`Received status code ${response.status}`);
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};

export const sendTrackEventRequest = async (
  screen: string,
  event: TrackEventProps
) => {
  try {
    const intMax = 4294967296;
    const state = store.getState().spotcheck;
    let selectedSpotCheckID = intMax;
    let { isSpotPassed } = state;
    if (state.customEventsSpotChecks.length > 0) {
      const eventKeys = Object.keys(event);
      for (const spotCheck of state.customEventsSpotChecks) {
        const checks = spotCheck?.checks ?? spotCheck?.checkCondition;

        if (checks) {
          const customEvent = checks?.customEvent;

          if (eventKeys.includes(customEvent?.eventName)) {
            selectedSpotCheckID =
              spotCheck?.id ?? spotCheck?.spotCheckId ?? intMax;
            let payloadUserDetails = { ...state.userDetails };

            if (selectedSpotCheckID !== intMax) {
              if (
                !payloadUserDetails?.email &&
                !payloadUserDetails?.uuid &&
                !payloadUserDetails?.mobile
              ) {
                const uuid = await loadData();
                if (uuid) {
                  payloadUserDetails.uuid = uuid;
                }
              }

              const payload = {
                screenName: screen,
                variables: state.variables,
                userDetails: payloadUserDetails,
                visitor: {
                  deviceType: 'MOBILE',
                  operatingSystem: Platform.OS,
                  screenResolution: {
                    height: Dimensions.get('window').height,
                    width: Dimensions.get('window').width,
                  },
                  currentDate: new Date().toISOString(),
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                spotCheckId: selectedSpotCheckID,
                eventTrigger: {
                  customEvent: event,
                },
                traceId: state.traceId,
                customProperties: state.customProperties,
              };

              const url = `https://${state.domainName}/api/internal/spotcheck/widget/${state.targetToken}/eventTrigger?isSpotCheck=true`;

              try {
                const response = await axios.post(url, payload, {
                  headers: {
                    'Content-Type': 'application/json',
                  },
                });

                if (response.status === 200) {
                  const responseJson = response.data;
                  console.log(responseJson.reason);
                  if (responseJson?.show != null) {
                    if (responseJson?.show) {
                      const appearance_response = await setAppearance(
                        responseJson,
                        screen,
                        state.domainName,
                        state.traceId,
                        state.variables
                      );

                      if (appearance_response) {
                        store.dispatch(updateState({ isSpotPassed: true }));
                        isSpotPassed = true;
                        return { valid: true };
                      }
                    }
                  }

                  if (!isSpotPassed && responseJson?.eventShow) {
                    if (responseJson?.checkCondition != null) {
                      const checkCondition = responseJson?.checkCondition;
                      store.dispatch(
                        updateState({
                          afterDelay: checkCondition?.afterDelay ?? 0,
                        })
                      );

                      if (checkCondition?.customEvent != null) {
                        store.dispatch(
                          updateState({
                            afterDelay:
                              checkCondition?.customEvent?.delayInSeconds ?? 0,
                          })
                        );
                      }
                    }

                    const appearance_response = await setAppearance(
                      responseJson,
                      screen,
                      state.domainName,
                      state.traceId,
                      state.variables
                    );

                    if (appearance_response) {
                      return { valid: true };
                    }
                  }

                  throw new Error(responseJson?.reason.toString());
                } else {
                  throw new Error(`Received status code ${response.status}`);
                }
              } catch (error: any) {
                throw new Error(error.message);
              }
            }
          }
        }
      }
      throw new Error('');
    } else {
      throw new Error('');
    }
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
};
