import { useEffect, useState } from 'react';

export default function ChatGPTSignIn() {
    const [status, setStatus] = useState({});
    const [models, setModels] = useState([]);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    useEffect(() => {
        let disposed = false;
        let account;
        async function refresh() {
            try {
                const response = await fetch('/api/chatgpt/status');
                const value = await response.json();
                if (!response.ok) throw new Error(value.error);
                if (disposed) return;
                setStatus(value);
                if (value.canGenerate && account !== value.email) {
                    const catalog = await fetch('/api/chatgpt/models', { headers: { 'X-Seimas-CSRF': value.csrf } });
                    const data = await catalog.json();
                    if (!catalog.ok) throw new Error(data.error);
                    if (disposed) return;
                    setModels(data.models);
                    account = value.email;
                }
                if (!value.signedIn) { account = undefined; setModels([]); }
            } catch (failure) { if (!disposed) setError(failure.message); }
        }
        refresh();
        const timer = setInterval(refresh, 3000);
        return () => { disposed = true; clearInterval(timer); };
    }, []);
    async function action(name) {
        setBusy(true);
        setError('');
        const popup = name === 'signin' ? window.open('about:blank', '_blank') : null;
        if (popup) popup.opener = null;
        try {
            const response = await fetch(`/api/chatgpt/${name}`, { method: 'POST', headers: { 'X-Seimas-CSRF': status.csrf } });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            if (data.url) {
                if (popup) popup.location.href = data.url;
                else window.location.assign(data.url);
            }
            if (name === 'signout') { setStatus({ csrf: status.csrf }); setModels([]); }
        } catch (failure) { popup?.close(); setError(failure.message); }
        finally { setBusy(false); }
    }
    return <div className="config-panel hidden" id="chatgptConfigPanel">
        <div className="panel-title">ChatGPT planas / ChatGPT plan</div>
        <div className="provider-guidance">
            <span>Prisijunkite šiame kompiuteryje. Posėdžio generavimas naudoja jūsų ChatGPT plano limitus.</span>
            <span lang="en">Run Seimas locally on this computer. Generation uses your ChatGPT plan allowance; availability depends on your account.</span>
            <span>Įgarsinimui naudojamas atskiras Speaches serveris. / Speech uses your separate local Speaches server.</span>
        </div>
        <button type="button" disabled={busy || !status.csrf} onClick={() => action('signin')}>Continue with ChatGPT</button>
        {status.signedIn && <button type="button" disabled={busy} onClick={() => action('signout')}>Atsijungti / Sign out</button>}
        <p role="status">{status.signedIn ? status.email || 'Prisijungta / Signed in' : 'Neprisijungta / Signed out'}{status.pending ? ' — Laukiama / Awaiting sign-in' : ''}</p>
        {status.signedIn && !status.canGenerate && <p role="alert">Suteikite leidimą naudoti ChatGPT planą. / Sign in again and authorize ChatGPT plan usage.</p>}
        {(error || status.error) && <p role="alert">{error || status.error}</p>}
        <div className="form-field">
            <label htmlFor="chatgptModelSelect">Stenogramos modelis / Transcript model</label>
            <select id="chatgptModelSelect" disabled={!models.length} key={models.map(model => model.slug).join(',')}>
                {!models.length && <option value="">Prisijunkite / Sign in to load models</option>}
                {models.map(model => <option key={model.slug} value={model.slug}>{model.display_name}</option>)}
            </select>
        </div>
    </div>;
}
