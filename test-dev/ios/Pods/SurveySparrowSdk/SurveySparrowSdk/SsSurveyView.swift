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
  private var surveyLoaded: String = "surveyLoadStarted"
  private var surveyCompleted: String = "surveyCompleted"
  private static var _widgetContactId: Int64?
  
  public static var widgetContactId: Int64? {
    get {
      return _widgetContactId
    }
    set {
      _widgetContactId = newValue
    }
  }
  public var params: [String: String] = [:]
  public var surveyType: SurveySparrow.SurveyType = .CLASSIC
  public var getSurveyLoadedResponse: Bool = false
  
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
  var closeButton = UIButton(type: .system)
  // MARK: Private methods
  private func addFeedbackView() {    
    let config = WKWebViewConfiguration()
    config.preferences.javaScriptEnabled = true
    config.userContentController = surveyResponseHandler
    ssWebView = WKWebView(frame: bounds, configuration: config)
    surveyResponseHandler.add(self, name: "surveyResponse")
    ssWebView.navigationDelegate = self
    ssWebView.backgroundColor = .gray
    ssWebView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    addSubview(ssWebView)
    closeButton.setTitle("X", for: .normal)
    closeButton.titleLabel?.font = UIFont.systemFont(ofSize: 20)
    closeButton.tintColor = .black
    closeButton.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
    ssWebView.addSubview(closeButton)
    NSLayoutConstraint.activate([
      NSLayoutConstraint(
        item: closeButton, attribute: .top, relatedBy: .equal, toItem: ssWebView,
        attribute: .top, multiplier: 1, constant: 16),
      NSLayoutConstraint(
        item: closeButton, attribute: .trailing, relatedBy: .equal, toItem: ssWebView,
        attribute: .trailing, multiplier: 1, constant: -16),
      NSLayoutConstraint(
        item: closeButton, attribute: .width, relatedBy: .equal, toItem: nil,
        attribute: .notAnAttribute, multiplier: 1, constant: 24),
      NSLayoutConstraint(
        item: closeButton, attribute: .height, relatedBy: .equal, toItem: nil,
        attribute: .notAnAttribute, multiplier: 1, constant: 24),
    ])
    
    ssWebView.addSubview(loader)
    ssWebView.navigationDelegate = self
    loader.translatesAutoresizingMaskIntoConstraints = false
    loader.centerXAnchor.constraint(equalTo: ssWebView.centerXAnchor).isActive = true
    loader.centerYAnchor.constraint(equalTo: ssWebView.centerYAnchor).isActive = true
    loader.hidesWhenStopped = true
  }

  @objc func closeButtonTapped() {
    var isSuccess = false
    // Check if widgetContactId is valid and not 0
    if let unwrappedId = SsSurveyView.widgetContactId, unwrappedId != 0 {
      let group = DispatchGroup()
      group.enter()
      let completion: ([String: Any]) -> Void = { result in
        if let success = result["success"] as? Bool {
          isSuccess = success
        }
      }
      closeSurvey(
        domain: domain, widgetContactId: unwrappedId, params: params, group: group,
        completion: completion)

      group.wait()
    }
    // Close the survey
    closeSurveyUI(isSuccess: isSuccess)
  }

  func closeSurveyUI(isSuccess: Bool) {
    let emptyHTML = "<html><body></body></html>"
    ssWebView.loadHTMLString(emptyHTML, baseURL: nil)
    closeButton.isHidden = true

    if let parentViewController = findParentViewController() {
      parentViewController.dismiss(animated: true, completion: nil)
    }
  }

  private func findParentViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let currentResponder = responder {
      if let viewController = currentResponder as? UIViewController {
        return viewController
      }
      responder = currentResponder.next
    }
    return nil
  }
  
  public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Check if this is a navigation action caused by a hyperlink click.
        if navigationAction.navigationType == .linkActivated {
            // Handle the URL navigation here, for example:
            if let url = navigationAction.request.url {
                UIApplication.shared.openURL(url)
                decisionHandler(.cancel) // Prevent WKWebView from loading the URL.
                return
            }
        }
        decisionHandler(.allow) // Allow other navigation actions.
    }
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Failed to load web page: \(error.localizedDescription)")
    }

  public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
    closeButton.translatesAutoresizingMaskIntoConstraints = false
    loader.stopAnimating()
  }
  
  public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
    loader.stopAnimating()
  }
  
 public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
    if surveyDelegate != nil {
      let response = message.body as! [String: AnyObject]
      let responseType = response["type"] as! String
      if(responseType == surveyLoaded){
        if surveyDelegate != nil {
          surveyDelegate.handleSurveyLoaded(response: response)
        }
      }
      if(responseType == surveyCompleted){
        if surveyDelegate != nil {
          surveyDelegate.handleSurveyResponse(response: response)
        }
      }
    }
  }

  public func loadFullscreenSurvey(parent: UIViewController,delegate:SsSurveyDelegate, domain: String? = nil, token: String? = nil, params: [String: String]? = [:]) {
    let ssSurveyViewController = SsSurveyViewController()
    ssSurveyViewController.domain = domain
    ssSurveyViewController.token = token
    if(params != nil){
        ssSurveyViewController.params = params ?? [:]
    }
    ssSurveyViewController.getSurveyLoadedResponse = true
    if domain != nil && token != nil {
      ssSurveyViewController.surveyDelegate = delegate
      var isActive: Bool = false
      var reason: String = ""
      let group = DispatchGroup()
      group.enter()
      let completion: ([String: Any]) -> Void = { result in
        if let active = result["active"] as? Bool {
          isActive = active
        }
        if let reasonData = result["reason"] as? String {
          reason = reasonData
        }
        if let widgetContactIdData = result["widgetContactId"] as? Int64 {
          SsSurveyView.widgetContactId = widgetContactIdData
        }
      }
      validateSurvey(domain:domain,token:token,params: params, group: group,completion:completion);
      group.wait()
     if  isActive == true {
          parent.present(ssSurveyViewController, animated: true)
      } else {
          ssSurveyViewController.surveyDelegate.handleSurveyValidation(response: [
            "active": String(isActive),
            "reason": reason,
          ] as  [String: AnyObject])
      }
    }
  }

  public func loadEmbedSurvey(domain: String? = nil, token: String? = nil, params: [String: String]? = [:]) {
    self.domain = domain != nil ? domain! : self.domain
    self.token = token != nil ? token! : self.token
     if self.domain != nil && self.token != nil {
      var isActive: Bool = false
      var reason: String = ""
      let group = DispatchGroup()
      group.enter()
      let completion: ([String: Any]) -> Void = { result in
        if let active = result["active"] as? Bool {
          isActive = active
        }
        if let reasonData = result["reason"] as? String {
          reason = reasonData
        }
        if let widgetContactIdData = result["widgetContactId"] as? Int64 {
          SsSurveyView.widgetContactId = widgetContactIdData
        }
      }
      validateSurvey(domain:domain,token:token,params: params,group: group,completion:completion);
      group.wait()
      if  isActive == true {
        if(params != nil){
        self.params = params ?? [:]
        }
        loadSurvey(domain:domain,token:token)
        closeButton.isHidden = false ;
      } else {
         self.handleSurveyValidation(response: [
            "active": String(isActive),
            "reason": reason,
          ] as  [String: AnyObject])
      }
     }
  }
  
  // MARK: Public method
  public func loadSurvey(domain: String? = nil, token: String? = nil) {
    self.domain = domain != nil ? domain! : self.domain
    self.token = token != nil ? token! : self.token
    if self.domain != nil && self.token != nil {
      loader.startAnimating()
      var urlComponent = URLComponents()
      urlComponent.scheme = "https"
      urlComponent.host = self.domain!.trimmingCharacters(in: CharacterSet.whitespaces)
      urlComponent.path = "/\(surveyType == .NPS ? "n" : "s")/ios/\(self.token!.trimmingCharacters(in: CharacterSet.whitespaces))"
      if(getSurveyLoadedResponse){
        params["isSurveyLoaded"] = "true"
      }
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

  func handleSurveyValidation(response: [String : AnyObject]) {
    print(response)
  }
}
