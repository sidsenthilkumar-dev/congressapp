import { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  View,
  AccessibilityInfo,
} from "react-native";
import { colors } from "./theme";
export function LaunchAnimation({ onFinish }: { onFinish: () => void }) {
  const [word, setWord] = useState("");
  const opacity = useRef(new Animated.Value(1)).current;
  const done = useRef(onFinish);
  done.current = onFinish;
  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (!alive) return;
        if (reduced) {
          setWord("rebound");
          timers.push(setTimeout(() => done.current(), 150));
          return;
        }
        for (let i = 1; i <= 7; i++)
          timers.push(
            setTimeout(() => {
              if (alive) setWord("rebound".slice(0, i));
            }, i * 80),
          );
        timers.push(
          setTimeout(() => {
            animation = Animated.timing(opacity, {
              toValue: 0,
              duration: 220,
              useNativeDriver: true,
            });
            animation.start(({ finished }) => {
              if (finished && alive) done.current();
            });
          }, 850),
        );
      })
      .catch(() => {
        if (alive) done.current();
      });
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
      animation?.stop();
    };
  }, [opacity]);
  return (
    <Animated.View
      style={[s.root, { opacity }]}
      accessible
      accessibilityLabel="Rebound is opening"
    >
      <View style={s.glow} />
      <Text style={s.word}>
        {word}
        <Text style={s.dot}>{word.length === 7 ? "." : "│"}</Text>
      </Text>
      <Text style={s.caption}>SMALL STEPS. YOUR COMEBACK.</Text>
    </Animated.View>
  );
}
const s = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  glow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#eaf0df",
  },
  word: {
    fontSize: 57,
    fontWeight: "800",
    letterSpacing: -3,
    color: colors.ink,
    minWidth: 265,
    textAlign: "center",
  },
  dot: { color: "#9ab97d" },
  caption: {
    fontSize: 9,
    letterSpacing: 2.2,
    color: colors.muted,
    marginTop: 22,
  },
});
