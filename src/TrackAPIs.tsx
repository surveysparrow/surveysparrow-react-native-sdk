import axios from 'axios';
import { Platform, Dimensions } from 'react-native';
import type { Double } from 'react-native/Libraries/Types/CodegenTypes';
import { generateTraceId, setAppearance } from './HelperFunctions';
import { loadData, saveData } from './LocalStorage';
import {
  store,
  setTraceId,
  setIsSpotPassed,
  setAfterDelay,
  setCustomEventsSpotChecks,
  setIsChecksPassed,
} from './SpotCheckState';

export const sendTrackScreenRequest = async (screen: string) => {
  if (store.getState().spotcheck.traceId === '') {
    const traceId = generateTraceId();

    store.dispatch(setTraceId(traceId));
  }

  const payloadUserDetails = { ...store.getState().spotcheck.userDetails };

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
    variables: store.getState().spotcheck.variables,
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
    traceId: store.getState().spotcheck.traceId,
    customProperties: store.getState().spotcheck.customProperties,
    "sdk" : "REACT NATIVE"
  };

  const url = `https://${store.getState().spotcheck.domainName}/api/internal/spotcheck/widget/${store.getState().spotcheck.targetToken}/properties?isSpotCheck=true`;

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
          setAppearance(
            responseJson,
            screen,
            store.getState().spotcheck.domainName,
            store.getState().spotcheck.traceId,
            store.getState().spotcheck.variables
          );
          store.dispatch(setIsSpotPassed(true));
          console.log(
            'Success: Spots or Checks or Visitor or Reccurence Condition Passed'
          );
          return { valid: true };
        } else {
          console.log(
            'Error: Spots or Checks or Visitor or Reccurence Condition Failed'
          );
          return { valid: false };
        }
      } else {
        console.log('Error: Show not Received');
      }

      if (!store.getState().spotcheck.isSpotPassed) {
        if (responseJson.checkPassed) {
          if (responseJson.checkCondition) {
            const checkCondition = responseJson.checkCondition;
            if (checkCondition?.afterDelay) {
              store.dispatch(
                setAfterDelay(responseJson.checkCondition.afterDelay)
              );
            } else {
              store.dispatch(setAfterDelay(0));
            }

            if (checkCondition?.customEvent) {
              store.dispatch(setCustomEventsSpotChecks([responseJson!]));
              return { valid: false };
            }
          }

          setAppearance(
            responseJson,
            screen,
            store.getState().spotcheck.domainName,
            store.getState().spotcheck.traceId,
            store.getState().spotcheck.variables
          );
          store.dispatch(setIsChecksPassed(true));
          return { valid: true };
        } else {
          console.log('Error: Check not recieved');
        }
      }

      if (
        !store.getState().spotcheck.isSpotPassed &&
        !store.getState().spotcheck.isChecksPassed
      ) {
        if (responseJson?.multiShow != null) {
          if (responseJson?.multiShow) {
            store.dispatch(
              setCustomEventsSpotChecks(responseJson.resultantSpotCheck)
            );

            var selectedSpotCheck: any = {};
            var minDelay: Double = 93359684956;

            for (var spotcheck of store.getState().spotcheck
              .customEventsSpotChecks) {
              const checks: any = spotcheck?.checks;

              if (Object.keys(checks).length === 0) {
                minDelay = 0;
                selectedSpotCheck = spotcheck;
              } else if (checks?.afterDelay != null) {
                const delay = parseFloat(checks?.afterDelay);
                if (minDelay > delay) {
                  minDelay = delay;
                  selectedSpotCheck = spotcheck;
                }
              }
            }

            if (selectedSpotCheck != null) {
              const checks = selectedSpotCheck?.checks;

              if (checks != null) {
                store.dispatch(setAfterDelay(minDelay));
              }
            }

            if (Object.keys(selectedSpotCheck).length > 0) {
              setAppearance(
                selectedSpotCheck,
                screen,
                store.getState().spotcheck.domainName,
                store.getState().spotcheck.traceId,
                store.getState().spotcheck.variables
              );

              console.log('Info: MultiShow Received');
              return { valid: true };
            }
          }
        } else {
          console.log('Info: MultiShow Not Received');
        }
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

export const sendTrackEventRequest = async (screen: string, event: Event) => {
  const intMax = 4294967296;

  var selectedSpotCheckID = intMax;

  if (store.getState().spotcheck.customEventsSpotChecks.length > 0) {
    const eventKeys = Object.keys(event);
    for (var spotCheck of store.getState().spotcheck.customEventsSpotChecks) {
      const checks = spotCheck?.checks ?? spotCheck?.checkCondition;

      if (checks) {
        const customEvent = checks?.customEvent;

        if (eventKeys.includes(customEvent?.eventName)) {
          selectedSpotCheckID =
            spotCheck?.id ?? spotCheck?.spotCheckId ?? intMax;
          const payloadUserDetails = {
            ...store.getState().spotcheck.userDetails,
          };

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
              variables: store.getState().spotcheck.variables,
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
              traceId: store.getState().spotcheck.traceId,
              customProperties: store.getState().spotcheck.customProperties,
            };

            const url = `https://${store.getState().spotcheck.domainName}/api/internal/spotcheck/widget/${store.getState().spotcheck.targetToken}/eventTrigger?isSpotCheck=true`;

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
                    setAppearance(
                      responseJson,
                      screen,
                      store.getState().spotcheck.domainName,
                      store.getState().spotcheck.traceId,
                      store.getState().spotcheck.variables
                    );
                    store.dispatch(setIsSpotPassed(true));
                    console.log(
                      'Success: Spots or Checks or Visitor or Reccurence Condition Passed'
                    );
                    return { valid: true };
                  } else {
                    console.log(
                      'Error: Spots or Checks or Visitor or Reccurence Condition Failed'
                    );
                  }
                } else {
                  console.log('Error: Show not Received');
                }

                if (!store.getState().spotcheck.isSpotPassed) {
                  if (responseJson?.eventShow) {
                    if (responseJson?.checkCondition != null) {
                      const checkCondition = responseJson?.checkCondition;
                      if (checkCondition?.afterDelay != null) {
                        store.dispatch(
                          setAfterDelay(checkCondition?.afterDelay)
                        );
                      }

                      if (checkCondition?.customEvent != null) {
                        const delay =
                          checkCondition?.customEvent?.delayInSeconds;
                        store.dispatch(setAfterDelay(delay ?? 0));
                      }
                    }
                    setAppearance(
                      responseJson,
                      screen,
                      store.getState().spotcheck.domainName,
                      store.getState().spotcheck.traceId,
                      store.getState().spotcheck.variables
                    );

                    console.log('Success: EventShow Condition Passed');

                    return { valid: true };
                  } else {
                    console.log('Error: EventShow Condition Failed');
                  }
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
