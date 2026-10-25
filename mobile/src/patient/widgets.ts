import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";
type WidgetModule = {
  updateSessionCounts: (
    total: number,
    today: number,
    updatedAt: string,
  ) => void;
  clear: () => void;
};
const bridge =
  Platform.OS === "ios"
    ? requireOptionalNativeModule<WidgetModule>("ReboundWidgets")
    : null;
export const widgetAvailable = !!bridge;
export function updateWidget(total: number, today: number, updatedAt: string) {
  try {
    bridge?.updateSessionCounts(total, today, updatedAt);
  } catch {}
}
export function clearWidget() {
  try {
    bridge?.clear();
  } catch {}
}
