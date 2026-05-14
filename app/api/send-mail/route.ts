import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { isLooseEmail, splitAddressList } from "@/lib/mail-addresses";
import type { MailrEnvelope, MailrSmtpConfig } from "@/lib/projects-storage";

export const runtime = "nodejs";

type SendMailBody = {
  smtp?: MailrSmtpConfig;
  envelope?: MailrEnvelope;
  html?: string;
  projectName?: string;
};

function bad(message: string, status = 400) {
  return NextResponse.json({ ok: false as const, error: message }, { status });
}

export async function POST(req: Request) {
  let body: SendMailBody;
  try {
    body = (await req.json()) as SendMailBody;
  } catch {
    return bad("Invalid JSON body");
  }

  const smtp = body.smtp;
  const envelope = body.envelope;
  const html = typeof body.html === "string" ? body.html : "";

  if (!smtp || typeof smtp !== "object") {
    return bad("Missing smtp");
  }
  if (!envelope || typeof envelope !== "object") {
    return bad("Missing envelope");
  }

  const host = typeof smtp.host === "string" ? smtp.host.trim() : "";
  if (!host) {
    return bad("SMTP host is required");
  }

  const port = Number(smtp.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return bad("SMTP port must be 1-65535");
  }

  const username =
    typeof smtp.username === "string" ? smtp.username.trim() : "";
  if (!username || !isLooseEmail(username)) {
    return bad(
      "SMTP username must be a valid email address",
    );
  }
  const fromEmail = username;

  const toList = splitAddressList(envelope.to);
  if (toList.length === 0) {
    return bad("At least one To address is required");
  }
  for (const a of toList) {
    if (!isLooseEmail(a)) {
      return bad(`Invalid To address: ${a}`);
    }
  }

  const ccRaw = splitAddressList(envelope.cc);
  for (const a of ccRaw) {
    if (!isLooseEmail(a)) {
      return bad(`Invalid Cc address: ${a}`);
    }
  }

  const bccRaw = splitAddressList(envelope.bcc);
  for (const a of bccRaw) {
    if (!isLooseEmail(a)) {
      return bad(`Invalid Bcc address: ${a}`);
    }
  }

  const replyTo = envelope.replyTo.trim();
  if (replyTo && !isLooseEmail(replyTo)) {
    return bad("Reply-To must be a valid email when set");
  }

  const subject =
    envelope.subject.trim() ||
    (typeof body.projectName === "string" ? body.projectName.trim() : "") ||
    "No subject";

  const password = typeof smtp.password === "string" ? smtp.password : "";

  const fromName = envelope.fromName.trim();

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: Boolean(smtp.secure),
    auth:
      username || password ? { user: username, pass: password } : undefined,
  });

  try {
    await transporter.sendMail({
      from: fromName
        ? { name: fromName, address: fromEmail }
        : fromEmail,
      to: toList,
      cc: ccRaw.length > 0 ? ccRaw : undefined,
      bcc: bccRaw.length > 0 ? bccRaw : undefined,
      replyTo: replyTo || undefined,
      subject,
      html: html.length > 0 ? html : "<p></p>",
    });
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : "Failed to send email via SMTP";
    return NextResponse.json(
      { ok: false as const, error: msg },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true as const });
}