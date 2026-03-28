import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const rpName = process.env.WEBAUTHN_RP_NAME || "Vectorial Data Analytics";
const rpID = process.env.WEBAUTHN_RP_ID || "localhost";
const origin = process.env.WEBAUTHN_ORIGIN || "http://localhost:3000";

export async function createRegistrationOptions(
  adminId: string,
  username: string
) {
  const supabase = getSupabaseAdmin();

  const { data: existingKeys } = await supabase
    .from("marketing_passkeys")
    .select("id, transports")
    .eq("admin_id", adminId);

  const excludeCredentials = (existingKeys ?? []).map((key) => ({
    id: key.id,
    transports: key.transports ?? undefined,
  }));

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform",
    },
  });

  await supabase.from("marketing_challenges").insert({
    challenge: options.challenge,
    admin_id: adminId,
    type: "registration",
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });

  return options;
}

export async function verifyRegistration(
  adminId: string,
  response: RegistrationResponseJSON
) {
  const supabase = getSupabaseAdmin();

  const { data: challengeRow } = await supabase
    .from("marketing_challenges")
    .select("*")
    .eq("admin_id", adminId)
    .eq("type", "registration")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) throw new Error("Challenge expired or not found");

  await supabase
    .from("marketing_challenges")
    .delete()
    .eq("id", challengeRow.id);

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error("Registration verification failed");
  }

  const { credential, credentialDeviceType, credentialBackedUp } =
    verification.registrationInfo;

  await supabase.from("marketing_passkeys").insert({
    id: credential.id,
    admin_id: adminId,
    public_key: Buffer.from(credential.publicKey).toString("base64"),
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.transports ?? null,
  });

  return verification;
}

export async function createAuthenticationOptions() {
  const supabase = getSupabaseAdmin();

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  });

  await supabase.from("marketing_challenges").insert({
    challenge: options.challenge,
    admin_id: null,
    type: "authentication",
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });

  return options;
}

export async function verifyAuthentication(
  response: AuthenticationResponseJSON
) {
  const supabase = getSupabaseAdmin();

  const { data: passkey } = await supabase
    .from("marketing_passkeys")
    .select("*, marketing_admins!inner(id, username, display_name)")
    .eq("id", response.id)
    .single();

  if (!passkey) throw new Error("Passkey not found");

  const { data: challengeRow } = await supabase
    .from("marketing_challenges")
    .select("*")
    .eq("type", "authentication")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) throw new Error("Challenge expired or not found");

  await supabase
    .from("marketing_challenges")
    .delete()
    .eq("id", challengeRow.id);

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: challengeRow.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    credential: {
      id: passkey.id,
      publicKey: Buffer.from(passkey.public_key, "base64"),
      counter: passkey.counter,
      transports: passkey.transports ?? undefined,
    },
  });

  if (!verification.verified) throw new Error("Authentication failed");

  await supabase
    .from("marketing_passkeys")
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", passkey.id);

  const admin = passkey.marketing_admins as unknown as {
    id: string;
    username: string;
    display_name: string | null;
  };

  return { verified: true, admin };
}
