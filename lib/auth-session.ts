export function jwtSurvivesSessionCutoff(input: {
  sessionsValidAfter: Date | null;
  issuedAtMs?: unknown;
  iat?: unknown;
}) {
  if (!input.sessionsValidAfter) return true;

  const explicit = Number(input.issuedAtMs);
  const fallbackSeconds = Number(input.iat);
  const issuedAt = Number.isFinite(explicit) && explicit > 0
    ? explicit
    : Number.isFinite(fallbackSeconds) && fallbackSeconds > 0
      ? fallbackSeconds * 1000
      : null;

  // Once a password reset has established a cutoff, a token with no reliable
  // issue time cannot prove that it was minted afterwards. Fail closed.
  return issuedAt !== null && issuedAt >= input.sessionsValidAfter.getTime();
}
