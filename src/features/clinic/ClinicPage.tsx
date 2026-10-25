import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { Building2, ShieldCheck, Upload, Link2 } from "lucide-react";
import {
  clinic,
  parsePlan,
  uploadClinicClip,
  type ClinicPlan,
  type Connection,
  type ClinicClip,
} from "../../services/clinic";
import { exerciseById } from "../../domain/exercises";
import { ClipRecorder } from "./ClipRecorder";
import { ClinicPlanCard } from "./ClinicPlanCard";
import { ClinicPlanComposer } from "./ClinicPlanComposer";
import type { SessionInstructions } from "../../domain/types";

export function ClinicPage({
  onOpen,
  onImport,
}: {
  onOpen: (id: string, instructions: SessionInstructions) => void;
  onImport: (plan: ClinicPlan["content"]) => void;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [loginCode, setLoginCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [connectionId, setConnectionId] = useState("");
  const [clinician, setClinician] = useState(false);
  const [plans, setPlans] = useState<ClinicPlan[]>([]);
  const [clips, setClips] = useState<ClinicClip[]>([]);
  const [invite, setInvite] = useState("");
  const [code, setCode] = useState("");
  const [reviewed, setReviewed] = useState<{
    blob: Blob;
    exerciseId: string;
  } | null>(null);
  const [clipConsent, setClipConsent] = useState(false);
  const [imported, setImported] = useState<ClinicPlan["content"] | null>(null);
  const [viewer, setViewer] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");
  const refreshRequest = useRef(0);
  const mounted = useRef(true);
  async function refresh() {
    if (!clinic) return;
    const request = ++refreshRequest.current;
    const {
      data: { user },
      error: authError,
    } = await clinic.auth.getUser();
    if (!mounted.current || request !== refreshRequest.current) return;
    if (authError && user) throw authError;
    setUser(user);
    if (!user) {
      setConnections([]);
      setPlans([]);
      setClips([]);
      setClinician(false);
      setConnectionId("");
      return;
    }
    const [c, p, v, role] = await Promise.all([
      clinic
        .from("clinic_connections")
        .select("id,patient_id,clinician_id")
        .eq("active", true),
      clinic
        .from("clinic_plans")
        .select("id,connection_id,created_at,content")
        .order("created_at", { ascending: false }),
      clinic
        .from("clinic_clips")
        .select(
          "id,connection_id,exercise_id,storage_path,created_at,uploaded_at",
        )
        .not("uploaded_at", "is", null)
        .order("created_at", { ascending: false }),
      clinic
        .from("clinician_profiles")
        .select("approved")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    for (const r of [c, p, v, role]) if (r.error) throw r.error;
    if (!mounted.current || request !== refreshRequest.current) return;
    setConnections(c.data || []);
    setConnectionId((current) =>
      c.data?.some((row) => row.id === current)
        ? current
        : c.data?.[0]?.id || "",
    );
    setPlans(
      (p.data || []).flatMap((row) => {
        try {
          return [{ ...row, content: parsePlan(row.content) }];
        } catch {
          return [];
        }
      }),
    );
    setClips(v.data || []);
    setClinician(role.data?.approved === true);
  }
  useEffect(() => {
    mounted.current = true;
    refresh().catch(() =>
      setError(
        "Clinic could not load. Check the service configuration or sign in again.",
      ),
    );
    const sub = clinic?.auth.onAuthStateChange(() => {
      refreshRequest.current++;
      setTimeout(() => {
        if (mounted.current)
          refresh().catch(() => setError("Clinic could not refresh."));
      }, 0);
    });
    return () => {
      mounted.current = false;
      refreshRequest.current++;
      sub?.data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!reviewed) {
      setReviewUrl("");
      return;
    }
    const url = URL.createObjectURL(reviewed.blob);
    setReviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [reviewed]);
  useEffect(() => {
    if (!window.ReactNativeWebView) return;
    const receive = (event: Event) => {
      try {
        const data = (event as CustomEvent).detail;
        if (
          !data ||
          !["video/mp4", "video/quicktime"].includes(data.mimeType) ||
          typeof data.base64 !== "string" ||
          data.base64.length > 8500000 ||
          !exerciseById.has(data.exerciseId)
        )
          throw Error(
            "The clip could not be attached. Save it on your iPhone and choose the file instead.",
          );
        const raw = atob(data.base64),
          bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
        setReviewed({
          blob: new Blob([bytes], { type: data.mimeType }),
          exerciseId: data.exerciseId,
        });
        setClipConsent(false);
        setMessage(
          "iPhone clip attached locally. Review it below before sharing; nothing has been uploaded.",
        );
      } catch {
        setError(
          "The iPhone clip could not be attached. Save it and choose the file instead.",
        );
      }
    };
    window.addEventListener("rebound:native-clip", receive);
    return () => window.removeEventListener("rebound:native-clip", receive);
  }, []);
  async function action(run: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await run();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The clinic request failed. Nothing was marked as sent.",
      );
    } finally {
      setBusy(false);
    }
  }
  const planCard = (
    plan: ClinicPlan["content"],
    key: string,
    verified: boolean,
  ) => (
    <ClinicPlanCard
      key={key}
      plan={plan}
      verified={verified}
      onOpen={onOpen}
      onImport={onImport}
    />
  );
  return (
    <div className="clinic-layout">
      <section className="feature-card clinic-main">
        <span className="eyebrow">
          <Building2 size={15} /> YOUR CLINIC
        </span>
        <h2>A clearer connection to care.</h2>
        <p>
          Receive a clinician’s exercises, follow the guides, and share only the
          clips you have reviewed.
        </p>
        {!clinic && (
          <div className="clinic-connection-note">
            <Link2 size={22} />
            <div>
              <strong>Clinic delivery is not connected yet.</strong>
              <p>
                Your clinic hasn’t been connected to Rebound. You can still
                review a plan file or record a private clip. Sharing becomes
                available once your care account is connected.
              </p>
            </div>
          </div>
        )}
        {clinic && !user && (
          <>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                action(async () => {
                  const { error } = await clinic!.auth.signInWithOtp({
                    email,
                    options: {
                      emailRedirectTo:
                        new URL(import.meta.env.BASE_URL, location.origin)
                          .href + "#clinic",
                    },
                  });
                  if (error) throw error;
                  setCodeRequested(true);
                  setMessage(
                    "Check your email for your clinic’s sign-in instructions. If it includes a code, enter it here to stay in this app. No clinician connection is created automatically.",
                  );
                });
              }}
            >
              <label htmlFor="clinic-email">Your email</label>
              <input
                id="clinic-email"
                type="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button className="dark" disabled={busy}>
                Email sign-in instructions
              </button>
            </form>
            {codeRequested && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action(async () => {
                    const { error } = await clinic!.auth.verifyOtp({
                      email,
                      token: loginCode.trim(),
                      type: "email",
                    });
                    if (error) throw error;
                    setLoginCode("");
                    await refresh();
                  });
                }}
              >
                <label htmlFor="clinic-login-code">
                  Code from your clinic sign-in email
                </label>
                <input
                  id="clinic-login-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6,8}"
                  maxLength={8}
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                />
                <button className="outline" disabled={busy}>
                  Sign in with code
                </button>
              </form>
            )}
          </>
        )}
        {user && (
          <div className="clinic-account">
            <span>
              Signed in as {user.email} ·{" "}
              {clinician ? "Approved clinician" : "Patient"}
            </span>
            <button
              className="text-button"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const result = await clinic!.auth.signOut();
                  if (result.error) throw result.error;
                  await refresh();
                  setReviewed(null);
                  setClipConsent(false);
                })
              }
            >
              Sign out
            </button>
            <button
              className="outline"
              disabled={busy}
              onClick={() => action(refresh)}
            >
              Refresh clinic
            </button>
          </div>
        )}
        {user && !clinician && (
          <form
            className="clinic-invite"
            onSubmit={(e) => {
              e.preventDefault();
              action(async () => {
                const { error } = await clinic!.rpc("accept_clinic_invite", {
                  invite_token: code.trim(),
                });
                if (error) throw error;
                setCode("");
                await refresh();
                setMessage(
                  "Clinician connection added. Confirm their identity through your clinic before sharing.",
                );
              });
            }}
          >
            <label htmlFor="clinic-code">
              One-time invitation from your clinician
            </label>
            <input
              id="clinic-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              maxLength={128}
              autoComplete="off"
            />
            <button className="outline" disabled={busy}>
              Connect with invitation
            </button>
          </form>
        )}
        {clinician && (
          <section className="clinic-invite">
            <button
              className="outline"
              disabled={busy}
              onClick={() =>
                action(async () => {
                  const { data, error } = await clinic!.rpc(
                    "create_clinic_invite",
                  );
                  if (error) throw error;
                  setInvite(String(data));
                })
              }
            >
              Create a patient invitation
            </button>
            {invite && (
              <p>
                Share privately with your patient. Expires in 24 hours, one use:{" "}
                <code>{invite}</code>
              </p>
            )}
          </section>
        )}
        {connections.length > 0 && (
          <label>
            Selected care connection
            <select
              disabled={busy}
              value={connectionId}
              onChange={(e) => {
                setConnectionId(e.target.value);
                setClipConsent(false);
                setViewer("");
              }}
            >
              {connections.map((c) => (
                <option key={c.id} value={c.id}>
                  {clinician ? "Patient" : "Clinician"} ·{" "}
                  {(clinician ? c.patient_id : c.clinician_id).slice(0, 8)} ·{" "}
                  {c.id.slice(0, 6)}
                </option>
              ))}
            </select>
            <small>
              Connection IDs are account identifiers, not proof of a
              professional credential. Verify through your clinic.
            </small>
          </label>
        )}
        {connectionId && (
          <button
            className="text-button"
            disabled={busy}
            onClick={() => {
              if (
                confirm(
                  "Disconnect this care connection? New plan and clip sharing will stop. Existing signed links can remain valid for up to 3 minutes; downloaded copies cannot be recalled.",
                )
              )
                action(async () => {
                  const { error } = await clinic!.rpc("disconnect_clinic", {
                    connection: connectionId,
                  });
                  if (error) throw error;
                  await refresh();
                  setViewer("");
                  setClipConsent(false);
                  setMessage("Care connection disconnected.");
                });
            }}
          >
            Disconnect care connection
          </button>
        )}
        {clinician && connectionId && (
          <ClinicPlanComposer
            busy={busy}
            onSend={(content) =>
              action(async () => {
                const { error } = await clinic!.from("clinic_plans").insert({
                  connection_id: connectionId,
                  author_id: user!.id,
                  content,
                });
                if (error) throw error;
                await refresh();
                setMessage("Plan saved to this patient’s clinic account.");
              })
            }
          />
        )}
        <div className="clinic-plans">
          <h3>Your exercise plans</h3>
          {plans
            .filter((p) => p.connection_id === connectionId)
            .map((plan) => planCard(plan.content, plan.id, true))}
          {!plans.filter((p) => p.connection_id === connectionId).length &&
            !imported && (
              <p>
                No plans received yet. Nothing is prefilled as if a clinician
                sent it.
              </p>
            )}
          {imported && planCard(imported, "imported", false)}
        </div>
        <label className="clip-file">
          Review a clinician plan file
          <input
            aria-label="Import clinician plan file"
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setError("");
              try {
                if (file.size > 100000)
                  throw Error("Plan files must be smaller than 100 KB.");
                setImported(parsePlan(JSON.parse(await file.text())));
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Invalid plan file.",
                );
              }
              e.target.value = "";
            }}
          />
        </label>
        {!clinician && (
          <ClipRecorder
            disabled={busy}
            onDiscard={() => {
              setReviewed(null);
              setClipConsent(false);
              setMessage("Local clip discarded.");
            }}
            onReady={(blob, exerciseId) => {
              setReviewed({ blob, exerciseId });
              setClipConsent(false);
              setMessage(
                "Clip selected locally. It has not been uploaded or sent.",
              );
            }}
          />
        )}
        {reviewed && (
          <section className="clip-send">
            <strong>
              Ready for your review ·{" "}
              {(reviewed.blob.size / 1024 / 1024).toFixed(1)} MB
            </strong>
            <video
              src={reviewUrl || undefined}
              controls
              playsInline
              aria-label="Selected clip for review"
            />
            <p>
              {exerciseById.get(reviewed.exerciseId)?.name}. Sharing includes
              the clip, exercise name, your clinic account, and upload time.
              Existing files may include audio or identifying details: review
              before sharing. Your full journal is not attached.
            </p>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={clipConsent}
                disabled={busy}
                onChange={(e) => setClipConsent(e.target.checked)}
              />
              I reviewed this clip, verified the selected clinician, and consent
              to upload it to this care connection.
            </label>
            <button
              className="dark"
              disabled={
                !clinic || !user || !connectionId || !clipConsent || busy
              }
              onClick={() =>
                action(async () => {
                  await uploadClinicClip(
                    connectionId,
                    reviewed.exerciseId,
                    reviewed.blob,
                  );
                  setReviewed(null);
                  setClipConsent(false);
                  await refresh();
                  setMessage(
                    "Clip uploaded to your connected clinician’s account. This does not confirm that they watched it.",
                  );
                })
              }
            >
              <Upload size={16} />
              {busy ? "Uploading…" : "Share reviewed clip with clinician"}
            </button>
            <button
              className="text-button"
              disabled={busy}
              onClick={() => {
                setReviewed(null);
                setClipConsent(false);
              }}
            >
              Remove selected clip
            </button>
          </section>
        )}
        {clips.filter((c) => !clinician || c.connection_id === connectionId)
          .length > 0 && (
          <section className="clinic-clips">
            <h3>Shared clips</h3>
            {clips
              .filter((c) => !clinician || c.connection_id === connectionId)
              .map((clip) => (
                <article key={clip.id}>
                  <span>
                    {exerciseById.get(clip.exercise_id)?.name || "Exercise"} ·{" "}
                    {new Date(clip.created_at).toLocaleDateString()}
                  </span>
                  <button
                    className="outline"
                    onClick={() =>
                      action(async () => {
                        const { data, error } = await clinic!.storage
                          .from("clinic-clips")
                          .createSignedUrl(clip.storage_path, 180);
                        if (error) throw error;
                        setViewer(data.signedUrl);
                      })
                    }
                  >
                    Review clip
                  </button>
                  {!clinician && (
                    <button
                      className="text-button"
                      onClick={() =>
                        action(async () => {
                          const { error } = await clinic!.storage
                            .from("clinic-clips")
                            .remove([clip.storage_path]);
                          if (error) throw error;
                          const result = await clinic!
                            .from("clinic_clips")
                            .delete()
                            .eq("id", clip.id);
                          if (result.error) throw result.error;
                          setViewer("");
                          await refresh();
                          setMessage(
                            "Clip removed from clinic storage. Previously downloaded copies cannot be recalled.",
                          );
                        })
                      }
                    >
                      Delete shared clip
                    </button>
                  )}
                </article>
              ))}
            {viewer && (
              <video
                src={viewer}
                controls
                playsInline
                aria-label="Shared clinic clip"
              />
            )}
          </section>
        )}
        {message && (
          <p className="clinic-status" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="warning" role="alert">
            {error}
          </p>
        )}
      </section>
      <aside className="feature-card clinic-aside">
        <ShieldCheck size={26} />
        <h3>Your permission matters.</h3>
        <p>
          No background recording. No automatic clip selection or upload. Your
          clinician only sees clips explicitly shared with their connected
          account.
        </p>
        <p>
          Clinic messages are not monitored for emergencies. Seek urgent care
          directly when needed.
        </p>
        <p>
          Clinic is a prototype. Use test information until your clinic has
          completed setup and reviewed how personal data is handled.
        </p>
      </aside>
    </div>
  );
}
