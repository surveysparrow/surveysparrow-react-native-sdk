//
//  SsSurveyView.swift
//  SurveySparrowSdk
//
//  Created by Ajay Sivan on 05/06/20.
//  Copyright © 2020 SurveySparrow. All rights reserved.
//

import UIKit
import WebKit

@IBDesignable public class SsSurveyView: UIView, WKScriptMessageHandler, WKNavigationDelegate {
  // MARK: Properties
  private var ssWebView: WKWebView = WKWebView()
  private let surveyResponseHandler = WKUserContentController()
  private let loader: UIActivityIndicatorView = UIActivityIndicatorView()
  
  public var params: [String: String] = [:]
  public var surveyType: SurveySparrow.SurveyType = .CLASSIC
  
  @IBInspectable public var domain: String?
  @IBInspectable public var token: String?
  
  public var surveyDelegate: SsSurveyDelegate!
  
  // MARK: Initialization
  override init(frame: CGRect) {
    super.init(frame: frame)
    addFeedbackView()
  }
  
  required init?(coder: NSCoder) {
    super.init(coder: coder)
    addFeedbackView()
  }
  
  // MARK: Private methods
  private func addFeedbackView() {    
    let config = WKWebViewConfiguration()
    config.userContentController = surveyResponseHandler
    
    ssWebView = WKWebView(frame: bounds, configuration: config)
    surveyResponseHandler.add(self, name: "surveyResponse")
    
    ssWebView.backgroundColor = .gray
    ssWebView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(ssWebView)
    
    ssWebView.addSubview(loader)
    ssWebView.navigationDelegate = self
    loader.translatesAutoresizingMaskIntoConstraints = false
    loader.centerXAnchor.constraint(equalTo: ssWebView.centerXAnchor).isActive = true
    loader.centerYAnchor.constraint(equalTo: ssWebView.centerYAnchor).isActive = true
    loader.hidesWhenStopped = true
  }
  
  public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    loader.stopAnimating()
  }
  
  public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    loader.stopAnimating()
  }
  
  public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if surveyDelegate != nil {
      let response = message.body as! [String: AnyObject]
      surveyDelegate.handleSurveyResponse(response: response)
    }
  }
  
  // MARK: Public method
  public func loadSurvey(domain: String? = nil, token: String? = nil) {
    loader.startAnimating()
    self.domain = domain != nil ? domain! : self.domain
    self.token = token != nil ? token! : self.token
    if self.domain != nil && self.token != nil {
      var urlComponent = URLComponents()
      urlComponent.scheme = "https"
      urlComponent.host = self.domain!.trimmingCharacters(in: CharacterSet.whitespaces)
      urlComponent.path = "/\(surveyType == .NPS ? "n" : "s")/ios/\(self.token!.trimmingCharacters(in: CharacterSet.whitespaces))"
      urlComponent.queryItems = params.map {
        URLQueryItem(name: $0.key, value: $0.value)
      }
      
      if let url = urlComponent.url {
        let request = URLRequest(url: url)
        ssWebView.load(request)
      }
    } else {
      print("Error: Domain or token is nil")
    }
  }
}
