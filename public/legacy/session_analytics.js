/**
 * SeimasAnalytics — extract vote results and session statistics from a
 * generated/imported session, and render them as lightweight HTML charts.
 *
 * Vote data lives inside event text as prose (LT/EN), e.g.
 *   "Suskaičiavus: už – 61, prieš – 75, susilaikė – 5. Rezoliucija nepriimta."
 *   per-faction: "TS-LKD (50 narių): 50 prieš; LSDP (35 narių): 35 už; ..."
 * so we parse it with tolerant regexes and also accept a structured
 * `event.voteResult` object if a future generator provides one.
 */
(function () {
    'use strict';

    const PARTY_COLORS = {
        'LSDP': '#d32f2f', 'TS-LKD': '#1976d2', 'Nemuno aušra': '#7b1fa2',
        'DSVL': '#2e8b57', 'Liberalų sąjūdis': '#f9a825', 'LVŽS': '#2e7d32',
        'LLRA-KŠS': '#6d4c41', 'Demokratų frakcija': '#00897b', 'Mišri': '#607d8b',
        'Nepriklausomas': '#78909c'
    };
    function partyColor(party) {
        if (!party) return '#5c6f82';
        if (PARTY_COLORS[party]) return PARTY_COLORS[party];
        const k = Object.keys(PARTY_COLORS).find(k => party.includes(k));
        return k ? PARTY_COLORS[k] : '#5c6f82';
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
            { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
        ));
    }

    // Match a labelled count in either "už – 61" / "už: 61" or "61 už" order.
    function countFor(text, words) {
        const w = words.join('|');
        const after = new RegExp('(?:' + w + ')\\s*(?:[-–—:]?\\s*)(\\d+)', 'i');
        const before = new RegExp('(\\d+)\\s*(?:balsai?\\s*)?(?:' + w + ')', 'i');
        let m = text.match(after);
        if (m) return parseInt(m[1], 10);
        m = text.match(before);
        if (m) return parseInt(m[1], 10);
        return null;
    }

    function parseVote(event) {
        if (!event) return null;
        if (event.voteResult && typeof event.voteResult === 'object') {
            return Object.assign({ factions: [] }, event.voteResult);
        }
        const text = [event.text, event.update].filter(Boolean).join(' \n ');
        if (!text) return null;

        const yes = countFor(text, ['už', 'in favour', 'in favor', '\\bfor\\b']);
        const no = countFor(text, ['prieš', 'against']);
        const abstain = countFor(text, ['susilaikė', 'susilaikiusių', 'abstained', 'abstentions?']);
        if (yes == null && no == null && abstain == null) return null;

        let passed = null;
        if (/\bne(priimta|patvirtinta)\b|atmest|rejected|not adopted|did not pass/i.test(text)) passed = false;
        else if (/\bpriimta\b|patvirtinta|adopted|passed|approved/i.test(text)) passed = true;
        else if (yes != null && no != null) passed = yes > no;

        // Per-faction breakdown: "<NAME> (N narių): ... už ... prieš ... susilaikė".
        // Split on ';' so each faction's counts stay within its own segment.
        const factions = [];
        const factionRe = /([A-Za-zĀ-ž\-ŽŠČĮĖŲŪ\/\.\s]{2,40}?)\s*\((\d+)\s*nari[^)]*\)\s*[:–-]?\s*([^;.]*)/gi;
        let fm;
        while ((fm = factionRe.exec(text)) !== null) {
            const name = fm[1].replace(/[;,.]/g, '').trim();
            const seg = fm[3] || '';
            factions.push({
                name,
                total: parseInt(fm[2], 10),
                yes: countFor(seg, ['už', 'for']) || 0,
                no: countFor(seg, ['prieš', 'against']) || 0,
                abstain: countFor(seg, ['susilaikė', 'abstained']) || 0
            });
        }

        return {
            yes: yes || 0, no: no || 0, abstain: abstain || 0,
            passed, factions,
            title: event.title || 'Balsavimas',
            timestamp: event.timestamp || ''
        };
    }

    function findVotes(session) {
        const events = (session && session.events) || [];
        return events
            .filter(e => /vote|balsav/i.test(e.type || '') || /balsuoj|balsavim|vote|už.*prieš/i.test([e.text, e.update].join(' ')))
            .map(parseVote)
            .filter(v => v && (v.yes + v.no + v.abstain) > 0);
    }

    function wordCount(s) {
        return (String(s || '').trim().match(/\S+/g) || []).length;
    }

    function computeStats(session) {
        const events = (session && session.events) || [];
        const speakers = new Map();
        const parties = new Map();
        const typeCounts = {};
        let totalWords = 0;

        events.forEach(e => {
            const type = e.type || 'kita';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
            const words = wordCount(e.text);
            totalWords += words;
            const name = e.speaker || '—';
            if (!speakers.has(name)) speakers.set(name, { name, party: e.party || '', count: 0, words: 0 });
            const sp = speakers.get(name);
            sp.count++; sp.words += words;
            const party = e.party || 'Nenurodyta';
            if (!parties.has(party)) parties.set(party, { name: party, count: 0, words: 0, color: partyColor(party) });
            const pt = parties.get(party);
            pt.count++; pt.words += words;
        });

        const speakerList = [...speakers.values()].sort((a, b) => b.words - a.words);
        const partyList = [...parties.values()].sort((a, b) => b.count - a.count);

        return {
            totalEvents: events.length,
            durationMinutes: session.durationMinutes || 0,
            uniqueSpeakers: speakers.size,
            totalWords,
            avgWords: events.length ? Math.round(totalWords / events.length) : 0,
            speakers: speakerList,
            parties: partyList,
            typeCounts,
            topSpeaker: speakerList[0] || null
        };
    }

    // ---- Rendering ------------------------------------------------------
    const TYPE_LABELS = {
        opening: 'Atidarymas', procedural: 'Procedūra', agenda: 'Darbotvarkė',
        presentation: 'Pranešimas', speech: 'Kalbos', discussion: 'Diskusija',
        resolution: 'Rezoliucija', vote: 'Balsavimas', comment: 'Komentarai',
        break: 'Pertrauka', closing: 'Uždarymas', kita: 'Kita'
    };

    function bar(label, value, max, color, suffix) {
        const pct = max > 0 ? Math.round((value / max) * 100) : 0;
        return `<div class="an-row">
            <div class="an-row-label" title="${esc(label)}">${esc(label)}</div>
            <div class="an-row-track"><div class="an-row-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="an-row-value">${esc(value)}${suffix ? ' ' + esc(suffix) : ''}</div>
        </div>`;
    }

    function renderResults(votes) {
        if (!votes || !votes.length) {
            return `<div class="an-empty">Šioje sesijoje balsavimų rezultatų dar nėra. Sugeneruokite arba įkelkite posėdį su balsavimu.</div>`;
        }
        return votes.map(v => {
            const total = v.yes + v.no + v.abstain;
            const verdict = v.passed === true
                ? `<span class="an-badge an-badge--pass">PRIIMTA</span>`
                : v.passed === false
                    ? `<span class="an-badge an-badge--fail">NEPRIIMTA</span>`
                    : '';
            const factions = (v.factions || []).filter(f => (f.yes + f.no + f.abstain) > 0);
            const factionRows = factions.map(f => {
                const t = f.yes + f.no + f.abstain || 1;
                return `<div class="an-faction">
                    <span class="an-faction-name">${esc(f.name)}</span>
                    <div class="an-stacked">
                        <span style="width:${(f.yes / t) * 100}%;background:#2e9e5b" title="Už ${f.yes}"></span>
                        <span style="width:${(f.no / t) * 100}%;background:#d64545" title="Prieš ${f.no}"></span>
                        <span style="width:${(f.abstain / t) * 100}%;background:#b8902e" title="Susilaikė ${f.abstain}"></span>
                    </div>
                </div>`;
            }).join('');
            return `<div class="an-vote-card">
                <div class="an-vote-head">
                    <div class="an-vote-title">${esc(v.title)} ${v.timestamp ? '· ' + esc(v.timestamp) : ''}</div>
                    ${verdict}
                </div>
                <div class="an-tallies">
                    <div class="an-tally an-tally--yes"><b>${v.yes}</b><span>Už</span></div>
                    <div class="an-tally an-tally--no"><b>${v.no}</b><span>Prieš</span></div>
                    <div class="an-tally an-tally--abs"><b>${v.abstain}</b><span>Susilaikė</span></div>
                </div>
                <div class="an-stacked an-stacked--lg">
                    <span style="width:${(v.yes / (total || 1)) * 100}%;background:#2e9e5b"></span>
                    <span style="width:${(v.no / (total || 1)) * 100}%;background:#d64545"></span>
                    <span style="width:${(v.abstain / (total || 1)) * 100}%;background:#b8902e"></span>
                </div>
                ${factionRows ? `<div class="an-factions"><div class="an-sub">Pagal frakcijas</div>${factionRows}</div>` : ''}
            </div>`;
        }).join('');
    }

    function renderStats(stats) {
        if (!stats || !stats.totalEvents) {
            return `<div class="an-empty">Statistika atsiras, kai sugeneruosite arba įkelsite posėdį.</div>`;
        }
        const maxParty = Math.max(...stats.parties.map(p => p.count), 1);
        const maxSpeaker = Math.max(...stats.speakers.map(s => s.words), 1);
        const types = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1]);
        const maxType = Math.max(...types.map(t => t[1]), 1);

        const kpis = `<div class="an-kpis">
            <div class="an-kpi"><b>${stats.uniqueSpeakers}</b><span>Kalbėtojai</span></div>
            <div class="an-kpi"><b>${stats.totalEvents}</b><span>Įvykiai</span></div>
            <div class="an-kpi"><b>${stats.totalWords.toLocaleString('lt-LT')}</b><span>Žodžiai</span></div>
            <div class="an-kpi"><b>${stats.durationMinutes}</b><span>Min. (modelinė trukmė)</span></div>
        </div>`;

        const partySection = `<div class="an-section"><div class="an-sub">Pasisakymai pagal frakcijas</div>
            ${stats.parties.map(p => bar(p.name, p.count, maxParty, p.color, 'įv.')).join('')}</div>`;

        const speakerSection = `<div class="an-section"><div class="an-sub">Aktyviausi kalbėtojai (pagal žodžius)</div>
            ${stats.speakers.slice(0, 10).map(s => bar(s.name, s.words, maxSpeaker, partyColor(s.party), 'ž.')).join('')}</div>`;

        const typeSection = `<div class="an-section"><div class="an-sub">Įvykių tipai</div>
            ${types.map(([t, c]) => bar(TYPE_LABELS[t] || t, c, maxType, '#3f7cac', '')).join('')}</div>`;

        return kpis + partySection + speakerSection + typeSection;
    }

    window.SeimasAnalytics = {
        parseVote, findVotes, computeStats, renderResults, renderStats, partyColor, TYPE_LABELS
    };
})();
