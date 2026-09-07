import ActivityKit
import Foundation

/// Must stay in sync with `ios/ServiceLinkJobActivity/JobActivityAttributes.swift`.
/// ActivityKit matches Live Activities by this type name.
struct JobActivityAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    var startedAt: Date
  }

  var bookingId: String
  var customerName: String
  var serviceName: String
}
