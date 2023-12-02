//
//  SsSurveyModule.swift
//  SurveysparrowReactNativeSdk
//
//  Created by Sachin Kumar J on 01/10/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import Foundation
import SurveySparrowSdk

@objc(SsSurveyModule)
class SsSurveyModule:RCTEventEmitter,SsSurveyDelegate{
  @IBOutlet weak var ssSurveyView: SsSurveyView!
  public var surveyType: SurveySparrow.SurveyType = .CLASSIC
  
  @objc
  func openSurvey(_ options: NSDictionary){
    let domain = options.value(forKey: "domain") as! String
    let token = options.value(forKey: "token") as! String
    let queryItem = options.value(forKey: "customParams") as! [NSDictionary]
    let surveyTypeParam = options.value(forKey: "surveyType") as! NSString
    let thankYouRedirectTime = (options.value(forKey: "thankYouPageTimeLimit") as! NSString).doubleValue
    var paramsmap: [String: String] = [:]
    
    for val in queryItem {
        let querName = val.value(forKey: "name") as! String
        let querValue = val.value(forKey: "value") as! String
        paramsmap[querName] = querValue
    }
    
    if(surveyTypeParam == "nps"){
        surveyType = SurveySparrow.SurveyType.NPS
    }
    else{
        surveyType = SurveySparrow.SurveyType.CLASSIC
    }
    
    DispatchQueue.main.async {
      let controller = RCTPresentedViewController();

      let ssSurveyViewController = SsSurveyViewController()
          ssSurveyViewController.domain = domain
          ssSurveyViewController.token = token
          ssSurveyViewController.surveyDelegate = self
          ssSurveyViewController.params = paramsmap
        ssSurveyViewController.thankyouTimeout = thankYouRedirectTime
        ssSurveyViewController.surveyType = self.surveyType
        
      controller?.present(ssSurveyViewController, animated: true, completion: nil)
    }
    
  }
  
  @objc
  func scheduleSsSurvey(_ options: NSDictionary){
    let domain = options.value(forKey: "domain") as! String
    let token = options.value(forKey: "token") as! String
    let queryItem = options.value(forKey: "customParams") as! [NSDictionary]
    let surveyTypeParam = options.value(forKey: "surveyType") as! NSString
    let thankYouRedirectTime = (options.value(forKey: "thankYouPageTimeLimit") as! NSString).doubleValue
    let alertTitle = options.value(forKey: "alertTitle") as! String
    let alertMessage = options.value(forKey: "alertMessage") as! String
    let alertPositiveMessage = options.value(forKey: "alertPositiveText") as! String
    let alertNegativeMessage = options.value(forKey: "alertNegativeText") as! String
    let startAfter = options.value(forKey: "startAfter") as! Int64
    let repeatInterval = options.value(forKey: "repeatInterval") as! Int64
    let repeatSurvey = options.value(forKey: "repeatSurvey") as! Bool
    let incrementalSurvey = options.value(forKey: "incrementalRepeat") as! Bool
    var paramsmap: [String: String] = [:]
    
    for val in queryItem {
        let querName = val.value(forKey: "name") as! String
        let querValue = val.value(forKey: "value") as! String
        paramsmap[querName] = querValue
    }
    
    if(surveyTypeParam == "nps"){
        surveyType = SurveySparrow.SurveyType.NPS
    }
    else{
        surveyType = SurveySparrow.SurveyType.CLASSIC
    }
    
    DispatchQueue.main.async {
        let surveySparrow = SurveySparrow(domain: domain, token: token)
        surveySparrow.params = paramsmap
        surveySparrow.surveyType = self.surveyType
        surveySparrow.thankyouTimout = thankYouRedirectTime
        surveySparrow.alertTitle = alertTitle
        surveySparrow.alertMessage = alertMessage
        surveySparrow.alertPositiveButton = alertPositiveMessage
        surveySparrow.alertNegativeButton = alertNegativeMessage
        surveySparrow.startAfter = startAfter
        surveySparrow.repeatInterval = repeatInterval
        surveySparrow.repeatSurvey = repeatSurvey
        surveySparrow.incrementalRepeat = incrementalSurvey
        surveySparrow.surveyDelegate = self
        
        let controller = RCTPresentedViewController();
        surveySparrow.scheduleSurvey(parent: controller!)
    }
  }
    
  @objc
  func clearscheduleSsSurvey(_ options: NSDictionary){
        let domain = options.value(forKey: "domain") as! String
        let token = options.value(forKey: "token") as! String
        DispatchQueue.main.async {
            let surveySparrow = SurveySparrow(domain: domain, token: token)
            surveySparrow.clearSchedule()
        }
    }
    
  override func supportedEvents() -> [String]! {
    return["onSurveyResponse"]
  }
  
  func handleSurveyResponse(response: [String : AnyObject]) {
      sendEvent(withName: "onSurveyResponse", body: response)
  }
    
  func handleSurveyLoaded(response: [String : AnyObject]) {
        print(response)
  }
    
    func handleSurveyValidation(response: [String : AnyObject]) {
      print(response)
    }
  
  override static func requiresMainQueueSetup() -> Bool {
      return true
  }
}

