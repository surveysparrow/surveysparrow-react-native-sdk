//
//  SsSurveyView.swift
//  SurveysparrowReactNativeSdk
//
//  Created by Sachin Kumar J on 01/10/21.
//  Copyright © 2021 Facebook. All rights reserved.
//

import UIKit
import WebKit
import SurveySparrowSdk

class SsSurveyView:  UIView, WKScriptMessageHandler, WKNavigationDelegate {
      @objc var onUpdate: RCTDirectEventBlock?
      
      @objc var surveyDomain : NSDictionary = [:] {
        didSet{
          self.setupSurvey()
        }
      }

      // MARK: Properties
      private var ssWebView: WKWebView = WKWebView()
      private let surveyResponseHandler = WKUserContentController()
      private let loader: UIActivityIndicatorView = UIActivityIndicatorView()
      
      public var surveyType: SurveySparrow.SurveyType = .CLASSIC
            
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
        surveyResponseHandler.add(self,name:"surveyLoadStarted")
        
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
      
      // MARK: Public methods
      public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        loader.stopAnimating()
      }
      
      public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        loader.stopAnimating()
      }
      
      public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let responsen = message.body as! [String: AnyObject]
        onUpdate!(["result":responsen])
        if surveyDelegate != nil {
          let response = message.body as! [String: AnyObject]
          surveyDelegate.handleSurveyResponse(response: response)
        }
      }
      
      public func setupSurvey () {
        loader.startAnimating()
        let domain = self.surveyDomain.value(forKey: "domain") as! NSString
        let token = self.surveyDomain.value(forKey: "token") as! NSString
        let queryItem = self.surveyDomain.value(forKey: "customParams") as! [NSDictionary]
        let surveyTypeParam = self.surveyDomain.value(forKey: "surveyType") as! NSString
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
        
        var urlComponent = URLComponents()
          urlComponent.scheme = "https"
          urlComponent.host = domain.trimmingCharacters(in: CharacterSet.whitespaces)
          urlComponent.path = "/\(surveyType == .NPS ? "n" : "s")/ios/\(token.trimmingCharacters(in: CharacterSet.whitespaces))"
          urlComponent.queryItems = paramsmap.map {
            URLQueryItem(name: $0.key, value: $0.value)
          }

          if let url = urlComponent.url {
            let request = URLRequest(url: url)
            ssWebView.load(request)
          }

      }
}
