import SwiftUI
import WidgetKit

struct SessionEntry: TimelineEntry {
  let date: Date
  let total: Int?
  let today: Int
}
struct SessionProvider: TimelineProvider {
  func placeholder(in context: Context) -> SessionEntry { SessionEntry(date: Date(), total: 12, today: 1) }
  func getSnapshot(in context: Context, completion: @escaping (SessionEntry) -> Void) { completion(context.isPreview ? placeholder(in: context) : read()) }
  private func read() -> SessionEntry {
    let bundle = Bundle.main.bundleIdentifier ?? ""
    let host = bundle.hasSuffix(".sessions") ? String(bundle.dropLast(9)) : bundle
    let store = UserDefaults(suiteName: "group.\(host)")
    guard let total = store?.object(forKey: "sessionsTotal") as? Int,
          let raw = store?.string(forKey: "sessionsUpdatedAt") else { return SessionEntry(date: Date(), total: nil, today: 0) }
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let updated = formatter.date(from: raw)
    let sameDay = updated.map { Calendar.current.isDateInToday($0) } ?? false
    return SessionEntry(date: Date(), total: total, today: sameDay ? store?.integer(forKey: "sessionsToday") ?? 0 : 0)
  }
  func getTimeline(in context: Context, completion: @escaping (Timeline<SessionEntry>) -> Void) {
    let entry = read()
    let midnight = Calendar.current.startOfDay(for: Date()).addingTimeInterval(36 * 60 * 60)
    let nextDay = Calendar.current.startOfDay(for: midnight)
    let reset = SessionEntry(date: nextDay, total: entry.total, today: 0)
    completion(Timeline(entries: [entry, reset], policy: .after(nextDay)))
  }
}
struct SessionWidgetView: View {
  var entry: SessionEntry
  @Environment(\.widgetFamily) var family
  private let ink = Color(red: 0.13, green: 0.24, blue: 0.20)
  @ViewBuilder var content: some View {
    if family == .accessoryInline {
      Text(entry.total.map { "Rebound · \($0) sessions logged" } ?? "Open Rebound to enable")
    } else if family == .accessoryCircular {
      VStack(spacing: 1) { Image(systemName: "figure.cooldown"); Text(entry.total.map(String.init) ?? "—").font(.headline) }
        .accessibilityLabel(entry.total.map { "\($0) sessions logged" } ?? "Enable Rebound widgets")
    } else if family == .accessoryRectangular {
      VStack(alignment: .leading) { Text("rebound.").font(.headline); Text(entry.total.map { "\($0) logged · \(entry.today) today" } ?? "Enable widgets in the app").font(.caption) }
    } else {
      VStack(alignment: .leading, spacing: 7) {
        HStack { Text("rebound.").font(.system(size: 19, weight: .bold, design: .rounded)); Spacer(); Image(systemName: "figure.cooldown") }
        Spacer(minLength: 2)
        Text(entry.total.map(String.init) ?? "—").font(.system(size: 40, weight: .semibold, design: .rounded))
        Text(entry.total == nil ? "Enable in app preferences" : "sessions logged").font(.caption)
        if entry.total != nil { Text("\(entry.today) today · Your pace, your progress").font(.system(size: 10)).foregroundStyle(.secondary) }
      }.foregroundStyle(ink).padding(2)
    }
  }
  var body: some View {
    if #available(iOSApplicationExtension 17.0, *) {
      content.containerBackground(Color(red: 0.965, green: 0.961, blue: 0.937), for: .widget).widgetURL(URL(string: "rebound://recovery")).privacySensitive()
    } else {
      content.widgetURL(URL(string: "rebound://recovery")).privacySensitive()
    }
  }
}
@main
struct ReboundSessions: Widget {
  let kind = "ReboundSessions"
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SessionProvider()) { SessionWidgetView(entry: $0) }
      .configurationDisplayName("Recovery sessions")
      .description("Your logged sessions, at a glance. Enable sharing in Rebound first.")
      .supportedFamilies([.systemSmall, .systemMedium, .accessoryInline, .accessoryCircular, .accessoryRectangular])
  }
}
