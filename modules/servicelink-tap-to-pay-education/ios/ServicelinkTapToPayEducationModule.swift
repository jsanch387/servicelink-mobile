import ExpoModulesCore
import UIKit

#if canImport(ProximityReader)
import ProximityReader
#endif

public class ServicelinkTapToPayEducationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ServicelinkTapToPayEducation")

    Function("isAvailableAsync") { () -> Bool in
      #if canImport(ProximityReader)
      if #available(iOS 18.0, *) {
        return true
      }
      #endif
      return false
    }

    AsyncFunction("presentHowToTapAsync") { (promise: Promise) in
      #if canImport(ProximityReader)
      guard #available(iOS 18.0, *) else {
        promise.reject("ERR_UNAVAILABLE", "Tap to Pay education requires iOS 18 or later.")
        return
      }

      DispatchQueue.main.async {
        guard let topViewController = Self.topViewController() else {
          promise.reject("ERR_NO_VIEW_CONTROLLER", "Could not find a view controller to present from.")
          return
        }

        Task { @MainActor in
          do {
            let discovery = ProximityReaderDiscovery()
            let content = try await discovery.content(for: .payment(.howToTap))
            try await discovery.presentContent(content, from: topViewController)
            promise.resolve(nil)
          } catch {
            promise.reject("ERR_PRESENT_FAILED", error.localizedDescription)
          }
        }
      }
      #else
      promise.reject("ERR_UNAVAILABLE", "ProximityReader framework is not available in this build.")
      #endif
    }
    .runOnQueue(.main)
  }

  private static func topViewController() -> UIViewController? {
    let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
    let activeScene =
      scenes.first(where: { $0.activationState == .foregroundActive }) ?? scenes.first
    guard let window = activeScene?.windows.first(where: { $0.isKeyWindow }) else {
      return nil
    }

    var top = window.rootViewController
    while let presented = top?.presentedViewController {
      top = presented
    }
    return top
  }
}
