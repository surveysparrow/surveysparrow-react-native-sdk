//
//  SsSurveyViewManager.m
//  SurveysparrowReactNativeSdk
//
//  Created by Sachin Kumar J on 01/10/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

#import "React/RCTBridgeModule.h"
#import "React/RCTEventEmitter.h"
#import "React/RCTViewManager.h"

@interface RCT_EXTERN_MODULE(SsSurveyViewManager, RCTViewManager)
RCT_EXPORT_VIEW_PROPERTY(surveyDomain, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onUpdate, RCTDirectEventBlock)
@end

