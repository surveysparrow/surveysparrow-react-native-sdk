@objc(SurveysparrowReactNativeSdk)
class SurveysparrowReactNativeSdk: NSObject {

  @objc
  func putString(_ key: String, value: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
      UserDefaults.standard.set(value, forKey: key)
      let success = UserDefaults.standard.synchronize()
      if success {
          resolver(true)
      } else {
          rejecter("SAVE_ERROR", "Could not save string", nil)
      }
  }

  @objc
  func getString(_ key: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
      if let value = UserDefaults.standard.string(forKey: key) {
          resolver(value)
      } else {
          resolver(nil)
      }
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
      return false
  }
}
