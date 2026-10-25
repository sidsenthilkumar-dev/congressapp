import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "./theme";
import { useReducedMotion } from "./motion";
import type { RecoverySnapshot } from "./snapshot";

export function WeeklyGoal({
  snapshot,
  onPlan,
  onRemind,
}: {
  snapshot: RecoverySnapshot | null;
  onPlan: () => void;
  onRemind: () => void;
}) {
  const goal = snapshot?.weeklyGoal;
  const planned = goal?.planned || 0,
    completed = goal?.completed || 0;
  const progress = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const ratio = planned ? completed / planned : 0;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: ratio,
      duration: reduced ? 0 : 420,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [ratio, reduced, progress]);
  const remaining = goal ? goal.dueToday - goal.completedToday : 0;
  const caption = !snapshot
    ? "Connecting your plan…"
    : !planned
      ? "Choose routine days to build your week."
      : completed === planned
        ? "Week complete. Keep your planned rest."
        : remaining > 0
          ? `${remaining} routine${remaining === 1 ? "" : "s"} planned for today.`
          : goal?.dueToday
            ? "Today’s plan is complete."
            : "No routines scheduled today. Rest is part of the plan.";
  return (
    <View style={s.root}>
      <View style={s.top}>
        <Text style={s.title}>Your weekly goal</Text>
        <Pressable
          disabled={!snapshot}
          onPress={onPlan}
          accessibilityLabel="Edit weekly routine schedule"
          hitSlop={10}
        >
          <Text style={s.link}>{planned ? "Edit plan" : "Plan my week"}</Text>
        </Pressable>
      </View>
      <View style={s.summary}>
        <Text style={s.value}>
          {snapshot ? completed : "—"}
          <Text style={s.total}> / {planned || "—"}</Text>
        </Text>
        <Text style={s.unit}>planned routines</Text>
      </View>
      <View
        style={s.track}
        accessibilityRole="progressbar"
        accessibilityLabel="Planned routines completed this week"
        accessibilityValue={{
          min: 0,
          max: planned || 1,
          now: completed,
          text: planned
            ? `${completed} of ${planned} planned routines complete`
            : "No weekly schedule set",
        }}
      >
        <Animated.View
          style={[
            s.fill,
            {
              width: progress.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={s.caption}>
        {snapshot?.safety.blocked
          ? "Pause exercise and review your recovery profile first."
          : caption}
      </Text>
      {!!planned && !snapshot?.safety.blocked && completed < planned && (
        <Pressable
          onPress={onRemind}
          accessibilityLabel="Set exercise reminder"
          style={{
            alignSelf: "flex-start",
            minHeight: 44,
            justifyContent: "center",
          }}
        >
          <Text style={s.link}>Set a gentle reminder →</Text>
        </Pressable>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { paddingBottom: 23 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 14, fontWeight: "600", color: colors.ink },
  link: {
    fontSize: 11,
    fontWeight: "600",
    color: "#597548",
    paddingVertical: 10,
  },
  summary: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 2,
  },
  value: {
    fontSize: 23,
    fontWeight: "600",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  total: { fontSize: 18, color: "#8a967e", fontWeight: "400" },
  unit: { fontSize: 11, color: colors.muted },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#e1e8d7",
    overflow: "hidden",
    marginTop: 11,
  },
  fill: { height: "100%", backgroundColor: "#6e8c54", borderRadius: 3 },
  caption: { fontSize: 11, lineHeight: 17, color: colors.muted, marginTop: 9 },
});
