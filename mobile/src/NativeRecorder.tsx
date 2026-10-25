import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { File } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { VideoView, useVideoPlayer } from "expo-video";
import { nativeClipFormat } from "./config";

function Review({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri);
  return (
    <VideoView
      player={player}
      style={s.camera}
      fullscreenOptions={{ enable: true }}
      nativeControls
    />
  );
}
export function NativeRecorder({
  exerciseId,
  onClose,
  onUse,
}: {
  exerciseId: string;
  onClose: () => void;
  onUse: (base64: string, exerciseId: string, mimeType: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [uri, setUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const camera = useRef<CameraView>(null);
  const active = useRef(true);
  const clip = useRef("");
  useEffect(() => {
    active.current = true;
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") camera.current?.stopRecording();
    });
    return () => {
      active.current = false;
      camera.current?.stopRecording();
      if (clip.current) {
        try {
          new File(clip.current).delete();
        } catch {}
      }
      sub.remove();
    };
  }, []);
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  async function record() {
    if (!ready || recording) return;
    setRecording(true);
    setElapsed(0);
    try {
      const result = await camera.current?.recordAsync({
        maxDuration: 20,
        maxFileSize: 6 * 1024 * 1024,
        codec: "avc1",
      });
      if (result?.uri) {
        if (!active.current) {
          new File(result.uri).delete();
          return;
        }
        clip.current = result.uri;
        setUri(result.uri);
      }
    } catch {
      if (active.current)
        Alert.alert(
          "Recording could not finish",
          "Nothing was uploaded. Check camera access and try again.",
        );
    } finally {
      if (active.current) setRecording(false);
    }
  }
  async function useClip() {
    setBusy(true);
    try {
      const file = new File(uri);
      if (!file.exists || !file.size || file.size > 6 * 1024 * 1024)
        throw Error(
          "Use a shorter clip, or save it and select the file in Clinic.",
        );
      const base64 = await file.base64();
      onUse(base64, exerciseId, nativeClipFormat(uri).mimeType);
    } catch (e) {
      Alert.alert(
        "Clip could not be attached",
        e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <View style={s.root}>
      <View style={s.heading}>
        <View>
          <Text style={s.eyebrow}>PRIVATE CLIP</Text>
          <Text style={s.title}>A little context for care.</Text>
        </View>
        <Pressable
          accessibilityLabel="Close private recorder"
          disabled={recording || busy}
          onPress={onClose}
        >
          <Text style={s.close}>Close</Text>
        </Pressable>
      </View>
      <Text style={s.detail}>
        Silent video, up to 20 seconds. Recording is separate from AI coaching.
        Review before attaching; nothing uploads automatically.
      </Text>
      {!permission ? (
        <ActivityIndicator />
      ) : !permission.granted ? (
        <View style={s.empty}>
          <Text style={s.detail}>
            Camera access is needed only when you choose to record.
          </Text>
          <Pressable style={s.primary} onPress={requestPermission}>
            <Text style={s.primaryText}>Allow camera access</Text>
          </Pressable>
        </View>
      ) : uri ? (
        <Review uri={uri} />
      ) : (
        <CameraView
          ref={camera}
          mode="video"
          facing="front"
          mute
          videoQuality="480p"
          videoBitrate={1000000}
          onCameraReady={() => setReady(true)}
          style={s.camera}
        />
      )}
      {permission?.granted && !uri && (
        <Pressable
          style={[s.primary, recording && s.stop]}
          disabled={!ready}
          onPress={recording ? () => camera.current?.stopRecording() : record}
        >
          <Text style={s.primaryText}>
            {recording
              ? `Stop · ${elapsed} / 20 sec`
              : "Start silent recording"}
          </Text>
        </Pressable>
      )}
      {!!uri && (
        <>
          <Pressable style={s.primary} disabled={busy} onPress={useClip}>
            <Text style={s.primaryText}>
              {busy ? "Preparing…" : "Attach reviewed clip to Clinic"}
            </Text>
          </Pressable>
          <Pressable
            style={s.secondary}
            disabled={busy}
            onPress={async () => {
              if (await Sharing.isAvailableAsync())
                await Sharing.shareAsync(uri, {
                  mimeType: nativeClipFormat(uri).mimeType,
                  UTI: nativeClipFormat(uri).uti,
                  dialogTitle: "Save or share your reviewed clip",
                });
              else
                Alert.alert(
                  "Sharing unavailable",
                  "Attach the clip in Clinic instead.",
                );
            }}
          >
            <Text style={s.secondaryText}>Save or share with another app</Text>
          </Pressable>
          <Pressable
            style={s.secondary}
            disabled={busy}
            onPress={() => {
              try {
                new File(uri).delete();
              } catch {}
              clip.current = "";
              setUri("");
              setReady(false);
            }}
          >
            <Text style={s.secondaryText}>Discard and try again</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  root: { flex: 1, padding: 22, backgroundColor: "#f5f6ed" },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#718568",
    fontWeight: "700",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#263d30", marginTop: 10 },
  close: { color: "#436b43", fontSize: 14, padding: 10 },
  detail: {
    color: "#62705e",
    lineHeight: 23,
    fontSize: 14,
    marginVertical: 18,
  },
  camera: {
    width: "100%",
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#20372a",
    marginBottom: 16,
  },
  empty: { flex: 1, justifyContent: "center" },
  primary: {
    backgroundColor: "#294735",
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 12,
  },
  primaryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  secondary: { padding: 15, alignItems: "center" },
  secondaryText: { color: "#46633e", fontSize: 14 },
  stop: { backgroundColor: "#9e493c" },
});
