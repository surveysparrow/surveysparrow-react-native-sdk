//
//  SsSurveyModule.m
//  SurveysparrowReactNativeSdk
//
//  Created by Sachin Kumar J on 01/10/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"

@interface RCT_EXTERN_MODULE(SsSurveyModule, NSObject)
RCT_EXTERN_METHOD(openSurvey:(NSDictionary *)options)
RCT_EXTERN_METHOD(scheduleSsSurvey:(NSDictionary *)options)
RCT_EXTERN_METHOD(clearscheduleSsSurvey:(NSDictionary *)options)
@end
