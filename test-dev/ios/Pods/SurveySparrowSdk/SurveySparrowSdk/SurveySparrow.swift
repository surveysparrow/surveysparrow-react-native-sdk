//
//  SurveySparrow.swift
//  SurveySparrowSdk
//
//  Created by Ajay Sivan on 06/06/20.
//  Copyright © 2020 SurveySparrow. All rights reserved.
//

import Foundation
import UIKit

public class SurveySparrow: SsSurveyDelegate {
  // MARK: Properties
  private var dataStore = NSUbiquitousKeyValueStore()
  private var domain: String
  private var token: String
  
  public var surveyType: SurveyType = .CLASSIC
  public var params: [String: String] = [:]
  public var thankyouTimout: Double = 3.0
  public var surveyDelegate: SsSurveyDelegate!
  public var alertTitle: String = "Rate us"
  public var alertMessage: String = "Share your feedback and let us know how we are doing"
  public var alertPositiveButton: String = "Rate Now"
  public var alertNegativeButton: String = "Later"
  public var isConnectedToNetwork: Bool = true
  public var startAfter: Int64 = 259200000 // 3 days
  public var repeatInterval: Int64 = 432000000 // 5 days
  public var incrementalRepeat: Bool = false
  public var repeatSurvey: Bool = false
  public var getSurveyLoadedResponse: Bool = false
  
  private var isAlreadyTakenKey = "isAlreadyTaken_"
  private var promptTimeKey = "promptTime_"
  private var incrementMultiplierKey = "incrementMultiplier_"
  
  // MARK: Initialization
  public init(domain: String, token: String) {
    self.domain = domain
    self.token = token
    
    isAlreadyTakenKey += token
    promptTimeKey += token
    incrementMultiplierKey += token
  }
  
  // MARK: Data Type
  public enum SurveyType {
    case CLASSIC
    case CHAT
    case NPS
  }
  
  // MARK: Public methods
  public func scheduleSurvey(parent: UIViewController) {
    let currentTime = Int64(Date().timeIntervalSince1970 * 1000)
    let isAlreadyTaken = UserDefaults.standard.bool(forKey: isAlreadyTakenKey)
    let promptTime = UserDefaults.standard.integer(forKey: promptTimeKey)
    var incrementMultiplier = UserDefaults.standard.integer(forKey: incrementMultiplierKey)
    incrementMultiplier = incrementMultiplier == 0 ? 1 : incrementMultiplier
    
    if promptTime == 0 {
      let nextPrompt = currentTime + startAfter
      UserDefaults.standard.set(nextPrompt, forKey: promptTimeKey)
      dataStore.set(1, forKey: incrementMultiplierKey)
      return
    }
    if self.domain != nil && self.token != nil {
      if isConnectedToNetwork && (!isAlreadyTaken || repeatSurvey) && (promptTime < currentTime) {
      var isActive: Bool = false
      var reason: String = ""
      let group = DispatchGroup()
      var widgetContactId: Int64 = 0 ;
      group.enter()
      let completion: ([String: Any]) -> Void = { result in
        if let active = result["active"] as? Bool {
          isActive = active
        }
        if let reasonData = result["reason"] as? String {
          reason = reasonData
        }
        if let widgetContactIdData = result["widgetContactId"] as? Int64 {
          widgetContactId = widgetContactIdData
        }
      }
      validateSurvey(domain:domain,token:token,params:self.params, group: group,completion:completion);
      group.wait()
    if isActive == true {
    
        let alertDialog = UIAlertController(title: alertTitle, message: alertMessage, preferredStyle: UIAlertController.Style.alert)
        alertDialog.addAction(UIAlertAction(title: alertPositiveButton, style: UIAlertAction.Style.default, handler: {action in
          let ssSurveyViewController = SsSurveyViewController()
          ssSurveyViewController.domain = self.domain
          ssSurveyViewController.token = self.token
          ssSurveyViewController.params = self.params
          ssSurveyViewController.widgetContactId = widgetContactId
          ssSurveyViewController.getSurveyLoadedResponse = self.getSurveyLoadedResponse
          ssSurveyViewController.thankyouTimeout = self.thankyouTimout
          ssSurveyViewController.surveyDelegate = self
          parent.present(ssSurveyViewController, animated: true, completion: nil)
        }))
        alertDialog.addAction(UIAlertAction(title: alertNegativeButton, style: UIAlertAction.Style.cancel, handler: nil))
        parent.present(alertDialog, animated: true)
        
        UserDefaults.standard.set(incrementalRepeat ? incrementMultiplier * 2 : 1, forKey: self.incrementMultiplierKey)
        let timeTillNext = repeatInterval * Int64(incrementMultiplier)
        let nextPrompt = currentTime + timeTillNext
        UserDefaults.standard.set(nextPrompt, forKey: promptTimeKey)
      } else {
       self.handleSurveyValidation(response: [
            "active": String(isActive),
            "reason": reason,
          ] as  [String: AnyObject])
    }
    } 
  }
  }

  public func clearSchedule() {
    UserDefaults.standard.removeObject(forKey: incrementMultiplierKey)
    UserDefaults.standard.removeObject(forKey: isAlreadyTakenKey)
    UserDefaults.standard.removeObject(forKey: promptTimeKey)
  }
  
  // MARK: Delegate
  public func handleSurveyResponse(response: [String : AnyObject]) {
    UserDefaults.standard.set(true, forKey: isAlreadyTakenKey)
    if surveyDelegate != nil {
      self.surveyDelegate.handleSurveyResponse(response: response)
    }
  }

  public func handleSurveyLoaded(response: [String : AnyObject]){
    if surveyDelegate != nil {
        self.surveyDelegate.handleSurveyResponse(response: response)
    }
  }

   public func handleSurveyValidation(response: [String : AnyObject]) {
    UserDefaults.standard.set(true, forKey: isAlreadyTakenKey)
    if surveyDelegate != nil {
      self.surveyDelegate.handleSurveyResponse(response: response)
    }
  }
}
