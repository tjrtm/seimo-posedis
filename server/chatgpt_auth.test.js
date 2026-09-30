import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeResponseStream, isLocalRequest } from './chatgpt_auth.js';

async function* stream(events) {
    const text = events.map(event => `data: ${JSON.stringify(event)}\r\n\r\n`).join('');
    const bytes = Buffer.from(text);
    for (let index = 0; index < bytes.length; index += 7) yield bytes.subarray(index, index + 7);
}
test('accepts complete fragmented UTF-8 SSE output', async () => {
    assert.equal(await consumeResponseStream(stream([
        { type: 'response.output_text.delta', delta: 'Posėdis 🏛️' },
        { type: 'response.completed' }
    ])), 'Posėdis 🏛️');
});
test('rejects interrupted and incomplete generations', async () => {
    await assert.rejects(consumeResponseStream(stream([{ type: 'response.output_text.delta', delta: 'partial' }])));
    await assert.rejects(consumeResponseStream(stream([{ type: 'response.incomplete' }])));
});
test('rejects a usage-limit failure after partial output', async () => {
    await assert.rejects(consumeResponseStream(stream([
        { type: 'response.output_text.delta', delta: 'partial' },
        { type: 'response.failed', response: { error: { code: 'subscription_sharing_usage_limit_exceeded' } } }
    ])), /subscription_sharing_usage_limit_exceeded/);
});
test('local API rejects remote hosts, remote peers and cross-origin requests', () => {
    const request = { headers: { host: 'localhost:5173', origin: 'http://localhost:5173' }, socket: { remoteAddress: '127.0.0.1' } };
    assert.equal(isLocalRequest(request), true);
    assert.equal(isLocalRequest({ ...request, headers: { host: 'attacker.example:5173' } }), false);
    assert.equal(isLocalRequest({ ...request, headers: { ...request.headers, origin: 'https://attacker.example' } }), false);
    assert.equal(isLocalRequest({ ...request, socket: { remoteAddress: '192.168.0.4' } }), false);
});
