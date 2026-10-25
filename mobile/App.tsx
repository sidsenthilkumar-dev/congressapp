import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { useCameraPermissions } from "expo-camera";
import { NativeRecorder } from "./src/NativeRecorder";
import { NativeReminders } from "./src/NativeReminders";
import { validateAppUrl, isAppDocumentUrl } from "./src/config";
import { exportWebFile } from "./src/exportFile";

import { PatientShell } from "./src/patient/PatientShell";
import { LaunchAnimation } from "./src/patient/LaunchAnimation";
import { parseSnapshot, type RecoverySnapshot } from "./src/patient/snapshot";
import {
  nativePresentationScript,
  nativeActionScript,
} from "./src/patient/injected";
import {
  updateWidget,
  clearWidget,
  widgetAvailable,
} from "./src/patient/widgets";
function Rebound() {
  const [, requestCameraPermission] = useCameraPermissions();
  const [launch, setLaunch] = useState(true);
  const [recoveryRequest, setRecoveryRequest] = useState(0);
  const [snapshot, setSnapshot] = useState<RecoverySnapshot | null>(null);
  const [focused, setFocused] = useState(false);
  const [focusTitle, setFocusTitle] = useState("");
  const [settings, setSettings] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(false);
  useEffect(() => {
    SecureStore.getItemAsync("rebound-widget-enabled")
      .then((v) => setWidgetEnabled(v === "true"))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (widgetEnabled && snapshot)
      updateWidget(
        snapshot.stats.total,
        snapshot.stats.today,
        snapshot.updatedAt,
      );
  }, [snapshot, widgetEnabled]);
  function action(value: Record<string, unknown>, title?: string) {
    if (!snapshot) {
      Alert.alert("Still connecting", "Wait for your recovery data to load.");
      return;
    }
    if (title) {
      setFocusTitle(title);
      setFocused(true);
    }
    web.current?.injectJavaScript(nativeActionScript(value));
  }
  function closeFocus() {
    web.current?.injectJavaScript(nativeActionScript({ type: "close" }));
    setFocused(false);
    setCameraMode(false);
  }

  const [appUrl, setAppUrl] = useState("");
  const [draft, setDraft] = useState(process.env.EXPO_PUBLIC_APP_URL || "");
  const [initializing, setInitializing] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [recordExercise, setRecordExercise] = useState("");
  const [reminders, setReminders] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [foreground, setForeground] = useState(true);
  const web = useRef<WebView<object>>(null);
  useEffect(() => {
    if (!appUrl || snapshot || loadError) return;
    const timeout = setTimeout(
      () =>
        setLoadError(
          "Your recovery data hasn’t connected. Check the address and update the web deployment to the latest Rebound version.",
        ),
      15000,
    );
    return () => clearTimeout(timeout);
  }, [appUrl, snapshot, loadError]);
  useEffect(() => {
    const interval = setInterval(
      () => web.current?.injectJavaScript(nativeActionScript({ type: "sync" })),
      60000,
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync("rebound-app-origin")
      .then((value) => {
        if (!mounted) return;
        const raw = process.env.EXPO_PUBLIC_APP_URL || value;
        if (raw) {
          try {
            const valid = validateAppUrl(raw, __DEV__);
            setAppUrl(valid);
            setDraft(valid);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setInitializing(false);
      });
    const appState = AppState.addEventListener("change", (state) => {
      setForeground(state === "active");
      if (state === "active")
        web.current?.injectJavaScript(nativeActionScript({ type: "sync" }));
      if (state === "background")
        web.current?.injectJavaScript(
          "window.dispatchEvent(new Event('rebound:native-background'));true;",
        );
    });
    const link = Linking.addEventListener("url", ({ url }) => {
      if (url.startsWith("rebound://recovery")) {
        closeFocus();
        setRecoveryRequest((n) => n + 1);
      }
    });
    const received = Notifications.addNotificationResponseReceivedListener(
      () => {
        closeFocus();
        setRecoveryRequest((n) => n + 1);
      },
    );
    return () => {
      mounted = false;
      appState.remove();
      received.remove();
      link.remove();
    };
  }, []);
  async function connect() {
    try {
      const next = validateAppUrl(draft, __DEV__);
      await SecureStore.setItemAsync("rebound-app-origin", next, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      setLoadError("");
      setAppUrl(next);
    } catch (e) {
      Alert.alert(
        "Check the app address",
        e instanceof Error ? e.message : "Use your hosted HTTPS address.",
      );
    }
  }
  function useClip(base64: string, exerciseId: string, mimeType: string) {
    web.current?.injectJavaScript(
      `window.dispatchEvent(new CustomEvent('rebound:native-clip',{detail:${JSON.stringify({ base64, exerciseId, mimeType })}}));true;`,
    );
    setRecordExercise("");
  }
  async function handleBridge(raw: string, source: string) {
    try {
      if (!isAppDocumentUrl(source, appUrl) || raw.length > 1100000) return;
      const data = JSON.parse(raw);
      if (
        data.type === "REQUEST_CAMERA_PERMISSION" &&
        typeof data.requestId === "string" &&
        /^[a-f0-9-]{36}$/.test(data.requestId)
      ) {
        const permission = await requestCameraPermission();
        web.current?.injectJavaScript(
          `window.dispatchEvent(new CustomEvent('rebound:native-camera-permission',{detail:${JSON.stringify({ requestId: data.requestId, granted: permission.granted })}}));true;`,
        );
      }
      if (
        data.type === "RECORD_CLIP" &&
        typeof data.exerciseId === "string" &&
        /^[a-z0-9-]{1,64}$/.test(data.exerciseId)
      )
        setRecordExercise(data.exerciseId);
      if (data.type === "CAMERA_MODE" && typeof data.active === "boolean")
        setCameraMode(data.active);
      if (data.type === "RECOVERY_SNAPSHOT")
        setSnapshot(parseSnapshot(data.snapshot));
      if (data.type === "NATIVE_ACTION_RESULT" && data.accepted === false) {
        setFocused(false);
        Alert.alert(
          "Review your plan",
          data.reason || "This action is unavailable.",
        );
      }
      if (data.type === "EXPORT_FILE") await exportWebFile(data);
    } catch (e) {
      Alert.alert(
        "Request could not finish",
        e instanceof Error ? e.message : "Please try again.",
      );
    }
  }
  if (initializing)
    return (
      <View style={s.center}>
        <ActivityIndicator color="#476d49" />
      </View>
    );
  return (
    <SafeAreaView style={s.root} edges={cameraMode ? [] : undefined}>
      <StatusBar style={cameraMode ? "light" : "dark"} hidden={cameraMode} />
      {!cameraMode && !appUrl && (
        <View style={s.top}>
          <Text style={s.brand}>
            rebound<Text style={s.dot}>.</Text>
          </Text>
          {!!appUrl && (
            <View style={s.topActions}>
              <Pressable
                accessibilityLabel="iPhone reminder settings"
                onPress={() => setReminders(true)}
              >
                <Text style={s.topButton}>Alerts</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Change app server"
                onPress={() =>
                  Alert.alert(
                    "Change app server?",
                    "Your journal and clinic sign-in belong to the current server. A different address has separate data.",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Change", onPress: () => setAppUrl("") },
                    ],
                  )
                }
              >
                <Text style={s.topButton}>Server</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
      {!appUrl ? (
        <View style={s.setup}>
          <Text style={s.eyebrow}>YOUR IPHONE RECOVERY SPACE</Text>
          <Text style={s.title}>Ready when you are.</Text>
          <Text style={s.detail}>
            Connect this iPhone client to your Rebound web deployment. Your
            recovery home and movement library are designed for iPhone, with
            shared routines, guided lessons, and native reminders.
          </Text>
          <Text style={s.label}>Rebound HTTPS address</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholder="https://your-rebound-site.example"
            placeholderTextColor="#84927c"
            style={s.input}
          />
          <Pressable style={s.primary} onPress={connect}>
            <Text style={s.primaryText}>Open my Rebound</Text>
          </Pressable>
          <Text style={s.note}>
            The web app must be hosted first. During development, a Mac LAN
            address can preview screens, but camera coaching needs a secure
            HTTPS origin.
          </Text>
        </View>
      ) : (
        <PatientShell
          recoveryRequest={recoveryRequest}
          snapshot={snapshot}
          cameraMode={cameraMode}
          focused={focused || cameraMode || !!loadError}
          title={focusTitle}
          onClose={closeFocus}
          onAction={action}
          onAlerts={() => setReminders(true)}
          onSettings={() => setSettings(true)}
        >
          <View style={s.webContainer}>
            {appUrl.startsWith("http:") && (
              <Text style={s.devNote}>
                Development preview · camera coaching requires HTTPS.
              </Text>
            )}
            {!!loadError ? (
              <View style={s.center}>
                <Text style={s.detail}>{loadError}</Text>
                <Pressable style={s.primary} onPress={() => setLoadError("")}>
                  <Text style={s.primaryText}>Try again</Text>
                </Pressable>
                <Pressable style={s.primary} onPress={() => setSettings(true)}>
                  <Text style={s.primaryText}>Connection settings</Text>
                </Pressable>
              </View>
            ) : (
              <WebView<object>
                ref={web}
                source={{ uri: appUrl }}
                style={s.web}
                injectedJavaScript={nativePresentationScript}
                contentInsetAdjustmentBehavior="never"
                automaticallyAdjustContentInsets={false}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
                sharedCookiesEnabled
                thirdPartyCookiesEnabled={false}
                mixedContentMode="never"
                allowFileAccess={false}
                startInLoadingState
                renderLoading={() => (
                  <View style={s.loading}>
                    <ActivityIndicator color="#476d49" />
                  </View>
                )}
                onLoadStart={() => {
                  setCameraMode(false);
                  setSnapshot(null);
                }}
                onError={() =>
                  setLoadError(
                    "Rebound could not load. Check your connection and server address.",
                  )
                }
                onHttpError={(e) => {
                  if (e.nativeEvent.statusCode >= 400)
                    setLoadError(
                      `The app server returned ${e.nativeEvent.statusCode}.`,
                    );
                }}
                onShouldStartLoadWithRequest={(request) => {
                  try {
                    const next = new URL(request.url);
                    if (isAppDocumentUrl(request.url, appUrl)) return true;
                    if (["https:", "http:", "mailto:"].includes(next.protocol))
                      Linking.openURL(request.url).catch(() => {});
                    return false;
                  } catch {
                    return request.url === "about:blank";
                  }
                }}
                onMessage={(event) => {
                  void handleBridge(
                    event.nativeEvent.data,
                    event.nativeEvent.url,
                  );
                }}
              />
            )}
            {!foreground && (
              <View style={s.loading}>
                <Text style={s.detail}>
                  Camera activity is paused while Rebound is in the background.
                </Text>
              </View>
            )}
          </View>
        </PatientShell>
      )}
      {launch && <LaunchAnimation onFinish={() => setLaunch(false)} />}
      <Modal
        visible={!!recordExercise}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRecordExercise("")}
      >
        <SafeAreaView style={s.root}>
          {!!recordExercise && (
            <NativeRecorder
              exerciseId={recordExercise}
              onClose={() => setRecordExercise("")}
              onUse={useClip}
            />
          )}
        </SafeAreaView>
      </Modal>
      <Modal
        visible={settings}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettings(false)}
      >
        <SafeAreaView style={s.root}>
          <View style={{ padding: 26 }}>
            <Pressable onPress={() => setSettings(false)} style={s.primary}>
              <Text style={s.primaryText}>Done</Text>
            </Pressable>
            <Text style={s.title}>Your space.</Text>
            <Text style={s.detail}>Session widgets</Text>
            <Text style={s.note}>
              {widgetAvailable
                ? "Show today’s and total logged sessions on your Home or Lock Screen. Counts can be visible while your phone is locked. No injury details or clips are shared."
                : "Widgets require a native iOS development or App Store build. Expo Go cannot load the widget extension."}
            </Text>
            <Switch
              accessibilityLabel="Share session counts with widgets"
              disabled={!widgetAvailable}
              value={widgetEnabled}
              onValueChange={async (enabled) => {
                setWidgetEnabled(enabled);
                await SecureStore.setItemAsync(
                  "rebound-widget-enabled",
                  String(enabled),
                );
                if (!enabled) clearWidget();
                else if (snapshot)
                  updateWidget(
                    snapshot.stats.total,
                    snapshot.stats.today,
                    snapshot.updatedAt,
                  );
              }}
            />
            <Text style={s.note}>
              After enabling, long-press your Home Screen or customize your Lock
              Screen and add Rebound. Updates follow iOS scheduling.
            </Text>
            <Pressable
              style={s.primary}
              onPress={() => {
                setSettings(false);
                setSnapshot(null);
                setAppUrl("");
                clearWidget();
              }}
            >
              <Text style={s.primaryText}>Change app connection</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
      <Modal
        visible={reminders}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setReminders(false)}
      >
        <SafeAreaView style={s.root}>
          <NativeReminders
            planDays={snapshot?.routineDays}
            onClose={() => setReminders(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Rebound />
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f6ed" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 26,
    backgroundColor: "#f5f6ed",
  },
  top: {
    height: 54,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#dfe5d6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    fontSize: 25,
    fontWeight: "800",
    letterSpacing: -1.2,
    color: "#263d30",
  },
  dot: { color: "#9ab56c" },
  topActions: { flexDirection: "row", gap: 18 },
  topButton: { fontSize: 12, color: "#4f6a44", paddingVertical: 14 },
  setup: { padding: 26, flex: 1, justifyContent: "center" },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#779066",
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
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
  note: { fontSize: 12, lineHeight: 21, color: "#7b8972", marginTop: 20 },
  webContainer: { flex: 1 },
  web: { flex: 1, backgroundColor: "#f5f6ed" },
  devNote: {
    fontSize: 10,
    backgroundColor: "#f5e9cf",
    color: "#755d35",
    padding: 8,
    textAlign: "center",
  },
  loading: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6ed",
  },
});
