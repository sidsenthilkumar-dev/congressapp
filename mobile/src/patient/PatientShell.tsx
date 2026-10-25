import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { RecoveryHome } from "./RecoveryHome";
import { CoachLibrary } from "./CoachLibrary";
import { Icon } from "./Icon";
import { colors } from "./theme";
import { useReducedMotion } from "./motion";
import type { RecoverySnapshot, NativeRoutine } from "./snapshot";
export function PatientShell({
  recoveryRequest,
  snapshot,
  focused,
  cameraMode,
  title,
  onClose,
  onAction,
  onAlerts,
  onSettings,
  children,
}: {
  recoveryRequest: number;
  snapshot: RecoverySnapshot | null;
  focused: boolean;
  cameraMode: boolean;
  title: string;
  onClose: () => void;
  onAction: (action: Record<string, unknown>, title?: string) => void;
  onAlerts: () => void;
  onSettings: () => void;
  children: React.ReactNode;
}) {
  const [tab, setTab] = useState("Recovery");
  useEffect(() => setTab("Recovery"), [recoveryRequest]);
  const fade = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      fade.setValue(1);
      return;
    }
    fade.setValue(0);
    const a = Animated.timing(fade, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [tab, reduced, fade]);
  const navigate = (page: string) => onAction({ type: "navigate", page }, page);
  const start = (routine: NativeRoutine) =>
    onAction({ type: "routine", id: routine.id }, routine.name);
  return (
    <View style={s.root}>
      <View
        style={[s.web, !focused && s.hidden]}
        pointerEvents={focused ? "auto" : "none"}
        accessibilityElementsHidden={!focused}
        importantForAccessibility={focused ? "auto" : "no-hide-descendants"}
      >
        {focused && !cameraMode && (
          <View style={s.toolbar}>
            <Pressable
              accessibilityLabel="Back to recovery"
              onPress={onClose}
              style={s.back}
            >
              <Icon name="back" />
            </Pressable>
            <Text numberOfLines={1} style={s.toolbarTitle}>
              {title}
            </Text>
          </View>
        )}
        {children}
      </View>
      {!focused && (
        <>
          <Animated.View
            style={[
              s.content,
              {
                opacity: fade,
                transform: [
                  {
                    translateY: fade.interpolate({
                      inputRange: [0, 1],
                      outputRange: [8, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {tab === "Recovery" ? (
              <RecoveryHome
                snapshot={snapshot}
                onStart={start}
                onPlan={() => navigate("My routines")}
                onCheckIn={() => onAction({ type: "checkin" }, "Check in")}
                onProfile={() => navigate("My recovery")}
                onAlerts={onAlerts}
                onSettings={onSettings}
              />
            ) : tab === "Coach" ? (
              <CoachLibrary
                snapshot={snapshot}
                onStart={start}
                onPlan={() => navigate("My routines")}
                onOpen={(id) =>
                  onAction({ type: "exercise", id }, "Movement guide")
                }
              />
            ) : (
              <ScrollView contentContainerStyle={s.more}>
                <Text style={s.eyebrow}>YOUR RECOVERY, CONNECTED</Text>
                <Text style={s.title}>
                  {tab === "More"
                    ? "Make it yours."
                    : tab === "Clinic"
                      ? "Your care team."
                      : "Small steps add up."}
                </Text>
                <Text style={s.detail}>
                  {tab === "Clinic"
                    ? "Review your clinician’s plan and share clips you choose."
                    : tab === "Progress"
                      ? "See your logged sessions and how you’ve been feeling."
                      : "A quieter place for the rest of your recovery tools."}
                </Text>
                {(tab === "Clinic"
                  ? [["Open my clinic", "Clinic"]]
                  : tab === "Progress"
                    ? [["View my progress", "My progress"]]
                    : [
                        ["Ask Rebound", "Ask Rebound"],
                        ["My routines", "My routines"],
                        ["Recovery profile", "My recovery"],
                      ]
                ).map(([label, page]) => (
                  <Pressable
                    key={page}
                    style={s.row}
                    onPress={() => navigate(page)}
                  >
                    <Text style={s.rowText}>{label}</Text>
                    <Icon name="arrow" />
                  </Pressable>
                ))}
                {tab === "More" && (
                  <>
                    <Pressable style={s.row} onPress={onAlerts}>
                      <Text style={s.rowText}>Exercise reminders</Text>
                      <Icon name="bell" />
                    </Pressable>
                    <Pressable style={s.row} onPress={onSettings}>
                      <Text style={s.rowText}>Widgets & connection</Text>
                      <Icon name="settings" />
                    </Pressable>
                  </>
                )}
              </ScrollView>
            )}
          </Animated.View>
          <View style={s.tabs}>
            {(["Recovery", "Coach", "Clinic", "Progress", "More"] as const).map(
              (name, index) => (
                <Pressable
                  key={name}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === name }}
                  onPress={() => setTab(name)}
                  style={s.tab}
                >
                  <View style={[s.tabIcon, tab === name && s.selected]}>
                    <Icon
                      name={
                        (
                          [
                            "recovery",
                            "coach",
                            "clinic",
                            "progress",
                            "more",
                          ] as const
                        )[index]
                      }
                      size={21}
                      color={tab === name ? colors.ink : "#88927f"}
                    />
                  </View>
                  <Text
                    style={[s.tabLabel, tab === name && { color: colors.ink }]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ),
            )}
          </View>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  web: { flex: 1 },
  hidden: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0,
    zIndex: -1,
  },
  toolbar: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    gap: 8,
  },
  back: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarTitle: { fontSize: 15, fontWeight: "600", color: colors.ink, flex: 1 },
  tabs: {
    flexDirection: "row",
    paddingTop: 9,
    paddingBottom: 7,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
  },
  tab: { flex: 1, alignItems: "center", minHeight: 52 },
  tabIcon: {
    width: 44,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  selected: { backgroundColor: colors.sage },
  tabLabel: { fontSize: 9, marginTop: 4, color: "#88927f" },
  more: { padding: 25 },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.muted,
    marginTop: 16,
  },
  title: {
    fontSize: 34,
    letterSpacing: -1.1,
    fontWeight: "700",
    color: colors.ink,
    marginTop: 18,
  },
  detail: {
    fontSize: 14,
    lineHeight: 23,
    color: colors.muted,
    marginTop: 12,
    marginBottom: 25,
  },
  row: {
    padding: 20,
    minHeight: 64,
    backgroundColor: colors.paper,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowText: { fontSize: 15, color: colors.ink },
});
