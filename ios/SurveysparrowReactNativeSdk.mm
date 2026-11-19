#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SurveysparrowReactNativeSdk, NSObject)

RCT_EXTERN_METHOD(putString:(NSString *)key
                  value:(NSString *)value
              resolver:(RCTPromiseResolveBlock)resolver
              rejecter:(RCTPromiseRejectBlock)rejecter)

RCT_EXTERN_METHOD(getString:(NSString *)key
              resolver:(RCTPromiseResolveBlock)resolver
              rejecter:(RCTPromiseRejectBlock)rejecter)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
