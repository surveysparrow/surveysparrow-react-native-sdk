import axios from 'axios';
import { Platform, Dimensions } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import { generateTraceId, setAppearance } from './HelperFunctions';
import { loadData, saveData } from './LocalStorage';
import { store, updateState } from './SpotCheckState';
import type { TrackEventProps } from './Types';

export const sendTrackScreenRequest = async (screen: string) => {
  const state = store.getState().spotcheck;
  let traceId = state.traceId;

  if (traceId === '') {
    traceId = generateTraceId();
    store.dispatch(updateState({ traceId }));
  }

  let payloadUserDetails = { ...state.userDetails };

  if (
    !payloadUserDetails.email &&
    !payloadUserDetails.uuid &&
    !payloadUserDetails.mobile
  ) {
    const uuid: string | null | undefined = await loadData();
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

  const url = `https://${state.domainName}/api/internal/spotcheck/widget/${state.targetToken}/properties?isSpotCheck=true`;

  try {
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

      if (responseJson.show != null) {
        if (responseJson.show) {
          return setAppearance(
            responseJson,
            screen,
            state.domainName,
            traceId,
            state.variables
          ).then(() => {
            store.dispatch(updateState({ isSpotPassed: true }));
            console.log(
              'Success: Spots or Checks or Visitor or Recurrence Condition Passed'
            );
            return { valid: true };
          });
        } else {
          console.log(
            'Error: Spots or Checks or Visitor or Recurrence Condition Failed'
          );
          return { valid: false };
        }
      } else {
        console.log('Error: Show not Received');
      }

      if (!state.isSpotPassed && responseJson.checkPassed) {
        if (responseJson.checkCondition) {
          const checkCondition = responseJson.checkCondition;
          store.dispatch(
            updateState({ afterDelay: checkCondition.afterDelay || 0 })
          );
          if (checkCondition.customEvent) {
            store.dispatch(
              updateState({ customEventsSpotChecks: [responseJson] })
            );
            return { valid: false };
          }
        }

        return setAppearance(
          responseJson,
          screen,
          state.domainName,
          traceId,
          state.variables
        ).then(() => {
          store.dispatch(updateState({ isChecksPassed: true }));
          return { valid: true };
        });
      }

      if (
        !state.isSpotPassed &&
        !state.isChecksPassed &&
        responseJson?.multiShow != null
      ) {
        if (responseJson.multiShow) {
          store.dispatch(
            updateState({
              customEventsSpotChecks: responseJson.resultantSpotCheck,
            })
          );

          let selectedSpotCheck = {};
          let minDelay: Double = Infinity;

          for (const spotcheck of state.customEventsSpotChecks) {
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
            return setAppearance(
              selectedSpotCheck,
              screen,
              state.domainName,
              traceId,
              state.variables
            ).then(() => {
              console.log('Info: MultiShow Received');
              return { valid: true };
            });
          }
        }
      } else {
        console.log('Info: MultiShow Not Received');
      }

      return { valid: false };
    } else {
      console.error('Error:', response.status);
      return { valid: false };
    }
  } catch (error) {
    console.error('Error:', error);
    return { valid: false };
  }
};

export const sendTrackEventRequest = async (
  screen: string,
  event: TrackEventProps
) => {
  const intMax = 4294967296;
  const state = store.getState().spotcheck;
  let selectedSpotCheckID = intMax;

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

                if (responseJson?.show != null) {
                  if (responseJson?.show) {
                    return setAppearance(
                      responseJson,
                      screen,
                      state.domainName,
                      state.traceId,
                      state.variables
                    ).then(() => {
                      store.dispatch(updateState({ isSpotPassed: true }));
                      console.log(
                        'Success: Spots or Checks or Visitor or Recurrence Condition Passed'
                      );
                      return { valid: true };
                    });
                  } else {
                    console.log(
                      'Error: Spots or Checks or Visitor or Recurrence Condition Failed'
                    );
                  }
                } else {
                  console.log('Error: Show not Received');
                }

                if (!state.isSpotPassed && responseJson?.eventShow) {
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
                  return setAppearance(
                    responseJson,
                    screen,
                    state.domainName,
                    state.traceId,
                    state.variables
                  ).then(() => {
                    console.log('Success: EventShow Condition Passed');
                    return { valid: true };
                  });
                } else {
                  console.log('Error: EventShow Condition Failed');
                }
              } else {
                console.error('Error:', response.status);
                return { valid: false };
              }
            } catch (error) {
              console.error('Error:', error);
              return { valid: false };
            }
          }
        }
      }
    }
    return { valid: false };
  } else {
    return { valid: false };
  }
};
