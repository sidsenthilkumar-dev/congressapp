declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
    ReboundNativeCapabilities?: { cameraPermission?: boolean };
  }
}
export function requestNativeRecording(exerciseId: string) {
  if (!window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "RECORD_CLIP", exerciseId }),
  );
  return true;
}
/** Ask Expo Go for its host-app camera permission before WKWebView requests video. */
export function requestNativeCameraPermission(): Promise<void> {
  // Older clients rely on WKWebView's own permission prompt; don't wait for an unsupported bridge request.
  if (
    !window.ReactNativeWebView ||
    !window.ReboundNativeCapabilities?.cameraPermission
  )
    return Promise.resolve();
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const cleanup = () => {
      clearTimeout(timeout);
      window.removeEventListener("rebound:native-camera-permission", receive);
    };
    const receive = (event: Event) => {
      const response = (event as CustomEvent).detail;
      if (response?.requestId !== requestId) return;
      cleanup();
      if (response.granted === true) resolve();
      else
        reject(
          Error(
            "Camera permission is off. Enable Camera for Expo Go (or Rebound) in iPhone Settings, then try again.",
          ),
        );
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        Error(
          "Camera permission timed out. Update both the iPhone client and the web app, then try again.",
        ),
      );
    }, 30000);
    window.addEventListener("rebound:native-camera-permission", receive);
    window.ReactNativeWebView?.postMessage(
      JSON.stringify({ type: "REQUEST_CAMERA_PERMISSION", requestId }),
    );
  });
}
export function requestNativeExport(
  content: string,
  name: string,
  mimeType: string,
  print = false,
) {
  if (!window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "EXPORT_FILE", content, name, mimeType, print }),
  );
  return true;
}
