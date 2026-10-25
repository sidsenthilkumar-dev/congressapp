import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const bundleIdentifier =
    config.ios?.bundleIdentifier || "dev.rebound.recovery";
  const group = `group.${bundleIdentifier}`;
  return {
    ...config,
    name: config.name || "Rebound",
    slug: config.slug || "rebound-recovery",
    ios: {
      ...config.ios,
      bundleIdentifier,
      entitlements: {
        ...config.ios?.entitlements,
        "com.apple.security.application-groups": [group],
      },
      infoPlist: { ...config.ios?.infoPlist, ReboundAppGroup: group },
    },
    plugins: [...(config.plugins || []), "@bacons/apple-targets"],
  };
};
