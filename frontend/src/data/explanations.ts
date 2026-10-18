/**
 * explanations.ts
 *
 * Educational copy for each vulnerability scenario.
 * Shaped for a future <ExplanationCard> component with three prose fields:
 *   rootCause — what makes the code vulnerable
 *   impact     — what an attacker can achieve
 *   fix        — the correct mitigation
 *
 * Each field is 2-3 sentences, written at a developer-literacy level.
 */

export type ScenarioKey = "sqli" | "xss" | "bola";

export interface Explanation {
  /** What property of the code creates the vulnerability */
  rootCause: string;
  /** Real-world consequences of exploitation */
  impact: string;
  /** The correct, safe implementation pattern */
  fix: string;
}

export const explanations: Record<ScenarioKey, Explanation> = {
  sqli: {
    rootCause:
      "The vulnerable endpoint builds its SQL query by concatenating user-supplied " +
      "strings directly into the SQL text using an f-string. Because the database " +
      "engine receives a single pre-built string, it cannot distinguish between the " +
      "intended query structure and data injected by the caller.",

    impact:
      "An attacker can append SQL syntax — such as a comment sequence (`--`) or an " +
      "always-true condition (`OR '1'='1`) — to bypass authentication entirely and " +
      "log in as any user without knowing their password. With a UNION-based payload " +
      "they can additionally extract the full contents of other tables, including " +
      "password hashes.",

    fix:
      "Use parameterized queries (also called prepared statements) with `?` placeholders. " +
      "The database driver sends the query structure and the user data as separate " +
      "protocol messages, so injected SQL characters are always treated as literal " +
      "data values and never as query syntax. Additionally, passwords should be " +
      "compared as hashed digests, never as plaintext.",
  },

  xss: {
    rootCause:
      "The vulnerable endpoint stores and returns the comment body exactly as submitted, " +
      "with no HTML encoding. When a browser renders the response inside an HTML " +
      "document it interprets angle brackets as markup, so any injected `<script>` " +
      "tag or event-handler attribute is treated as executable code rather than text.",

    impact:
      "An attacker who can store a malicious comment can cause arbitrary JavaScript to " +
      "execute in the browser of every user who views it — a stored (persistent) XSS " +
      "attack. Consequences include session-cookie theft, credential harvesting, " +
      "keylogging, and full account takeover without any interaction from the victim " +
      "beyond visiting the page.",

    fix:
      "Apply HTML-entity encoding (`html.escape()` in Python, `textContent` assignment " +
      "in JavaScript) to all user-supplied strings before inserting them into an HTML " +
      "context. Encoding converts `<` to `&lt;`, `>` to `&gt;`, `\"` to `&quot;`, " +
      "and `'` to `&#x27;`, so the browser renders them as visible characters rather " +
      "than executable markup. A Content-Security-Policy header provides an additional " +
      "defence-in-depth layer.",
  },

  bola: {
    rootCause:
      "The vulnerable endpoint fetches an invoice using only the `id` query parameter " +
      "and ignores the `as_user` field entirely — it never checks whether the " +
      "requesting user is actually the owner of the requested object. Any caller who " +
      "knows (or can enumerate) an invoice ID can retrieve it regardless of who it " +
      "belongs to.",

    impact:
      "Any authenticated user can read — or in a write-enabled variant, modify or " +
      "delete — records belonging to other users simply by incrementing or guessing " +
      "object IDs. BOLA (also known as IDOR — Insecure Direct Object Reference) is " +
      "consistently ranked as the most common and most impactful API vulnerability " +
      "class because the IDs are often sequential integers that are trivial to " +
      "enumerate.",

    fix:
      "Enforce object ownership server-side on every lookup: the query must require " +
      "that `owner_id` matches the authenticated user's ID, ideally in a single " +
      "atomic SQL JOIN so there is no time-of-check / time-of-use window. The " +
      "as_user parameter or session token should never be trusted to perform its own " +
      "access control — the database or application layer must always verify it " +
      "independently.",
  },
};

export default explanations;
