import ActivityKit
import SwiftUI
import WidgetKit

struct JobLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: JobActivityAttributes.self) { context in
      JobLockScreenBanner(context: context)
        .activityBackgroundTint(ServiceLinkLiveChrome.shell)
        .activitySystemActionForegroundColor(ServiceLinkLiveChrome.text)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.attributes.customerName)
            .font(.headline)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.trailing) {
          Text(context.attributes.serviceName)
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
        DynamicIslandExpandedRegion(.bottom) {
          HStack(alignment: .firstTextBaseline, spacing: 8) {
            Image(systemName: "timer")
              .font(.title2.weight(.semibold))
            JobCountUpTimer(
              startedAt: context.state.startedAt,
              font: .system(size: 34, weight: .semibold, design: .rounded),
              compact: false
            )
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(.top, 2)
        }
      } compactLeading: {
        Image(systemName: "timer")
          .font(.system(size: 14, weight: .semibold))
      } compactTrailing: {
        JobCountUpTimer(
          startedAt: context.state.startedAt,
          font: .system(size: 13, weight: .semibold, design: .rounded),
          compact: true
        )
        .frame(width: 58, alignment: .trailing)
      } minimal: {
        Image(systemName: "timer")
          .font(.system(size: 12, weight: .bold))
      }
      .keylineTint(ServiceLinkLiveChrome.text)
    }
  }
}

private enum ServiceLinkLiveChrome {
  static let shell = Color(red: 10 / 255, green: 10 / 255, blue: 10 / 255)
  static let text = Color(red: 250 / 255, green: 250 / 255, blue: 250 / 255)
  static let muted = Color(red: 163 / 255, green: 163 / 255, blue: 163 / 255)
}

/// Live Activity timers must use `timerInterval`. `Text(date, style: .timer)` often renders blank
/// on the island. Compact uses an 8-hour range so long jobs show `h:mm:ss` (Apple ends the
/// island at 8 hours). Lock Screen / expanded use 10 hours.
private enum JobCountUpRange {
  static let compact: TimeInterval = 8 * 60 * 60
  static let banner: TimeInterval = 10 * 60 * 60
}

private struct JobCountUpTimer: View {
  let startedAt: Date
  let font: Font
  var compact: Bool

  private var end: Date {
    startedAt.addingTimeInterval(compact ? JobCountUpRange.compact : JobCountUpRange.banner)
  }

  var body: some View {
    Text(timerInterval: startedAt...end, countsDown: false)
      .monospacedDigit()
      .font(font)
      .lineLimit(1)
      .minimumScaleFactor(0.5)
  }
}

private struct JobLockScreenBanner: View {
  let context: ActivityViewContext<JobActivityAttributes>

  var body: some View {
    HStack(alignment: .center, spacing: 12) {
      VStack(alignment: .leading, spacing: 3) {
        Text("SERVICELINK")
          .font(.system(size: 10, weight: .semibold))
          .tracking(0.8)
          .foregroundStyle(ServiceLinkLiveChrome.muted)
        Text(context.attributes.customerName)
          .font(.headline)
          .foregroundStyle(ServiceLinkLiveChrome.text)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
        Text(context.attributes.serviceName)
          .font(.subheadline)
          .foregroundStyle(ServiceLinkLiveChrome.muted)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
      .frame(maxWidth: .infinity, alignment: .leading)

      HStack(alignment: .center, spacing: 6) {
        Image(systemName: "timer")
          .font(.body.weight(.semibold))
          .foregroundStyle(ServiceLinkLiveChrome.muted)
        JobCountUpTimer(
          startedAt: context.state.startedAt,
          font: .system(size: 24, weight: .semibold, design: .rounded),
          compact: false
        )
        .foregroundStyle(ServiceLinkLiveChrome.text)
        .frame(width: 88, alignment: .trailing)
      }
      .fixedSize(horizontal: true, vertical: false)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(16)
  }
}
