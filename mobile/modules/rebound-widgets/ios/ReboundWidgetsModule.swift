import ExpoModulesCore
import WidgetKit

public class ReboundWidgetsModule: Module {
  private var store: UserDefaults? {
    guard let group = Bundle.main.object(forInfoDictionaryKey: "ReboundAppGroup") as? String else { return nil }
    return UserDefaults(suiteName: group)
  }
  public func definition() -> ModuleDefinition {
    Name("ReboundWidgets")
    Function("updateSessionCounts") { (total: Int, today: Int, updatedAt: String) in
      guard total >= 0, today >= 0, today <= total, let store = self.store else { return }
      store.set(total, forKey: "sessionsTotal")
      store.set(today, forKey: "sessionsToday")
      store.set(updatedAt, forKey: "sessionsUpdatedAt")
      WidgetCenter.shared.reloadAllTimelines()
    }
    Function("clear") {
      guard let store = self.store else { return }
      for key in ["sessionsTotal", "sessionsToday", "sessionsUpdatedAt"] { store.removeObject(forKey: key) }
      WidgetCenter.shared.reloadAllTimelines()
    }
  }
}
