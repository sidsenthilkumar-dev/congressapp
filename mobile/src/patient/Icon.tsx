import Svg, { Path, Circle } from "react-native-svg";
export function Icon({
  name,
  size = 22,
  color = "#31543d",
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const paths: Record<string, string> = {
    recovery: "M3 12h4l3-7 4 14 3-7h4",
    coach: "M8 4h8l2 3h3v13H3V7h3l2-3",
    clinic: "M5 21V3h14v18M9 7h6m-3-3v6m-3 4h6m-6 4h6",
    progress: "M4 21V11m8 10V3m8 18v-7",
    more: "M4 6h16M4 12h16M4 18h16",
    arrow: "M5 12h14m-5-5 5 5-5 5",
    back: "m14 6-6 6 6 6",
    play: "m9 5 11 7-11 7V5",
    bell: "M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3m5 4h4",
    search: "m16 16 5 5",
    settings: "M4 7h16M4 17h16M8 3v8m8 2v8",
    check: "m5 12 4 4 10-10",
    close: "m6 6 12 12M6 18 18 6",
    calendar: "M4 5h16v16H4V5m4-3v6m8-6v6M4 11h16",
  };
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name] || paths.recovery} />
      {name === "coach" && <Circle cx="12" cy="13" r="4" />}
      {name === "search" && <Circle cx="10" cy="10" r="6" />}
    </Svg>
  );
}
