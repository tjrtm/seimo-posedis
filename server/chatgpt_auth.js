import { createServer } from 'node:http';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const issuer = 'https://auth.openai.com';
const resource = 'https://api.openai.com/v1';
const scopes = 'openid profile email offline_access resource.invoke chatgpt.tokens.use.direct';
const random = () => randomBytes(32).toString('base64url');
const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

export async function validateIdentity(token, clientId, nonce) {
    const { payload } = await jwtVerify(token, jwks, {
        issuer, audience: clientId, requiredClaims: ['sub', 'exp', 'iat'], algorithms: ['RS256'], clockTolerance: 5
    });
    if (!payload.sub || (nonce && payload.nonce !== nonce)) throw new Error('Invalid OpenAI identity.');
    return payload;
}

export async function consumeResponseStream(body) {
    let buffer = '';
    let output = '';
    let completed = false;
    const decoder = new TextDecoder();
    function event(block) {
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (!data || data === '[DONE]') return;
        const item = JSON.parse(data);
        if (item.type === 'response.output_text.delta') output += item.delta;
        if (item.type === 'response.completed') completed = true;
        if (['error', 'response.failed', 'response.incomplete'].includes(item.type)) {
            throw new Error(item.response?.error?.code || item.error?.code || item.code || item.type);
        }
    }
    for await (const chunk of body) {
        buffer += decoder.decode(chunk, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            event(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
        }
    }
    buffer += decoder.decode();
    if (buffer.trim()) event(buffer);
    if (!completed || !output) throw new Error('Response stream ended without completed text.');
    return output;
}

export function isLocalRequest(req) {
    const host = req.headers.host;
    const address = req.socket.remoteAddress;
    return /^(localhost|127\.0\.0\.1):\d+$/.test(host || '') &&
        ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address) &&
        (!req.headers.origin || req.headers.origin === `http://${host}`) &&
        !['cross-site'].includes(req.headers['sec-fetch-site']);
}

export function chatgptPlugin() {
    const directory = path.resolve('.chatgpt');
    const credentialFile = path.join(directory, 'credentials.json');
    let credentials;
    let hostId;
    let listener;
    let pending;
    let lastError;
    let refreshPromise;
    let epoch = 0;
    const browserSessions = new Map();

    async function initialize() {
        await fs.mkdir(directory, { recursive: true, mode: 0o700 });
        const hostFile = path.join(directory, 'host.json');
        try { hostId = JSON.parse(await fs.readFile(hostFile, 'utf8')).id; }
        catch (error) {
            if (error.code !== 'ENOENT') throw error;
            hostId = `urn:uuid:${randomUUID()}`;
            await fs.writeFile(hostFile, JSON.stringify({ id: hostId }), { mode: 0o600 });
        }
        try { credentials = JSON.parse(await fs.readFile(credentialFile, 'utf8')); }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
    const ready = initialize();
    async function persist(value) {
        const temporary = `${credentialFile}.tmp`;
        await fs.writeFile(temporary, JSON.stringify(value), { mode: 0o600 });
        await fs.rename(temporary, credentialFile);
        credentials = value;
    }
    async function tokenRequest(parameters) {
        const response = await fetch(`${issuer}/api/accounts/oauth/token`, {
            method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ resource, ...parameters }), signal: AbortSignal.timeout(30000)
        });
        if (!response.ok) throw new Error(`OpenAI token exchange failed (${response.status}). Sign in again.`);
        return response.json();
    }
    async function accessToken() {
        if (!credentials?.scopes?.includes('chatgpt.tokens.use.direct') || !credentials.scopes.includes('resource.invoke')) {
            throw new Error('Sign in and authorize ChatGPT plan usage first.');
        }
        if (credentials.expiresAt > Date.now() + 60000) return credentials.access_token;
        if (!refreshPromise) {
            const saved = credentials;
            const version = epoch;
            refreshPromise = (async () => {
                const tokens = await tokenRequest({ grant_type: 'refresh_token', client_id: saved.client_id, refresh_token: saved.refresh_token });
                if (!tokens.access_token || !tokens.refresh_token) throw new Error('Invalid refresh response. Sign in again.');
                if (tokens.id_token) {
                    const identity = await validateIdentity(tokens.id_token, saved.client_id);
                    if (identity.sub !== saved.subject) throw new Error('Account identity changed.');
                }
                if (version !== epoch) throw new Error('Account signed out.');
                await persist({ ...saved, ...tokens, scopes: tokens.scope ? tokens.scope.split(' ') : saved.scopes,
                    expiresAt: Date.now() + tokens.expires_in * 1000 });
                return credentials.access_token;
            })().finally(() => { refreshPromise = null; });
        }
        return refreshPromise;
    }
    async function openCallback() {
        if (listener) return listener.address().port;
        listener = createServer(async (req, res) => {
            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Referrer-Policy', 'no-referrer');
            const url = new URL(req.url, 'http://127.0.0.1');
            const attempt = pending;
            if (url.pathname !== '/auth/callback' || !attempt || attempt.expiresAt < Date.now() || url.searchParams.get('state') !== attempt.state) {
                res.statusCode = 400;
                res.end('Invalid or expired sign-in attempt.');
                return;
            }
            pending = null; // consume once, including denial
            try {
                if (url.searchParams.has('error')) throw new Error('ChatGPT sign-in was declined.');
                const clientId = url.searchParams.get('client_id') || attempt.clientId;
                if (!clientId || clientId === 'dynamic_agent_client' ||
                    (attempt.clientId !== 'dynamic_agent_client' && clientId !== attempt.clientId)) throw new Error('Invalid issued client ID.');
                const code = url.searchParams.get('code');
                if (!code) throw new Error('Missing authorization code.');
                const tokens = await tokenRequest({ grant_type: 'authorization_code', client_id: clientId,
                    code, code_verifier: attempt.verifier, redirect_uri: attempt.redirectUri });
                const identity = await validateIdentity(tokens.id_token, clientId, attempt.nonce);
                if (attempt.subject && identity.sub !== attempt.subject) throw new Error('The returning ChatGPT account does not match. Sign out first.');
                if (!tokens.access_token || !Number.isFinite(tokens.expires_in)) throw new Error('Missing inference credentials.');
                if (attempt.epoch !== epoch) throw new Error('Sign-in cancelled.');
                await persist({ ...tokens, client_id: clientId, subject: identity.sub, email: identity.email,
                    scopes: (tokens.scope || '').split(' '), expiresAt: Date.now() + tokens.expires_in * 1000 });
                lastError = null;
                res.end('Prisijungta / Signed in. Return to Seimas and close this tab.');
            } catch (error) {
                lastError = error.message;
                res.statusCode = 400;
                res.end(lastError);
            }
        });
        await new Promise((resolve, reject) => {
            listener.once('error', reject);
            listener.listen(0, '127.0.0.1', resolve);
        });
        return listener.address().port;
    }
    function json(res, value, status = 200) {
        res.statusCode = status;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(value));
    }
    async function middleware(req, res, next) {
        const route = req.url?.split('?')[0];
        if (!route?.startsWith('/api/chatgpt/')) return next();
        if (!isLocalRequest(req)) return json(res, { error: 'ChatGPT plan sign-in is only available on this computer via localhost.' }, 403);
        try {
            await ready;
            for (const [key, value] of browserSessions) if (value.expiresAt < Date.now()) browserSessions.delete(key);
            const cookie = req.headers.cookie?.match(/(?:^|;\s*)seimas_chatgpt=([^;]+)/)?.[1];
            let session = browserSessions.get(cookie);
            if (route === '/api/chatgpt/status' && req.method === 'GET') {
                if (!session) {
                    const id = random();
                    session = { csrf: random(), expiresAt: Date.now() + 8 * 3600000 };
                    browserSessions.set(id, session);
                    res.setHeader('Set-Cookie', `seimas_chatgpt=${id}; HttpOnly; SameSite=Strict; Path=/api/chatgpt; Max-Age=28800`);
                }
                return json(res, { signedIn: !!credentials, email: credentials?.email,
                    canGenerate: !!credentials?.scopes?.includes('chatgpt.tokens.use.direct'), csrf: session.csrf,
                    pending: !!pending && pending.expiresAt > Date.now(), error: lastError });
            }
            if (!session || req.headers['x-seimas-csrf'] !== session.csrf) return json(res, { error: 'Reload Seimas to establish a local session.' }, 403);
            if (route === '/api/chatgpt/signin' && req.method === 'POST') {
                const port = await openCallback();
                const redirectUri = `http://127.0.0.1:${port}/auth/callback`;
                const verifier = random();
                pending = { state: random(), nonce: random(), verifier, redirectUri,
                    clientId: credentials?.client_id || 'dynamic_agent_client', subject: credentials?.subject,
                    expiresAt: Date.now() + 10 * 60000, epoch };
                const params = { client_id: pending.clientId, ext_agent_host_id: hostId, response_type: 'code',
                    redirect_uri: redirectUri, scope: scopes, resource, state: pending.state, nonce: pending.nonce,
                    code_challenge_method: 'S256', code_challenge: createHash('sha256').update(verifier).digest('base64url') };
                if (credentials?.id_token) params.id_token_hint = credentials.id_token;
                if (pending.clientId === 'dynamic_agent_client') params.agent_name_hint = 'Seimas Session Generator';
                lastError = null;
                return json(res, { url: `${issuer}/api/accounts/authorize?${new URLSearchParams(params)}` });
            }
            if (route === '/api/chatgpt/signout' && req.method === 'POST') {
                epoch++;
                pending = null;
                credentials = null;
                lastError = null;
                await fs.rm(credentialFile, { force: true });
                return json(res, { signedIn: false });
            }
            if (route === '/api/chatgpt/models' && req.method === 'GET') {
                const response = await fetch(`${resource}/models`, { headers: { Authorization: `Bearer ${await accessToken()}` }, signal: AbortSignal.timeout(30000) });
                if (!response.ok) throw new Error(`ChatGPT models request failed (${response.status}).`);
                const data = await response.json();
                return json(res, { models: (data.models || []).filter(model => model.visibility === 'list').map(model => ({ slug: model.slug, display_name: model.display_name })) });
            }
            if (route === '/api/chatgpt/generate' && req.method === 'POST') {
                let body = '';
                for await (const chunk of req) {
                    body += chunk;
                    if (Buffer.byteLength(body) > 2000000) throw new Error('Request too large.');
                }
                const { model, prompt, instructions } = JSON.parse(body);
                if (![model, prompt, instructions].every(value => typeof value === 'string' && value.length)) throw new Error('Missing generation parameters.');
                const response = await fetch(`${resource}/responses`, { method: 'POST',
                    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, instructions, input: [{ role: 'user', content: prompt }], store: false, stream: true }),
                    signal: AbortSignal.timeout(15 * 60000) });
                if (!response.ok) throw new Error(`ChatGPT generation failed (${response.status}). Check plan access and limits.`);
                return json(res, { text: await consumeResponseStream(response.body) });
            }
            return json(res, { error: 'Unsupported ChatGPT route or method.' }, 405);
        } catch (error) { return json(res, { error: error.message }, 400); }
    }
    const configure = server => {
        server.middlewares.use(middleware);
        server.httpServer?.once('close', () => listener?.close());
    };
    return { name: 'seimas-chatgpt-auth', configureServer: configure, configurePreviewServer: configure };
}
