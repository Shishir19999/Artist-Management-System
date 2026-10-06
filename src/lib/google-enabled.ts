/** Google sign-in is available only when both OAuth env vars are set. */
export function isGoogleEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
    return Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
}
