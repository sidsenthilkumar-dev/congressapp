import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
const db = new PGlite({ extensions: { pgcrypto } });
const patient = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const doctor = "00000000-0000-4000-8000-000000000003";
const unapproved = "00000000-0000-4000-8000-000000000004";
const otherDoctor = "00000000-0000-4000-8000-000000000005";
let connection;
async function as(user, query, values = []) {
  await db.exec("set role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
  try {
    return await db.query(query, values);
  } finally {
    await db.exec("reset role");
  }
}
before(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create schema storage; create schema extensions;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant usage on schema public,auth,storage,extensions to authenticated,anon;
    grant select,insert,delete on storage.objects to authenticated;
    grant select on storage.objects to anon;`);
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202610250001_clinic.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  for (const id of [patient, other, doctor, unapproved, otherDoctor])
    await db.query("insert into auth.users values($1)", [id]);
  for (const [id, approved] of [
    [doctor, true],
    [unapproved, false],
    [otherDoctor, true],
  ])
    await db.query(
      "insert into clinician_profiles values($1,'Test clinician',$2)",
      [id, approved],
    );
});
after(async () => db.close());
test("patient cannot self-approve, invent a care connection, or issue a doctor invitation", async () => {
  await assert.rejects(
    as(
      patient,
      "insert into clinician_profiles values($1,'Forged clinician',true)",
      [patient],
    ),
  );
  await assert.rejects(
    as(
      patient,
      "insert into clinic_connections(patient_id,clinician_id) values($1,$2)",
      [patient, doctor],
    ),
  );
  await assert.rejects(as(unapproved, "select create_clinic_invite()"));
});
test("invitations are single-use and other accounts cannot read a patient connection", async () => {
  const invite = (await as(doctor, "select create_clinic_invite() token"))
    .rows[0].token;
  assert.equal(invite.length, 48);
  connection = (
    await as(patient, "select accept_clinic_invite($1) id", [invite])
  ).rows[0].id;
  await assert.rejects(as(other, "select accept_clinic_invite($1)", [invite]));
  assert.equal(
    (await as(patient, "select * from clinic_connections")).rows.length,
    1,
  );
  assert.equal(
    (await as(other, "select * from clinic_connections")).rows.length,
    0,
  );
  assert.equal(
    (await as(otherDoctor, "select * from clinic_connections")).rows.length,
    0,
  );
});
test("only the approved connected clinician can send a valid patient plan", async () => {
  const content = {
    title: "Test plan",
    notes: "Individual restrictions",
    items: [
      { exerciseId: "bicep-curl", note: "Follow prescribed range", reps: 2 },
    ],
  };
  await as(
    doctor,
    "insert into clinic_plans(connection_id,author_id,content) values($1,$2,$3)",
    [connection, doctor, JSON.stringify(content)],
  );
  await assert.rejects(
    as(
      patient,
      "insert into clinic_plans(connection_id,author_id,content) values($1,$2,$3)",
      [connection, doctor, JSON.stringify(content)],
    ),
  );
  await assert.rejects(
    as(
      otherDoctor,
      "insert into clinic_plans(connection_id,author_id,content) values($1,$2,$3)",
      [connection, otherDoctor, JSON.stringify(content)],
    ),
  );
  await assert.rejects(
    as(
      doctor,
      "insert into clinic_plans(connection_id,author_id,content) values($1,$2,$3)",
      [
        connection,
        doctor,
        JSON.stringify({
          ...content,
          items: [{ exerciseId: "bicep-curl", note: "", reps: 999 }],
        }),
      ],
    ),
  );
  assert.equal(
    (await as(patient, "select * from clinic_plans")).rows.length,
    1,
  );
  assert.equal((await as(other, "select * from clinic_plans")).rows.length, 0);
});
const clipId = "10000000-0000-4000-8000-000000000001";
let path;
test("private clip paths, upload ownership, finalization, and clinician access are enforced", async () => {
  path = `${connection}/${patient}/${clipId}.mp4`;
  await as(
    patient,
    "insert into clinic_clips(id,connection_id,patient_id,exercise_id,storage_path,consent_at) values($1,$2,$3,'bicep-curl',$4,now())",
    [clipId, connection, patient, path],
  );
  await assert.rejects(
    as(
      other,
      "insert into storage.objects(bucket_id,name) values('clinic-clips',$1)",
      [path],
    ),
  );
  await assert.rejects(
    as(
      patient,
      "insert into storage.objects(bucket_id,name) values('clinic-clips','unrelated/private.mp4')",
    ),
  );
  await as(
    patient,
    "insert into storage.objects(bucket_id,name) values('clinic-clips',$1)",
    [path],
  );
  assert.equal(
    (await as(doctor, "select * from storage.objects")).rows.length,
    0,
  );
  await as(patient, "update clinic_clips set uploaded_at=now() where id=$1", [
    clipId,
  ]);
  assert.equal(
    (await as(doctor, "select * from storage.objects")).rows.length,
    1,
  );
  assert.equal(
    (await as(otherDoctor, "select * from storage.objects")).rows.length,
    0,
  );
  assert.equal(
    (await as(other, "select * from storage.objects")).rows.length,
    0,
  );
  await assert.rejects(
    as(patient, "update clinic_clips set patient_id=$1 where id=$2", [
      other,
      clipId,
    ]),
  );
  assert.equal(
    (
      await db.query(
        "select public from storage.buckets where id='clinic-clips'",
      )
    ).rows[0].public,
    false,
  );
});
test("disconnect revokes clinician access while the patient can still remove their clip", async () => {
  await as(patient, "select disconnect_clinic($1)", [connection]);
  assert.equal(
    (await as(doctor, "select * from storage.objects")).rows.length,
    0,
  );
  assert.equal((await as(doctor, "select * from clinic_clips")).rows.length, 0);
  assert.equal(
    (await as(patient, "select * from storage.objects")).rows.length,
    1,
  );
  await as(patient, "delete from storage.objects where name=$1", [path]);
  await as(patient, "delete from clinic_clips where id=$1", [clipId]);
  assert.equal(
    (await as(patient, "select * from clinic_clips")).rows.length,
    0,
  );
});
test("the AI request budget is enforced per authenticated user", async () => {
  for (let i = 0; i < 3; i++)
    assert.equal(
      (await as(patient, "select take_assistant_budget() allowed")).rows[0]
        .allowed,
      true,
    );
  assert.equal(
    (await as(patient, "select take_assistant_budget() allowed")).rows[0]
      .allowed,
    false,
  );
  assert.equal(
    (await as(other, "select take_assistant_budget() allowed")).rows[0].allowed,
    true,
  );
});
