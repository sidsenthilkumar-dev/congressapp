import { useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  cancelReminders,
  scheduleReminders,
  readReminders,
} from "./notifications";
export function NativeReminders({
  onClose,
  planDays = [],
}: {
  onClose: () => void;
  planDays?: number[];
}) {
  const [hour, setHour] = useState("18");
  const [minute, setMinute] = useState("00");
  const [days, setDays] = useState(planDays);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    readReminders()
      .then((value) => {
        if (!mounted || !value) return;
        setDays(value.days);
        setHour(String(value.hour).padStart(2, "0"));
        setMinute(String(value.minute).padStart(2, "0"));
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);
  async function schedule() {
    if (busy) return;
    if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) {
      Alert.alert("Choose a time", "Enter both an hour and a minute.");
      return;
    }
    setBusy(true);
    try {
      const count = await scheduleReminders({
        days,
        hour: Number(hour),
        minute: Number(minute),
      });
      Alert.alert(
        "iPhone reminders scheduled",
        `${count} weekly alerts were handed to iOS. Focus and notification settings control display. This native schedule is separate from web reminders and can alert after a completed routine.`,
      );
      onClose();
    } catch (e) {
      Alert.alert(
        "Could not schedule",
        e instanceof Error ? e.message : "Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={s.root}>
      <Text style={s.eyebrow}>NATIVE IPHONE ALERTS</Text>
      <Text style={s.title}>A little time for you.</Text>
      <Text style={s.detail}>
        iOS schedules these local reminders even when Rebound is closed. This
        schedule is separate from web reminders and does not track routine
        completion. Avoid duplicates by using one schedule.
      </Text>
      <Text style={s.label}>
        {planDays.length
          ? "Your routine days are suggested below. Choose your reminder time."
          : "Choose the days and time that fit your cleared plan."}
      </Text>
      <Text style={s.label}>Local time · 24-hour clock</Text>
      <View style={s.time}>
        <TextInput
          accessibilityLabel="Reminder hour"
          style={s.input}
          keyboardType="number-pad"
          maxLength={2}
          value={hour}
          onChangeText={setHour}
        />
        <Text style={s.detail}>:</Text>
        <TextInput
          accessibilityLabel="Reminder minute"
          style={s.input}
          keyboardType="number-pad"
          maxLength={2}
          value={minute}
          onChangeText={setMinute}
        />
      </View>
      <View style={s.days}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
          <Pressable
            key={i}
            accessibilityLabel={
              [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ][i]
            }
            accessibilityState={{ selected: days.includes(i) }}
            style={[s.day, days.includes(i) && s.selected]}
            onPress={() =>
              setDays((current) =>
                current.includes(i)
                  ? current.filter((d) => d !== i)
                  : [...current, i],
              )
            }
          >
            <Text style={{ color: days.includes(i) ? "#fff" : "#4c6542" }}>
              {day}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={s.primary} disabled={busy} onPress={schedule}>
        <Text style={s.primaryText}>
          {busy ? "Scheduling…" : "Schedule iPhone reminders"}
        </Text>
      </Pressable>
      <Pressable
        style={s.secondary}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await cancelReminders();
            Alert.alert(
              "Reminders canceled",
              "Rebound’s native weekly alerts were removed. Web and calendar alerts are separate.",
            );
          } catch {
            Alert.alert(
              "Could not cancel",
              "Check iPhone notification settings and try again.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Text style={s.secondaryText}>Cancel native reminders</Text>
      </Pressable>
      <Pressable style={s.secondary} disabled={busy} onPress={onClose}>
        <Text style={s.secondaryText}>Close</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  root: { padding: 26, flex: 1, justifyContent: "center" },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#779066",
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1.2,
    color: "#263d30",
    marginTop: 16,
  },
  detail: {
    fontSize: 14,
    lineHeight: 24,
    color: "#64725e",
    marginVertical: 18,
  },
  label: { fontSize: 12, fontWeight: "600", color: "#4d6341", marginBottom: 9 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cedbc2",
    borderRadius: 14,
    padding: 15,
    fontSize: 15,
    color: "#263d30",
    backgroundColor: "#fffef9",
  },
  primary: {
    backgroundColor: "#294735",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  secondary: { padding: 16, alignItems: "center" },
  secondaryText: { color: "#4f6d43", fontSize: 14 },
  time: { flexDirection: "row", alignItems: "center", gap: 10 },
  days: {
    flexDirection: "row",
    gap: 7,
    justifyContent: "space-between",
    marginVertical: 22,
  },
  day: {
    width: 37,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d0ddc4",
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { backgroundColor: "#294735", borderColor: "#294735" },
});
