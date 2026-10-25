import { createClient } from "@supabase/supabase-js";
import { exerciseById } from "../domain/exercises";

const config = import.meta.env;
const url = config.VITE_SUPABASE_URL;
const key = config.VITE_SUPABASE_PUBLISHABLE_KEY;
export const clinic =
  url && key
    ? createClient(url, key, {
        auth: { flowType: "pkce", detectSessionInUrl: true },
      })
    : null;
export type Connection = {
  id: string;
  patient_id: string;
  clinician_id: string;
};
export type ClinicClip = {
  id: string;
  connection_id: string;
  exercise_id: string;
  storage_path: string;
  created_at: string;
  uploaded_at: string | null;
};
export async function uploadClinicClip(
  connectionId: string,
  exerciseId: string,
  blob: Blob,
) {
  if (!clinic) throw Error("Clinic is not connected.");
  if (
    !exerciseById.has(exerciseId) ||
    !["video/mp4", "video/webm", "video/quicktime"].includes(
      blob.type.split(";")[0],
    ) ||
    blob.size > 20 * 1024 * 1024 ||
    blob.size === 0
  )
    throw Error("Choose an MP4, MOV, or WebM clip smaller than 20 MB.");
  const {
    data: { user },
  } = await clinic.auth.getUser();
  if (!user) throw Error("Sign in before sharing a clip.");
  const id = crypto.randomUUID();
  const extension = blob.type.startsWith("video/quicktime")
    ? "mov"
    : blob.type.startsWith("video/mp4")
      ? "mp4"
      : "webm";
  const path = `${connectionId}/${user.id}/${id}.${extension}`;
  const { error: insertError } = await clinic.from("clinic_clips").insert({
    id,
    connection_id: connectionId,
    patient_id: user.id,
    exercise_id: exerciseId,
    storage_path: path,
    consent_at: new Date().toISOString(),
  });
  if (insertError) throw insertError;
  const { error: uploadError } = await clinic.storage
    .from("clinic-clips")
    .upload(path, blob, {
      contentType: blob.type.split(";")[0],
      upsert: false,
    });
  if (uploadError) {
    await clinic.from("clinic_clips").delete().eq("id", id);
    throw uploadError;
  }
  const { error: finalError } = await clinic
    .from("clinic_clips")
    .update({ uploaded_at: new Date().toISOString() })
    .eq("id", id);
  if (finalError) {
    await clinic.storage.from("clinic-clips").remove([path]);
    await clinic.from("clinic_clips").delete().eq("id", id);
    throw finalError;
  }
  return id;
}

export { parsePlan, type ClinicPlan } from "../domain/clinic";
