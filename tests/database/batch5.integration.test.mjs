import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
let client;
let localTarget = false;
try {
  const parsed = new URL(url ?? "");
  const database = parsed.pathname.replace(/^\//, "");
  localTarget =
    process.env.MOMENTUS_TEST_DATABASE === "1" &&
    ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) &&
    Boolean(database);
} catch {
  localTarget = false;
}

const organizationIds = [];
const managerId = randomUUID();
const otherManagerId = randomUUID();

if (localTarget) {
  // The URL is only used after a strict loopback and explicit opt-in check.
  client = postgres(url, { max: 8, connect_timeout: 5 });
}

after(async () => {
  if (!client) return;
  for (const organizationId of organizationIds) {
    await client`delete from public.organizations where id = ${organizationId}`;
  }
  await client.end({ timeout: 5 });
});

async function withClaim(userId, role, callback) {
  return client.begin(async (tx) => {
    await tx.unsafe(`set local role ${role}`);
    const claims = JSON.stringify({ sub: userId, aal: "aal2", role });
    await tx`select set_config('request.jwt.claim.sub', ${userId}, true)`;
    await tx`select set_config('request.jwt.claims', ${claims}, true)`;
    return callback(tx);
  });
}

async function makeEvent({
  mode = "open",
  approval = false,
  waitlist = false,
  capacity = 1,
} = {}) {
  const organizationId = randomUUID();
  const eventId = randomUUID();
  organizationIds.push(organizationId);
  await client`insert into public.organizations(id,name,created_by) values (${organizationId},'Synthetic Batch 5 Tenant',${managerId})`;
  await client`insert into public.organization_memberships(organization_id,user_id,role) values (${organizationId},${managerId},'owner')`;
  await client`
    insert into public.events(id,organization_id,name,event_date,event_time,timezone,capacity,status,guest_mode)
    values (${eventId},${organizationId},'Synthetic Capacity Event','2035-06-01','12:00','UTC',${capacity},'published','rsvp')
  `;
  await withClaim(managerId, "authenticated", async (tx) => {
    await tx`
      select public.save_event_registration_config(
        ${eventId},${mode}::public.registration_mode,${approval},${waitlist},null,null,'{}'::jsonb,'[]'::jsonb
      )
    `;
  });
  return { organizationId, eventId };
}

async function submit(
  eventId,
  {
    key = randomUUID(),
    email = `${randomUUID()}@example.test`,
    name = "Synthetic Guest",
  } = {},
) {
  return withClaim(
    managerId,
    "anon",
    (tx) => tx`
    select * from public.submit_open_registration(
      ${eventId},${key},${email},${JSON.stringify([{ name, attendanceStatus: "attending", answers: {} }])}::jsonb
    )
  `,
  );
}

test("registration form persists a versioned configuration and returns only public fields", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent();
  await withClaim(managerId, "authenticated", async (tx) => {
    await tx`
      select public.save_event_registration_config(
        ${eventId},'open'::public.registration_mode,false,true,null,null,'{}'::jsonb,
        '[{"key":"shirt_size","label":"Shirt size","type":"radio","required":true,"options":["S","M"]}]'::jsonb
      )
    `;
  });
  const [form] =
    await client`select public.get_open_registration_form(${eventId}) as form`;
  assert.equal(form.form.questions[0].key, "shirt_size");
  assert.equal(form.form.questions[0].required, true);
});

test("tenant RLS prevents a manager from reading another organization's registrations", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent();
  await submit(eventId);
  const otherOrganizationId = randomUUID();
  organizationIds.push(otherOrganizationId);
  await client`insert into public.organizations(id,name,created_by) values (${otherOrganizationId},'Second Synthetic Tenant',${otherManagerId})`;
  await client`insert into public.organization_memberships(organization_id,user_id,role) values (${otherOrganizationId},${otherManagerId},'owner')`;
  const rows = await withClaim(
    otherManagerId,
    "authenticated",
    (tx) =>
      tx`select id from public.open_registrations where event_id=${eventId}`,
  );
  assert.equal(rows.length, 0);
});

test("concurrent final-seat submissions serialize and duplicate retries are idempotent", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent({ waitlist: true, capacity: 2 });
  const retryKey = randomUUID();
  const samePayload = {
    key: retryKey,
    email: "retry@example.test",
    name: "Retry Guest",
  };
  const retries = await Promise.all([
    submit(eventId, samePayload),
    submit(eventId, samePayload),
  ]);
  assert.equal(retries[0][0].registration_id, retries[1][0].registration_id);
  assert.equal(retries.filter((rows) => rows[0].replayed).length, 1);
  await assert.rejects(
    submit(eventId, { ...samePayload, email: "changed@example.test" }),
    /already used for another request/i,
  );

  const competing = await Promise.all([
    submit(eventId, { email: "one@example.test" }),
    submit(eventId, { email: "two@example.test" }),
  ]);
  const statuses = competing.map((rows) => rows[0].registration_status);
  assert.equal(statuses.filter((status) => status === "confirmed").length, 1);
  assert.equal(statuses.filter((status) => status === "waitlisted").length, 1);
  const waitlisted = competing.find(
    (rows) => rows[0].registration_status === "waitlisted",
  )[0];
  await withClaim(
    managerId,
    "authenticated",
    (tx) =>
      tx`select public.transition_open_registration(${retries[0][0].registration_id},'cancel','Free synthetic test seat')`,
  );
  const [promoted] = await withClaim(
    managerId,
    "authenticated",
    (tx) =>
      tx`select public.transition_open_registration(${waitlisted.registration_id},'promote','Promote from synthetic waitlist') as status`,
  );
  assert.equal(promoted.status, "confirmed");
  const [count] =
    await client`select reserved_places as count from public.events where id=${eventId}`;
  assert.equal(count.count, 2);
});

test("approval and authorized transitions preserve the reservation counter and history", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent({
    mode: "approval",
    approval: true,
    capacity: 1,
  });
  const [registration] = await submit(eventId, {
    email: "approve@example.test",
  });
  assert.equal(registration.registration_status, "pending");
  const [status] = await withClaim(
    managerId,
    "authenticated",
    (tx) =>
      tx`select public.transition_open_registration(${registration.registration_id},'approve','Synthetic review') as status`,
  );
  assert.equal(status.status, "confirmed");
  const [event] =
    await client`select reserved_places from public.events where id=${eventId}`;
  assert.equal(event.reserved_places, 1);
  const history =
    await client`select to_status from public.registration_history where registration_id=${registration.registration_id} order by created_at`;
  assert.deepEqual(
    history.map((row) => row.to_status),
    ["pending", "confirmed"],
  );
});

test("a guest can cancel only with the registration's event-scoped bearer key", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent({ capacity: 1 });
  const key = randomUUID();
  const [registration] = await submit(eventId, {
    key,
    email: "guest-cancel@example.test",
  });
  const [status] = await withClaim(
    managerId,
    "anon",
    (tx) =>
      tx`select public.cancel_open_registration(${eventId},${key}) as status`,
  );
  assert.equal(status.status, "cancelled");
  const [retry] = await withClaim(
    managerId,
    "anon",
    (tx) =>
      tx`select public.cancel_open_registration(${eventId},${key}) as status`,
  );
  assert.equal(retry.status, "cancelled");
  await assert.rejects(
    withClaim(
      managerId,
      "anon",
      (tx) =>
        tx`select public.cancel_open_registration(${eventId},${randomUUID()})`,
    ),
    /registration is unavailable/i,
  );
  const [event] =
    await client`select reserved_places from public.events where id=${eventId}`;
  assert.equal(event.reserved_places, 0);
  const [registrationRow] =
    await client`select status from public.open_registrations where id=${registration.registration_id}`;
  assert.equal(registrationRow.status, "cancelled");
});

test("answer validation rejects missing required custom fields atomically", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent();
  await withClaim(managerId, "authenticated", async (tx) => {
    await tx`
      select public.save_event_registration_config(
        ${eventId},'open'::public.registration_mode,false,false,null,null,'{}'::jsonb,
        '[{"key":"meal","label":"Meal","type":"radio","required":true,"options":["standard","vegetarian"]}]'::jsonb
      )
    `;
  });
  await assert.rejects(submit(eventId), /required registration answer/i);
  const [event] =
    await client`select reserved_places from public.events where id=${eventId}`;
  assert.equal(event.reserved_places, 0);
});

test("private invitation answers persist against the pinned attendee and form version", {
  skip: !localTarget,
}, async () => {
  const { eventId } = await makeEvent({
    mode: "private_invitation",
    capacity: 2,
  });
  await withClaim(managerId, "authenticated", async (tx) => {
    await tx`
      select public.save_event_registration_config(
        ${eventId},'private_invitation'::public.registration_mode,false,false,null,null,'{}'::jsonb,
        '[{"key":"meal","label":"Meal","type":"radio","required":true,"options":["standard","vegetarian"]}]'::jsonb
      )
    `;
  });
  const [invitation] = await withClaim(
    managerId,
    "authenticated",
    (tx) =>
      tx`select * from public.create_private_invitation(${eventId},'Synthetic invite',0)`,
  );
  await withClaim(
    managerId,
    "anon",
    (tx) =>
      tx`
      select public.submit_public_rsvp_v2(
        ${invitation.guest_token},'private@example.test',
        '[{"name":"Private Guest","attendanceStatus":"attending"}]'::jsonb,
        '[{"slot":1,"answers":{"meal":"vegetarian"}}]'::jsonb
      )
    `,
  );
  const [answer] = await client`
    select a.answer, a.config_id, q.stable_key
    from public.private_registration_answers a
    join public.event_registration_questions q on q.id=a.question_id
    join public.attendees guest on guest.id=a.attendee_id
    where guest.invitation_id=${invitation.invitation_id}
  `;
  assert.equal(answer.stable_key, "meal");
  assert.equal(answer.answer, "vegetarian");
  assert.ok(answer.config_id);
});

if (!localTarget) {
  test("database integration suite skipped safely", { skip: false }, () => {
    assert.equal(client, undefined);
    console.log(
      "Skipped DB connection: set MOMENTUS_TEST_DATABASE=1 and use a loopback-only DATABASE_URL in .env after migrations are approved and applied locally.",
    );
  });
}
