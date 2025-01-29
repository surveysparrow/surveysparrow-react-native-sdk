import Foundation

@objc(SpotCheck)
class SpotCheck: NSObject {

  @objc(saveString:withValue:withResolver:withRejecter:)
  func saveString(key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let defaults = UserDefaults.standard
    defaults.set(value, forKey: key)
    let success = defaults.synchronize()
    if success {
      resolve(true)
    } else {
      reject("ERROR", "Could not save string", nil)
    }
  }

  @objc(getString:withResolver:withRejecter:)
  func getString(key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    let defaults = UserDefaults.standard
    if let value = defaults.string(forKey: key) {
      resolve(value)
    } else {
      resolve(NSNull())
    }
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
