declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}
export function requestNativeRecording(exerciseId: string) {
  if (!window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: "RECORD_CLIP", exerciseId }),
  );
  return true;
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
