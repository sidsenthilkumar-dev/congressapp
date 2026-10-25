import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./camera-stage.css";

export function CameraStage({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!active) return;
    const app = document.querySelector<HTMLElement>(".app");
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const visibility = app?.style.visibility || "";
    const hidden = app?.getAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
    if (app) {
      app.inert = true;
      app.style.visibility = "hidden";
      app.setAttribute("aria-hidden", "true");
    }
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "CAMERA_MODE", active: true }),
    );
    document.querySelector<HTMLButtonElement>("[data-exit-camera]")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        document
          .querySelector<HTMLButtonElement>("[data-exit-camera]")
          ?.click();
      }
      if (event.key === "Tab") {
        const controls = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            "[data-camera-controls] button:not(:disabled)",
          ),
        );
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        event.stopImmediatePropagation();
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("keydown", key, true);
      document.body.style.overflow = overflow;
      if (app) {
        app.inert = false;
        app.style.visibility = visibility;
        if (hidden === null || hidden === undefined)
          app.removeAttribute("aria-hidden");
        else app.setAttribute("aria-hidden", hidden);
      }
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({ type: "CAMERA_MODE", active: false }),
      );
      previous?.focus();
    };
  }, [active]);
  return active ? (
    createPortal(
      <div
        className="camera-stage"
        data-camera-controls
        role="dialog"
        aria-modal="true"
        aria-label="Full-screen movement camera"
      >
        {children}
      </div>,
      document.body,
    )
  ) : (
    <>{children}</>
  );
}
