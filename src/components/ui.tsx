import type { ReactNode } from "react";
export function Stat({
  icon,
  value,
  title,
  sub,
}: {
  icon: ReactNode;
  value: string;
  title: string;
  sub: string;
}) {
  return (
    <section className="stat">
      <span className="stat-icon">{icon}</span>
      <div>
        <div className="stat-value">
          {value}
          <span>{title}</span>
        </div>
        <p>{sub}</p>
      </div>
    </section>
  );
}
export function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="empty">
      {icon}
      <p>{text}</p>
    </div>
  );
}
