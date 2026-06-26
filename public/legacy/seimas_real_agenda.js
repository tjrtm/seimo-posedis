/**
 * SeimasRealAgenda — opt-in importer for the *real* Seimas plenary agenda.
 *
 * Pulls live data from the Seimas open-data API (apps.lrs.lt/sip/p2b.*), which
 * returns clean, structured XML under a CC BY 4.0 licence. The chain is:
 *
 *     kadencija (term) → sesija (session) → posėdis (sitting) → darbotvarkės klausimas (agenda item)
 *
 * Design intent (issue #9, "Option B"):
 *   - This is an OPT-IN source, never the default. The app's purpose is to
 *     simulate ANY user-chosen topic; real agenda items are merely offered as
 *     selectable starting points. Picking an item just fills the topic textarea
 *     — the user stays in full control and can edit it before generating.
 *   - Import is deterministic XML parsing (no AI in the loop, so no
 *     hallucination surface), with attribution and a stale-cache fallback so a
 *     flaky/offline source degrades gracefully instead of breaking the app.
 *
 * Dependency-free, browser-only. The API sends `Access-Control-Allow-Origin: *`,
 * so it is fetched directly from the client — no backend/proxy required.
 */
(function () {
    'use strict';

    const BASE = 'https://apps.lrs.lt/sip/';
    const CACHE_PREFIX = 'seimasRealAgenda:';
    const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h — fresh enough; refresh button forces a reload
    const ATTRIBUTION = 'Šaltinis: Seimo kanceliarija (www.lrs.lt) · CC BY 4.0';

    // ---- Low-level fetch + cache ---------------------------------------

    function cacheKey(endpoint) { return CACHE_PREFIX + endpoint; }

    function readCache(endpoint) {
        try {
            const raw = localStorage.getItem(cacheKey(endpoint));
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed.xml !== 'string') return null;
            return parsed; // { ts, xml }
        } catch (_) { return null; }
    }

    function writeCache(endpoint, xml) {
        // ts is supplied by the caller (Date is awkward to ban here); we use the
        // Last-Modified-ish "now" only to age the cache. Storage failures are non-fatal.
        try {
            localStorage.setItem(cacheKey(endpoint), JSON.stringify({ ts: Date.now(), xml }));
        } catch (_) { /* quota / private mode — caching is best-effort */ }
    }

    /**
     * Fetch an endpoint and return parsed XML, using the cache when allowed.
     * On network/parse failure, falls back to any cached copy (even if stale)
     * and flags it so the UI can warn the user. Returns { doc, stale, fromCache }.
     */
    async function fetchXml(endpoint, { force = false } = {}) {
        const cached = readCache(endpoint);
        const fresh = cached && (Date.now() - cached.ts) < CACHE_TTL_MS;
        if (!force && fresh) {
            return { doc: parse(cached.xml), stale: false, fromCache: true };
        }
        try {
            const res = await fetch(BASE + endpoint, { headers: { Accept: 'application/xml' } });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const xml = await res.text();
            const doc = parse(xml);
            if (doc.querySelector('parsererror')) throw new Error('XML parse error');
            writeCache(endpoint, xml);
            return { doc, stale: false, fromCache: false };
        } catch (err) {
            if (cached) return { doc: parse(cached.xml), stale: true, fromCache: true, error: err };
            throw err;
        }
    }

    function parse(xml) {
        return new DOMParser().parseFromString(xml, 'application/xml');
    }

    function attr(node, name) { return node.getAttribute(name) || ''; }

    // ---- Domain queries -------------------------------------------------

    /** All terms, newest first; `current` flags the in-progress one (empty data_iki). */
    async function getTerms(opts) {
        const { doc, stale } = await fetchXml('p2b.ad_seimo_kadencijos', opts);
        const terms = Array.from(doc.querySelectorAll('SeimoKadencija')).map(n => ({
            id: attr(n, 'kadencijos_id'),
            name: attr(n, 'pavadinimas'),
            from: attr(n, 'data_nuo'),
            to: attr(n, 'data_iki'),
            current: !attr(n, 'data_iki'),
        }));
        terms.sort((a, b) => Number(b.id) - Number(a.id));
        return { terms, stale };
    }

    /** Sessions of a term, newest first; `current` flags the in-progress one. */
    async function getSessions(kadencijosId, opts) {
        const { doc, stale } = await fetchXml('p2b.ad_seimo_sesijos?kadencijos_id=' + encodeURIComponent(kadencijosId), opts);
        const sessions = Array.from(doc.querySelectorAll('SeimoSesija')).map(n => ({
            id: attr(n, 'sesijos_id'),
            number: attr(n, 'numeris'),
            name: attr(n, 'pavadinimas'),
            from: attr(n, 'data_nuo'),
            to: attr(n, 'data_iki'),
            current: !attr(n, 'data_iki'),
        }));
        sessions.sort((a, b) => (b.from || '').localeCompare(a.from || ''));
        return { sessions, stale };
    }

    /** Sittings of a session, newest first. */
    async function getSittings(sesijosId, opts) {
        const { doc, stale } = await fetchXml('p2b.ad_seimo_posedziai?sesijos_id=' + encodeURIComponent(sesijosId), opts);
        const sittings = Array.from(doc.querySelectorAll('SeimoPosėdis')).map(n => ({
            id: attr(n, 'posėdžio_id'),
            number: attr(n, 'numeris'),
            type: attr(n, 'tipas'),
            start: attr(n, 'pradžia'),
            end: attr(n, 'pabaiga'),
        }));
        sittings.sort((a, b) => (b.start || '').localeCompare(a.start || ''));
        return { sittings, stale };
    }

    /** Agenda items of a sitting, in order. */
    async function getAgenda(posedzioId, opts) {
        const { doc, stale } = await fetchXml('p2b.ad_sp_darbotvarke?posedzio_id=' + encodeURIComponent(posedzioId), opts);
        const items = Array.from(doc.querySelectorAll('DarbotvarkėsKlausimas')).map(n => {
            const stage = n.querySelector('KlausimoStadija');
            return {
                number: attr(n, 'numeris').trim(),
                title: attr(n, 'pavadinimas').trim(),
                timeFrom: attr(n, 'laikas_nuo'),
                timeTo: attr(n, 'laikas_iki'),
                stage: stage ? attr(stage, 'pavadinimas') : '',
                documentUrl: stage ? attr(stage, 'dokumento_nuoroda') : '',
                speakers: Array.from(n.querySelectorAll('KlausimoPranešėjas'))
                    .map(s => ({ name: attr(s, 'asmuo').trim(), role: attr(s, 'pareigos').trim() }))
                    .filter(s => s.name),
            };
        }).filter(it => it.title);
        return { items, stale };
    }

    /**
     * Turn a real agenda item into a clean topic string for the simulator.
     * We keep the legislative question itself; the user can edit it afterwards.
     */
    function itemToTopic(item) {
        return item.title;
    }

    const api = { getTerms, getSessions, getSittings, getAgenda, itemToTopic, ATTRIBUTION, _fetchXml: fetchXml };

    // ---- UI controller --------------------------------------------------
    // Self-contained: wires the optional DOM block if it is present. Absence of
    // the block is fine (e.g. tests) — the data API above still works standalone.

    let uiWired = false;
    function initUI() {
        const root = document.getElementById('realAgendaPanel');
        if (!root || uiWired) return;
        uiWired = true;

        const sessionSelect = document.getElementById('realAgendaSessionSelect');
        const sittingSelect = document.getElementById('realAgendaSittingSelect');
        const list = document.getElementById('realAgendaList');
        const status = document.getElementById('realAgendaStatus');
        const refreshBtn = document.getElementById('realAgendaRefreshBtn');
        const questionInput = document.getElementById('questionInput');

        let loadedOnce = false;
        // Monotonic token: each load bumps it; a load whose token is no longer
        // current was superseded by a newer selection and must not touch the DOM.
        // Guards against out-of-order responses when the user switches quickly.
        let loadSeq = 0;

        function setStatus(msg, kind) {
            if (!status) return;
            status.textContent = msg || '';
            status.dataset.kind = kind || '';
        }

        function option(value, label) {
            const o = document.createElement('option');
            o.value = value; o.textContent = label;
            return o;
        }

        const STALE_MSG = 'Rodomi išsaugoti duomenys (nepavyko atnaujinti).';

        async function loadSessions(opts) {
            const my = ++loadSeq;
            setStatus('Kraunamos sesijos…');
            try {
                const { terms, stale: termsStale } = await getTerms(opts);
                const term = terms.find(t => t.current) || terms[0];
                if (!term) { if (my === loadSeq) setStatus('Kadencijų nerasta.', 'warn'); return; }
                const { sessions, stale: sessStale } = await getSessions(term.id, opts);
                if (my !== loadSeq) return; // superseded by a newer load
                if (!sessions.length) { setStatus('Sesijų nerasta.', 'warn'); return; }
                sessionSelect.innerHTML = '';
                sessions.forEach(s => sessionSelect.appendChild(
                    option(s.id, `${s.name} sesija (${s.from || '?'}${s.to ? ' – ' + s.to : ' – …'})`)));
                sessionSelect.value = (sessions.find(s => s.current) || sessions[0]).id;
                await loadSittings(opts, termsStale || sessStale);
            } catch (err) {
                if (my === loadSeq) setStatus('Nepavyko pasiekti Seimo atvirų duomenų. Bandykite vėliau.', 'error');
            }
        }

        // staleSoFar carries any upstream stale-cache fallback forward so the
        // final status reflects a partial outage instead of silently overwriting it.
        async function loadSittings(opts, staleSoFar = false) {
            const my = ++loadSeq;
            setStatus('Kraunami posėdžiai…');
            try {
                const { sittings, stale } = await getSittings(sessionSelect.value, opts);
                if (my !== loadSeq) return; // superseded
                if (!sittings.length) { sittingSelect.innerHTML = ''; list.innerHTML = ''; setStatus('Posėdžių nerasta.', 'warn'); return; }
                sittingSelect.innerHTML = '';
                sittings.forEach(p => sittingSelect.appendChild(
                    option(p.id, `Nr. ${p.number} · ${p.type} · ${p.start || ''}`)));
                sittingSelect.value = sittings[0].id;
                await loadAgenda(opts, staleSoFar || stale);
            } catch (err) {
                if (my === loadSeq) setStatus('Nepavyko įkelti posėdžių.', 'error');
            }
        }

        async function loadAgenda(opts, staleSoFar = false) {
            const my = ++loadSeq;
            setStatus('Kraunama darbotvarkė…');
            try {
                const { items, stale } = await getAgenda(sittingSelect.value, opts);
                if (my !== loadSeq) return; // superseded — keep the current selection's list intact
                const isStale = staleSoFar || stale;
                list.innerHTML = '';
                if (!items.length) { setStatus((isStale ? STALE_MSG + ' ' : '') + 'Šio posėdžio darbotvarkė tuščia.', 'warn'); return; }
                items.forEach(item => list.appendChild(renderItem(item)));
                setStatus(isStale ? STALE_MSG + ' ' + ATTRIBUTION : ATTRIBUTION, isStale ? 'warn' : 'muted');
            } catch (err) {
                if (my === loadSeq) setStatus('Nepavyko įkelti darbotvarkės.', 'error');
            }
        }

        function renderItem(item) {
            const row = document.createElement('button');
            row.type = 'button';
            row.className = 'real-agenda-item';
            const meta = [item.stage, item.timeFrom && item.timeTo ? `${item.timeFrom}–${item.timeTo}` : '']
                .filter(Boolean).join(' · ');
            const speakers = item.speakers.map(s => s.name).slice(0, 3).join(', ');
            row.innerHTML =
                `<span class="real-agenda-item__num">${escapeHtml(item.number)}</span>` +
                `<span class="real-agenda-item__body">` +
                    `<span class="real-agenda-item__title">${escapeHtml(item.title)}</span>` +
                    (meta || speakers
                        ? `<span class="real-agenda-item__meta">${escapeHtml([meta, speakers].filter(Boolean).join(' · '))}</span>`
                        : '') +
                `</span>` +
                `<span class="real-agenda-item__use">Naudoti →</span>`;
            row.addEventListener('click', () => useTopic(item, row));
            return row;
        }

        function useTopic(item, row) {
            if (!questionInput) return;
            questionInput.value = itemToTopic(item);
            // Let any listeners (autosize, validation) react as if typed.
            questionInput.dispatchEvent(new Event('input', { bubbles: true }));
            list.querySelectorAll('.real-agenda-item.selected').forEach(el => el.classList.remove('selected'));
            row.classList.add('selected');
            setStatus('Tema įkelta į „Posėdžio tema / klausimas". Galite ją redaguoti prieš generuodami.', 'ok');
            questionInput.focus();
            questionInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        function escapeHtml(s) {
            return String(s).replace(/[&<>"']/g, c =>
                ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        // Lazy-load on first expand of the accordion section to avoid a network
        // hit for users who never open it.
        // The section starts collapsed, so the first click always expands it.
        // Load once then; subsequent toggles reuse what's already rendered.
        const sectionHead = root.querySelector('[data-accordion]');
        if (sectionHead) {
            sectionHead.addEventListener('click', () => {
                if (!loadedOnce) { loadedOnce = true; loadSessions(); }
            });
        }

        sessionSelect.addEventListener('change', () => loadSittings());
        sittingSelect.addEventListener('change', () => loadAgenda());
        if (refreshBtn) refreshBtn.addEventListener('click', () => { loadedOnce = true; loadSessions({ force: true }); });
    }

    // The settings panel is rendered by React, so the DOM block appears only
    // after mount. React calls this (idempotent) initializer from its effect,
    // mirroring window.initializeSeimasLiveStream. Also try opportunistically in
    // case the markup is already present (e.g. static usage/tests).
    window.initializeSeimasRealAgenda = initUI;
    initUI();

    window.SeimasRealAgenda = api;
})();
