# ChatGPT plan session generation

Select **ChatGPT** in generation settings, then **Continue with ChatGPT**. The browser opens OpenAI authorization. Approve identity and ChatGPT plan usage, return to Seimas, choose an account-provided model, and generate a session. An eligible account and available plan allowance are required. Existing OpenAI API-key, xAI and Ollama modes remain available.

## Local installation

Run `npm install` followed by `npm run dev` (or `npm run build` and `npm run preview`) on the same computer as your browser. Open the app through `http://localhost:<vite-port>`. The callback listener binds an available port on `127.0.0.1` with the fixed path `/auth/callback`. The open-source registration starts with `dynamic_agent_client`; OpenAI returns the actual client ID. No preconfigured client ID or client secret is needed for this local flow.

This is a single-user local integration. It must not be used as a shared hosted account service. A static build alone cannot run authentication or generation. Public website sign-in needs OpenAI's separate approved partner client integration; this local callback cannot sign users into a remote server.

Tokens and the stable host ID stay in `.chatgpt/`, ignored by Git, with protected file permissions. Credentials are validated with OpenAI JWKS, issuer, audience, expiration and nonce. The callback consumes one-time state and PKCE. The browser receives a local HttpOnly session cookie and CSRF token, never OAuth credentials. Reauthorization must match the saved identity. Sign out removes local credentials; it does not revoke access in ChatGPT settings. Sign out before connecting another account.

Generation uses the public `/v1/responses` endpoint with `store: false`, `stream: true`, developer instructions and an input array. Unsupported preview parameters are not sent. The server consumes SSE and rejects failed, incomplete or interrupted requests, including plan-limit errors after partial output. Account-specific models come from `/v1/models`. Tokens are renewed server-side with refresh-token rotation.

Audio is separate: this provider uses local Speaches TTS settings. ChatGPT sign-in does not authorize the existing paid OpenAI speech API. Configure Speaches under the local provider settings before enabling speech, or leave speech disabled.

## Verification

Run `node --test server/chatgpt_auth.test.js` and `npm run build`. Live verification requires user authorization: test consent, denial, expired state, returning sign-in, sign out, model loading, a complete session, and exhausted plan allowance. Automated tests use synthetic streams and local request guards; they do not consume your ChatGPT allowance.

Official sources reviewed on 2026-09-29:
- https://developers.openai.com/siwc/quickstart
- https://developers.openai.com/siwc/token-sharing-open-source/sign-in
- https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference
- https://developers.openai.com/siwc/token-sharing-open-source/token-reference
- https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations
- https://developers.openai.com/siwc/website

## Lietuviškai

Paleiskite programą savo kompiuteryje ir atidarykite per `localhost`. Nustatymuose pasirinkite **ChatGPT**, spauskite **Continue with ChatGPT**, suteikite leidimą naudoti planą, grįžkite ir pasirinkite modelį. Viešam serveriui reikalinga atskira partnerio integracija. Balsams naudojamas vietinis Speaches. Prisijungimo duomenys saugomi tik vietiniame `.chatgpt/` aplanke; atsijungimas juos pašalina.
