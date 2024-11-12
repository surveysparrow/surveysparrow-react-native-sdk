//
//  SsSurveyView.swift
//  SurveySparrowSdk
//
//  Created by Ajay Sivan on 05/06/20.
//  Copyright © 2020 SurveySparrow. All rights reserved.
//

import UIKit
import WebKit

@available(iOS 13.0, *)
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
    @IBInspectable public var sparrowLang: String?
    
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
        
        let closeButtonWrapper = UIView()
        ssWebView.addSubview(closeButtonWrapper)
        
        closeButton.setImage(UIImage(systemName: "xmark"), for: .normal)
        closeButton.tintColor = .black
        closeButton.addTarget(self, action: #selector(closeButtonTapped), for: .touchUpInside)
        
        closeButtonWrapper.addSubview(closeButton)
        closeButtonWrapper.translatesAutoresizingMaskIntoConstraints = false
        closeButtonWrapper.backgroundColor = .white
        closeButtonWrapper.layer.cornerRadius = 4
        closeButtonWrapper.clipsToBounds = true

        NSLayoutConstraint.activate([
            
            closeButtonWrapper.topAnchor.constraint(equalTo: ssWebView.safeAreaLayoutGuide.topAnchor, constant: 16),
            closeButtonWrapper.trailingAnchor.constraint(equalTo: ssWebView.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            closeButtonWrapper.widthAnchor.constraint(equalToConstant: 35),
            closeButtonWrapper.heightAnchor.constraint(equalToConstant: 35),

            closeButton.centerXAnchor.constraint(equalTo: closeButtonWrapper.centerXAnchor),
            closeButton.centerYAnchor.constraint(equalTo: closeButtonWrapper.centerYAnchor),
            closeButton.widthAnchor.constraint(equalToConstant: 14),
            closeButton.heightAnchor.constraint(equalToConstant: 14)
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
        
        if surveyDelegate != nil {
            surveyDelegate.handleCloseButtonTap()
        }
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
        if navigationAction.navigationType == .linkActivated {
            if let url = navigationAction.request.url {
                UIApplication.shared.openURL(url)
                decisionHandler(.cancel)
                return
            }
        }
        decisionHandler(.allow)
    }
    
    public func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("Failed to load web page: \(error.localizedDescription)")
    }
    
    public func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        
        let jsCode = """
                        var observer = new MutationObserver(function(mutations) {
                            mutations.forEach(function(mutation) {
                                var elements = document.getElementsByClassName('ss-language-selector--wrapper ss-survey-font-family');
                                if (elements.length > 0) {
                                    for (var i = 0; i < elements.length; i++) {
                                        elements[i].style.marginRight = '45px';
                                    }
                                    observer.disconnect();
                                }
                            });
                        });
                        
                        observer.observe(document.body, { childList: true, subtree: true });
                        """
        
        webView.evaluateJavaScript(jsCode, completionHandler: { (result, error) in
            if let error = error {
                print("Error in CloseButton")
            }
        })
        
        loader.stopAnimating()
    }
    
    public func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        loader.stopAnimating()
    }
    
    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if let surveyDelegate = surveyDelegate,
           let response = message.body as? [String: AnyObject],
           let responseType = response["type"] as? String {

            if responseType == surveyLoaded {
                surveyDelegate.handleSurveyLoaded(response: response)
            } else if responseType == surveyCompleted {
                surveyDelegate.handleSurveyResponse(response: response)
            }
        }
    }
    
    public func loadFullscreenSurvey(parent: UIViewController,delegate:SsSurveyDelegate, domain: String? = nil, token: String? = nil, params: [String: String]? = [:], sparrowLang: String? = nil) {
        let ssSurveyViewController = SsSurveyViewController()
        ssSurveyViewController.domain = domain
        ssSurveyViewController.token = token
        ssSurveyViewController.sparrowLang = sparrowLang
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
    
    public func loadEmbedSurvey(domain: String? = nil, token: String? = nil, params: [String: String]? = [:], sparrowLang: String? = nil) {
        self.domain = domain != nil ? domain! : self.domain
        self.token = token != nil ? token! : self.token
        self.sparrowLang = sparrowLang != nil ? sparrowLang! : self.sparrowLang
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
                loadSurvey(domain:domain,token:token,sparrowLang: sparrowLang)
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
    public func loadSurvey(domain: String? = nil, token: String? = nil, sparrowLang: String? = nil) {
        self.domain = domain != nil ? domain! : self.domain
        self.token = token != nil ? token! : self.token
        self.sparrowLang = sparrowLang != nil ? sparrowLang! : self.sparrowLang
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
            urlComponent.queryItems?.append(URLQueryItem(name: "sparrowLang", value: sparrowLang))
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
