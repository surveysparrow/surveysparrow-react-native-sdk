//
//  SsSurveyViewManager.swift
//  SurveysparrowReactNativeSdk
//
//  Created by Sachin Kumar J on 01/10/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import SurveySparrowSdk

@objc(SsSurveyViewManager)
@available(iOS 13.0, *)
class SsSurveyViewManager: RCTViewManager{
    
    override func view() -> UIView! {
        return SsSurveyView()
    }
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
