#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SpotCheck, NSObject)

RCT_EXTERN_METHOD(saveString:(NSString *)key withValue:(NSString *)value
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getString:(NSString *)key
                 withResolver:(RCTPromiseResolveBlock)resolve
                 withRejecter:(RCTPromiseRejectBlock)reject)

@end
