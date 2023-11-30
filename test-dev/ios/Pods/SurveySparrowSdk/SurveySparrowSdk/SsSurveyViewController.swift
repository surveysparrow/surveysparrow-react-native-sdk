//
//  SsSurveyViewController.swift
//  SurveySparrowSdk
//
//  Created by Ajay Sivan on 05/06/20.
//  Copyright © 2020 SurveySparrow. All rights reserved.
//

import UIKit

@IBDesignable
public class SsSurveyViewController: UIViewController, SsSurveyDelegate {
  // MARK: Properties
  public var surveyDelegate: SsSurveyDelegate!
  
  public var params: [String: String] = [:]
  public var widgetContactId: Int64 = 0
  public var surveyType: SurveySparrow.SurveyType = .CLASSIC
  public var getSurveyLoadedResponse: Bool = false
  
  @IBInspectable public var domain: String?
  @IBInspectable public var token: String?
  @IBInspectable public var thankyouTimeout: Double = 3.0

  // MARK: Initialize
  public override func viewDidLoad() {
    super.viewDidLoad()
    
    view.backgroundColor = view.backgroundColor == nil ? .white : view.backgroundColor
    if domain != nil && token != nil {
      let ssSurveyView = SsSurveyView()
      ssSurveyView.surveyDelegate = self
      ssSurveyView.params = params
      SsSurveyView.widgetContactId = widgetContactId
      ssSurveyView.getSurveyLoadedResponse = getSurveyLoadedResponse
      
      ssSurveyView.frame = view.bounds
      ssSurveyView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      
      ssSurveyView.loadSurvey(domain: domain, token: token)
      view.addSubview(ssSurveyView)
    } else {
      print("Error: Domain or token is nil")
    }
  }
  
  // MARK: Delegate
  public func handleSurveyResponse(response: [String : AnyObject]) {
    if surveyDelegate != nil {
      surveyDelegate.handleSurveyResponse(response: response)
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + thankyouTimeout) {
      self.dismiss(animated: true, completion: nil)
    }
  }

  public func handleSurveyLoaded(response: [String : AnyObject]){
    if surveyDelegate != nil {
        surveyDelegate.handleSurveyLoaded(response: response)
    }
  }
  public func handleSurveyValidation(response: [String : AnyObject]) {
    if surveyDelegate != nil {
      surveyDelegate.handleSurveyValidation(response: response)
    }
    DispatchQueue.main.asyncAfter(deadline: .now() + thankyouTimeout) {
      self.dismiss(animated: true, completion: nil)
    }
  }
}
