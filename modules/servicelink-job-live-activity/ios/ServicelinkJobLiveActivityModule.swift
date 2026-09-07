import ExpoModulesCore
import Foundation

#if canImport(ActivityKit)
import ActivityKit
#endif

public class ServicelinkJobLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ServicelinkJobLiveActivity")

    Function("isAvailable") { () -> Bool in
      #if canImport(ActivityKit)
      if #available(iOS 16.2, *) {
        return ActivityAuthorizationInfo().areActivitiesEnabled
      }
      #endif
      return false
    }

    AsyncFunction("startJobTimer") {
      (bookingId: String, customerName: String, serviceName: String, startedAtMs: Double, promise: Promise) in
      #if canImport(ActivityKit)
      if #available(iOS 16.2, *) {
        Task {
          do {
            try await Self.startActivity(
              bookingId: bookingId,
              customerName: customerName,
              serviceName: serviceName,
              startedAtMs: startedAtMs
            )
            promise.resolve(nil)
          } catch {
            promise.reject("ERR_LIVE_ACTIVITY", error.localizedDescription)
          }
        }
        return
      }
      #endif
      promise.resolve(nil)
    }

    AsyncFunction("endJobTimer") { (bookingId: String, promise: Promise) in
      #if canImport(ActivityKit)
      if #available(iOS 16.2, *) {
        Task {
          await Self.endActivities(bookingId: bookingId)
          promise.resolve(nil)
        }
        return
      }
      #endif
      promise.resolve(nil)
    }
  }

  #if canImport(ActivityKit)
  @available(iOS 16.2, *)
  private static func startActivity(
    bookingId: String,
    customerName: String,
    serviceName: String,
    startedAtMs: Double
  ) async throws {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      throw NSError(
        domain: "ServicelinkJobLiveActivity",
        code: 1,
        userInfo: [
          NSLocalizedDescriptionKey: "Live Activities are turned off for ServiceLink. Enable them in Settings.",
        ]
      )
    }

    let startedAt = Date(timeIntervalSince1970: startedAtMs / 1000)
    let attributes = JobActivityAttributes(
      bookingId: bookingId,
      customerName: customerName,
      serviceName: serviceName
    )
    let state = JobActivityAttributes.ContentState(startedAt: startedAt)
    let content = ActivityContent(state: state, staleDate: nil, relevanceScore: 100)

    for activity in Activity<JobActivityAttributes>.activities where activity.attributes.bookingId == bookingId {
      // Keep the original startedAt so Home restore does not reset the island timer.
      NSLog("ServicelinkJobLiveActivity: adopted existing timer for %@", bookingId)
      return
    }

    for activity in Activity<JobActivityAttributes>.activities {
      await activity.end(nil, dismissalPolicy: .immediate)
    }

    let activity = try await MainActor.run {
      try Activity.request(attributes: attributes, content: content, pushType: nil)
    }
    NSLog("ServicelinkJobLiveActivity: started %@", activity.id)
  }

  @available(iOS 16.2, *)
  private static func endActivities(bookingId: String) async {
    let id = bookingId.trimmingCharacters(in: .whitespacesAndNewlines)
    for activity in Activity<JobActivityAttributes>.activities {
      if id.isEmpty || activity.attributes.bookingId == id {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
  #endif
}
