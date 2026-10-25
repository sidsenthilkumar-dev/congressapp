module.exports = (config) => ({
  type: "widget",
  name: "ReboundSessions",
  bundleIdentifier: ".sessions",
  deploymentTarget: "16.0",
  frameworks: ["SwiftUI", "WidgetKit"],
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
  colors: { $accent: "#213e32", $widgetBackground: "#f6f5ef" },
});
