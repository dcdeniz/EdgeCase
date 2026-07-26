# Google Health OAuth callback contract

- Function: `google-health-callback`
- Hosted URL: `https://gxwahadomgbgpavihvsp.supabase.co/functions/v1/google-health-callback`
- Authentication: signed OAuth state, not Supabase JWT

`GET` accepts the Google-provided `code` and the state created by the authenticated Edge API connect operation. State carries an account UUID, random nonce and ten-minute expiry and is authenticated with HMAC-SHA256 using the server-only OAuth client secret.

The callback exchanges the code, reads `users/me/identity`, and writes provider tokens through the service role to `wearable_connections`. It returns only short text status and never returns or logs provider tokens. All other Google Health operations stay in the gateway-JWT-protected `api` function.

The Google Cloud authorized redirect URI and `GOOGLE_HEALTH_REDIRECT_URI` must match the hosted URL exactly.
