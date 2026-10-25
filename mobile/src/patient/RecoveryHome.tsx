import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useRef } from "react";
import Svg, { Path, Circle } from "react-native-svg";
import type { RecoverySnapshot, NativeRoutine } from "./snapshot";
import { Icon } from "./Icon";
import { colors } from "./theme";
import { useReducedMotion } from "./motion";
export function RecoveryHome({
  snapshot,
  onStart,
  onPlan,
  onCheckIn,
  onProfile,
  onAlerts,
  onSettings,
}: {
  snapshot: RecoverySnapshot | null;
  onStart: (r: NativeRoutine) => void;
  onPlan: () => void;
  onCheckIn: () => void;
  onProfile: () => void;
  onAlerts: () => void;
  onSettings: () => void;
}) {
  const reduced = useReducedMotion();
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) enter.setValue(1);
    else
      Animated.timing(enter, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
  }, [reduced, enter]);
  const routine =
    snapshot?.routines.find((r) => !r.complete) || snapshot?.routines[0];
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [reduced ? 0 : 10, 0],
            }),
          },
        ],
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <View style={s.header}>
          <View>
            <Text style={s.overline}>
              {new Date()
                .toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })
                .toUpperCase()}
            </Text>
            <Text style={s.title}>Your recovery.</Text>
          </View>
          <View style={s.headerActions}>
            <Pressable
              accessibilityLabel="iPhone alerts"
              style={s.circle}
              onPress={onAlerts}
            >
              <Icon name="bell" />
            </Pressable>
            <Pressable
              accessibilityLabel="App preferences"
              style={s.circle}
              onPress={onSettings}
            >
              <Icon name="settings" />
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityLabel="Review recovery focus"
          style={s.focus}
          onPress={onProfile}
        >
          <Svg
            width={180}
            height={220}
            viewBox="0 0 180 220"
            style={s.art}
            fill="none"
          >
            <Path
              d="M110-10C20 35 190 70 85 122S130 200 50 232M145-10C55 35 225 70 120 122S165 200 85 232M75-10C-15 35 155 70 50 122S95 200 15 232"
              stroke="#70936a"
              strokeWidth="1"
            />
            <Circle
              cx="100"
              cy="108"
              r="32"
              stroke="#abc28a"
              strokeDasharray="3 6"
            />
          </Svg>
          <Text style={s.focusCaption}>YOUR FOCUS</Text>
          <Text style={s.area}>
            {snapshot?.profile.area || "Your recovery"}
          </Text>
          <Text style={s.goal}>
            {snapshot?.profile.goal ||
              "Your saved plan will appear when the app connects."}
          </Text>
          <View style={s.focusBottom}>
            <Text style={s.focusSide}>
              {snapshot?.profile.side || "Your personal space"}
            </Text>
            <Icon name="arrow" color="#e0edcc" size={19} />
          </View>
        </Pressable>
        <View style={s.stats}>
          <View>
            <Text style={s.statValue}>
              {snapshot ? String(snapshot.stats.today).padStart(2, "0") : "—"}
            </Text>
            <Text style={s.statLabel}>sessions today</Text>
          </View>
          <View style={s.divider} />
          <View>
            <Text style={s.statValue}>
              {snapshot ? String(snapshot.stats.total).padStart(2, "0") : "—"}
            </Text>
            <Text style={s.statLabel}>sessions logged</Text>
          </View>
        </View>
        <View style={s.sectionTitle}>
          <Text style={s.sectionHeading}>Your next small step</Text>
          <Text style={s.subtle}>AT YOUR PACE</Text>
        </View>
        {snapshot?.safety.blocked ? (
          <View style={s.next}>
            <Text style={s.nextTitle}>{snapshot.safety.title}</Text>
            <Text style={s.body}>{snapshot.safety.message}</Text>
            <Pressable style={s.primary} onPress={onProfile}>
              <Text style={s.primaryText}>Review my recovery</Text>
              <Icon name="arrow" color="#fff" size={18} />
            </Pressable>
          </View>
        ) : (
          <View style={s.next}>
            <View style={s.routineRow}>
              <View style={s.routineIcon}>
                <Icon name="coach" size={25} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nextTitle}>
                  {routine?.name || "Make room for movement"}
                </Text>
                <Text style={s.body}>
                  {routine
                    ? `${routine.complete ? routine.exerciseIds.length : routine.remaining.length} movement${routine.remaining.length === 1 ? "" : "s"} ${routine.complete ? "in your plan" : "remaining"}`
                    : "Build a routine from your cleared movements."}
                </Text>
              </View>
            </View>
            <Pressable
              disabled={!snapshot}
              style={[s.primary, !snapshot && { opacity: 0.5 }]}
              onPress={() => (routine ? onStart(routine) : onPlan())}
            >
              <Text style={s.primaryText}>
                {!snapshot
                  ? "Connecting your plan…"
                  : routine
                    ? routine.complete
                      ? "Open routine again"
                      : routine.completedMovements
                        ? "Continue your routine"
                        : "Start your routine"
                    : "Build my routine"}
              </Text>
              <Icon name="play" color="#fff" size={18} />
            </Pressable>
          </View>
        )}
        <View style={s.week}>
          <View style={s.sectionTitle}>
            <Text style={s.sectionHeading}>A little consistency</Text>
            <Text style={s.subtle}>THIS WEEK</Text>
          </View>
          <View style={s.days}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <View style={s.day} key={i}>
                <View
                  style={[
                    s.dayMark,
                    snapshot && snapshot.stats.week[i] > 0 && s.dayActive,
                  ]}
                >
                  {snapshot && snapshot.stats.week[i] > 0 ? (
                    <Icon name="check" color="#fff" size={16} />
                  ) : (
                    <View style={s.dayDot} />
                  )}
                </View>
                <Text style={s.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </View>
        <Pressable style={s.checkin} onPress={onCheckIn}>
          <View>
            <Text style={s.nextTitle}>How does today feel?</Text>
            <Text style={s.body}>
              {snapshot?.stats.pain !== null &&
              snapshot?.stats.pain !== undefined
                ? `Latest discomfort · ${snapshot.stats.pain}/10`
                : "Take a moment for a check-in."}
            </Text>
          </View>
          <Icon name="arrow" />
        </Pressable>
      </ScrollView>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  content: { padding: 22, paddingBottom: 26 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  overline: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.muted,
    fontWeight: "600",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.5,
    color: colors.ink,
    marginTop: 9,
  },
  headerActions: { flexDirection: "row", gap: 7 },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
  },
  focus: {
    padding: 25,
    borderRadius: 28,
    minHeight: 202,
    backgroundColor: colors.ink,
    overflow: "hidden",
  },
  art: { position: "absolute", right: -20, top: 0, opacity: 0.65 },
  focusCaption: {
    fontSize: 9,
    letterSpacing: 2,
    color: "#bdd0ac",
    fontWeight: "600",
  },
  area: {
    fontSize: 36,
    fontWeight: "600",
    letterSpacing: -1,
    color: "#fffef5",
    marginTop: 14,
    maxWidth: "75%",
  },
  goal: {
    fontSize: 13,
    lineHeight: 21,
    color: "#dae5cf",
    marginTop: 9,
    maxWidth: "74%",
  },
  focusBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 21,
  },
  focusSide: { fontSize: 10, color: "#bed2ac" },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 25,
  },
  statValue: {
    fontSize: 29,
    fontWeight: "600",
    letterSpacing: -1,
    color: colors.ink,
  },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 3 },
  divider: { height: 35, width: 1, backgroundColor: colors.line },
  sectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  subtle: { fontSize: 8, letterSpacing: 1.3, color: colors.muted },
  next: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 19,
    borderRadius: 23,
  },
  routineRow: { flexDirection: "row", alignItems: "center", gap: 13 },
  routineIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },
  nextTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  body: { fontSize: 12, lineHeight: 20, color: colors.muted, marginTop: 5 },
  primary: {
    backgroundColor: colors.ink,
    borderRadius: 16,
    padding: 17,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  primaryText: { color: "#f9fff2", fontSize: 13, fontWeight: "600" },
  week: { marginTop: 25 },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  day: { alignItems: "center", gap: 9 },
  dayMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#e9ede2",
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: "#50774b" },
  dayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#cad3bf" },
  dayLabel: { fontSize: 10, color: colors.muted },
  checkin: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
