import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import exercises from "./data/exercises.json";
import type { NativeRoutine, RecoverySnapshot } from "./snapshot";
import { Icon } from "./Icon";
import { colors } from "./theme";
export function CoachLibrary({
  snapshot,
  onStart,
  onPlan,
  onOpen,
}: {
  snapshot: RecoverySnapshot | null;
  onStart: (r: NativeRoutine) => void;
  onPlan: () => void;
  onOpen: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const routine =
    snapshot?.routines.find((r) => !r.complete) || snapshot?.routines[0];
  const areas = ["All", ...new Set(exercises.map((e) => e.area))];
  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (area === "All" || e.area === area) &&
          `${e.name} ${e.area} ${e.equipment}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, area],
  );
  return (
    <FlatList
      data={filtered}
      numColumns={2}
      keyExtractor={(e) => e.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={s.content}
      columnWrapperStyle={s.columns}
      ListHeaderComponent={
        <>
          <Text style={s.overline}>MOVE WITH A LITTLE MORE CONFIDENCE</Text>
          <Text style={s.title}>Your movement{`\n`}space.</Text>
          <View style={s.hero}>
            <View style={s.heroTop}>
              <View style={s.badge}>
                <Icon name="coach" color={colors.lime} size={24} />
              </View>
              <Text style={s.heroCaption}>YOUR ROUTINE</Text>
            </View>
            <Text style={s.heroTitle}>
              {routine?.name || "A plan that fits you."}
            </Text>
            <Text style={s.heroDetail}>
              {routine
                ? `${routine.exerciseIds.length} movements · Your prescribed pace`
                : "Bring your clinician’s movements together."}
            </Text>
            <Pressable
              disabled={!snapshot}
              style={s.start}
              onPress={() =>
                snapshot?.safety.blocked
                  ? onPlan()
                  : routine
                    ? onStart(routine)
                    : onPlan()
              }
            >
              <Text style={s.startText}>
                {snapshot?.safety.blocked
                  ? "Review my plan"
                  : routine
                    ? routine.completedMovements && !routine.complete
                      ? "Continue your routine"
                      : "Start your routine"
                    : "Build a routine"}
              </Text>
              <Icon name="play" size={18} />
            </Pressable>
          </View>
          <View style={s.libraryHeading}>
            <Text style={s.heading}>Explore movements</Text>
            <Text style={s.count}>{exercises.length} GUIDES</Text>
          </View>
          <View style={s.search}>
            <Icon name="search" size={19} />
            <TextInput
              accessibilityLabel="Search movement library"
              value={query}
              onChangeText={setQuery}
              placeholder="Search movement, body area, equipment"
              placeholderTextColor="#899580"
              style={s.input}
              clearButtonMode="while-editing"
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.filters}
          >
            {areas.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: area === value }}
                style={[s.filter, area === value && s.selected]}
                onPress={() => setArea(value)}
              >
                <Text
                  style={[s.filterText, area === value && { color: "#fff" }]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      }
      ListEmptyComponent={
        <Text style={s.empty}>
          No matching guides. Try another movement or body area.
        </Text>
      }
      renderItem={({ item, index }) => (
        <Pressable
          accessibilityLabel={`Open ${item.name}`}
          style={[
            s.tile,
            { backgroundColor: index % 3 === 0 ? "#edf1e4" : colors.paper },
          ]}
          onPress={() => onOpen(item.id)}
        >
          <View style={s.tileTop}>
            <Text style={s.area}>{item.area.toUpperCase()}</Text>
            <Icon name="arrow" size={16} />
          </View>
          <Text style={s.tileTitle}>{item.name}</Text>
          <Text style={s.tileDetail}>
            {item.equipment.toLowerCase().includes("band")
              ? "Resistance band"
              : item.type === "dowel-flexion"
                ? "Light dowel"
                : item.camera
                  ? "Camera + guide"
                  : "Manual guide"}
          </Text>
          <View style={s.tileMark}>
            <Icon name={item.camera ? "coach" : "recovery"} size={19} />
            <Text style={s.tileNote}>
              {item.camera ? "Rep estimates" : "At your pace"}
            </Text>
          </View>
        </Pressable>
      )}
      ListFooterComponent={
        <Text style={s.footer}>
          Movement examples need individual clearance. Your clinician sets the
          range, variation, and dose.
        </Text>
      }
    />
  );
}
const s = StyleSheet.create({
  content: { padding: 22, paddingBottom: 20 },
  overline: {
    fontSize: 8,
    letterSpacing: 1.6,
    color: colors.muted,
    fontWeight: "600",
  },
  title: {
    fontSize: 35,
    lineHeight: 39,
    fontWeight: "700",
    letterSpacing: -1.3,
    color: colors.ink,
    marginTop: 12,
    marginBottom: 23,
  },
  hero: {
    backgroundColor: colors.ink,
    borderRadius: 27,
    padding: 23,
    marginBottom: 28,
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#395b44",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCaption: { fontSize: 9, letterSpacing: 1.8, color: "#bdcea9" },
  heroTitle: {
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.6,
    fontWeight: "600",
    color: "#fffef5",
    marginTop: 17,
  },
  heroDetail: { fontSize: 12, lineHeight: 20, color: "#c3d2b7", marginTop: 6 },
  start: {
    marginTop: 19,
    padding: 16,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: colors.lime,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  startText: { fontSize: 13, fontWeight: "600", color: colors.ink },
  libraryHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  heading: {
    fontSize: 19,
    fontWeight: "600",
    letterSpacing: -0.4,
    color: colors.ink,
  },
  count: { fontSize: 8, letterSpacing: 1.4, color: colors.muted },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    borderRadius: 15,
    minHeight: 50,
  },
  input: { flex: 1, fontSize: 12, color: colors.ink, paddingVertical: 15 },
  filters: { gap: 8, paddingVertical: 17 },
  filter: {
    minHeight: 44,
    paddingHorizontal: 15,
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#e9eee1",
  },
  selected: { backgroundColor: colors.ink },
  filterText: { fontSize: 11, color: "#63745b" },
  columns: { gap: 11 },
  tile: {
    flex: 1,
    maxWidth: "49%",
    minHeight: 170,
    borderRadius: 20,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  area: { fontSize: 8, letterSpacing: 1.1, color: colors.muted },
  tileTitle: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    letterSpacing: -0.3,
    color: colors.ink,
  },
  tileDetail: {
    fontSize: 10,
    color: colors.muted,
    lineHeight: 16,
    marginTop: 6,
  },
  tileMark: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 17,
  },
  tileNote: { fontSize: 9, color: "#6c805e" },
  footer: {
    fontSize: 10,
    lineHeight: 18,
    color: colors.muted,
    paddingVertical: 10,
  },
  empty: { color: colors.muted, fontSize: 13, paddingVertical: 30 },
});
