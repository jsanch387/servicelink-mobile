import ActivityKit
import Foundation

/// Must stay in sync with `modules/servicelink-job-live-activity/ios/JobActivityAttributes.swift`.
struct JobActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var startedAt: Date
  }

  var bookingId: String
  var customerName: String
  var serviceName: String
}
