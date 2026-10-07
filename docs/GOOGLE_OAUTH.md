# Google sign-in (OAuth) setup

The app already contains the Google provider. It is **only enabled when both `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are set**; otherwise the "Continue with Google" button is hidden. You need a Google
account to create the credentials (the app cannot create them for you).

## 1. Create a project
1. Open <https://console.cloud.google.com/> and sign in.
2. Top bar project picker -> **New project** -> name it (e.g. `artist-management`) -> **Create**, then select it.

## 2. OAuth consent screen
1. Menu -> **APIs & Services** -> **OAuth consent screen** (newer console: **Google Auth Platform** -> **Branding**).
2. User type **External** -> **Create**.
3. Fill in app name, user support email and developer contact email -> **Save and continue**.
4. Scopes: the defaults (`openid`, `email`, `profile`) are enough; no sensitive scopes are needed.
5. **Test users**: while the app is in *Testing* status only the Google accounts you list here can sign in. Add yours.
6. For public use, click **Publish app** (basic scopes do not require Google verification).

## 3. Create the Web client
1. **APIs & Services** -> **Credentials** -> **Create credentials** -> **OAuth client ID**.
2. Application type: **Web application**, name e.g. `artist-web`.
3. **Authorized JavaScript origins** (origin only: scheme + host + port, no path, no trailing slash)
   - local app (`npm run dev` / `npm start`): `http://localhost:3000`
   - Docker compose: `http://localhost:<APP_PORT>`, for example `http://localhost:29100` when `APP_PORT=29100`
   - production: `https://your-domain.com`
4. **Authorized redirect URIs** (must match exactly; format is `<origin>/api/auth/callback/google`)
   - local: `http://localhost:3000/api/auth/callback/google`
   - Docker on port 29100: `http://localhost:29100/api/auth/callback/google`
   - production: `https://your-domain.com/api/auth/callback/google`
5. **Create**, then copy the **Client ID** and **Client secret**.

Add one origin and one redirect URI per origin you really use. `localhost` and `127.0.0.1` are different origins: open the site with the same host you registered, and set `NEXTAUTH_URL` to that exact origin.

## 4. Configure the app

### Local (npm run dev / npm start)
Open the `.env` file in the project root (copy `.env.example` to `.env` if it does not exist; it is git-ignored and must never be committed) and fill the two empty values with the ones you copied:
```env
GOOGLE_CLIENT_ID="<paste the Client ID>"
GOOGLE_CLIENT_SECRET="<paste the Client secret>"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<any long random string, e.g. from: openssl rand -base64 32>"
```
Stop the dev server (Ctrl+C) and start it again (`npm run dev`). Environment files are read at start-up, so a restart is required. `/auth/login` now shows **Continue with Google**.

### Docker
Put the same two values in the compose `.env` (copy of `.env.docker.example`), keep `NEXTAUTH_URL` equal to the origin you open and `APP_PORT` equal to its port, then recreate the app container:
```env
APP_PORT=29100
NEXTAUTH_URL="http://localhost:29100"
GOOGLE_CLIENT_ID="<paste the Client ID>"
GOOGLE_CLIENT_SECRET="<paste the Client secret>"
```
```bash
docker compose up -d app
```
The button is shown only when both variables are non-empty in the running container (the login page reads them at request time, not at build time). Check with `curl http://localhost:29100/api/auth/providers`: the answer lists `google` when it is active.

Never commit the secret. No client id or secret ships with this repository; you must create your own in step 3.

## Behaviour
- **New Google user**: created through the Prisma adapter with role `USER` (the default). Google can never grant
  `ARTIST` or `ARTIST_MANAGER`; roles are changed only by an Artist Manager under *Users*.
- **Only verified Google emails** are accepted (`email_verified` must be true).
- **Same email as an existing account** (e.g. registered with a password): sign-in is refused with the message
  "An account with this email already exists...". Automatic linking (`allowDangerousEmailAccountLinking`) is
  intentionally **off**: public sign-up does not verify email ownership, so someone could pre-register a
  victim's address with a password they know and later share the account once the victim signs in with Google.
  If you add email verification to sign-up, linking can be reconsidered.
- **Role/id in the session**: `id` and `role` are read from the database into the JWT/session for Google users
  exactly as for password users.
- **Password login for Google-only accounts** is rejected (they have no password).
- **Logout** revokes the JWT server-side (`User.tokenVersion`) for both login types.

## Troubleshooting
- `redirect_uri_mismatch`: the redirect URI in the console differs from `NEXTAUTH_URL` + `/api/auth/callback/google`.
- `Error 403: access_denied`: app is in Testing and your account is not a test user.
- Button missing: one of the two env vars is empty/unset in the *running* process.
