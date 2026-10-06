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
3. **Authorized JavaScript origins**
   - `http://localhost:3000`
   - production: `https://your-domain.com`
4. **Authorized redirect URIs** (must match exactly, no trailing slash)
   - `http://localhost:3000/api/auth/callback/google`
   - production: `https://your-domain.com/api/auth/callback/google`
5. **Create**, then copy the **Client ID** and **Client secret**.

If you run on another port (e.g. 3101), add that origin and redirect URI too.

## 4. Configure the app
```env
GOOGLE_CLIENT_ID="1234567890-abc.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."
NEXTAUTH_URL="http://localhost:3000"      # production: https://your-domain.com
NEXTAUTH_SECRET="<openssl rand -base64 32>"
```
Restart the server. `/auth/login` now shows **Continue with Google**. (For Docker, put the same variables in the
compose `.env`.) Never commit the secret.

## Behaviour
- **New Google user**: created through the Prisma adapter with role `USER` (the default). Google can never grant
  `ARTIST_MANAGER` or `ADMIN`; roles are changed only by an ADMIN under *Users*.
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
