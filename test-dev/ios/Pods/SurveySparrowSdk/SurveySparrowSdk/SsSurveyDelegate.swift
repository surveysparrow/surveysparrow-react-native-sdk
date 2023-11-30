//
//  SsSurveyDelegate.swift
//  SurveySparrowSdk
//
//  Created by Ajay Sivan on 05/06/20.
//  Copyright © 2020 SurveySparrow. All rights reserved.
//

import Foundation

public protocol SsSurveyDelegate {
  func handleSurveyResponse(response: [String: AnyObject])
  func handleSurveyLoaded(response: [String: AnyObject])
  func handleSurveyValidation(response: [String: AnyObject])
}
