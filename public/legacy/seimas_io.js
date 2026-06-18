/**
 * SeimasIO — dependency-free export/import helpers.
 *
 *  - A minimal STORE-only (no compression) ZIP writer and reader, so a whole
 *    session (JSON + readable transcript + every audio clip) can be exported
 *    as one .zip and re-imported later — no re-generation, no cost.
 *  - Helpers to turn a session into readable Markdown and to trigger downloads.
 *
 * Store-only ZIP is intentional: audio (mp3/ogg/opus) is already compressed,
 * and it keeps the implementation tiny and correct across browsers.
 */
(function () {
    'use strict';

    // ---- CRC32 ----------------------------------------------------------
    const CRC_TABLE = (function () {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            let c = n;
            for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
            t[n] = c >>> 0;
        }
        return t;
    })();
    function crc32(bytes) {
        let c = 0xFFFFFFFF;
        for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
        return (c ^ 0xFFFFFFFF) >>> 0;
    }

    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function toBytes(data) {
        if (data instanceof Uint8Array) return data;
        if (data instanceof ArrayBuffer) return new Uint8Array(data);
        return enc.encode(String(data));
    }

    // DOS time/date are required fields; use a fixed epoch (no Date.now needed).
    const DOS_TIME = 0, DOS_DATE = 0x21; // 1980-01-01

    // ---- ZIP write ------------------------------------------------------
    async function zipFiles(files) {
        // files: [{ name, data: string|Uint8Array|Blob }]
        const entries = [];
        for (const f of files) {
            let bytes;
            if (f.data instanceof Blob) bytes = new Uint8Array(await f.data.arrayBuffer());
            else bytes = toBytes(f.data);
            entries.push({ name: f.name, bytes, crc: crc32(bytes) });
        }

        const localParts = [];
        const central = [];
        let offset = 0;

        for (const e of entries) {
            const nameBytes = enc.encode(e.name);
            const local = new DataView(new ArrayBuffer(30));
            local.setUint32(0, 0x04034b50, true);   // local file header sig
            local.setUint16(4, 20, true);            // version needed
            local.setUint16(6, 0x0800, true);        // flags: UTF-8 names
            local.setUint16(8, 0, true);             // method: store
            local.setUint16(10, DOS_TIME, true);
            local.setUint16(12, DOS_DATE, true);
            local.setUint32(14, e.crc, true);
            local.setUint32(18, e.bytes.length, true);
            local.setUint32(22, e.bytes.length, true);
            local.setUint16(26, nameBytes.length, true);
            local.setUint16(28, 0, true);            // extra len
            localParts.push(new Uint8Array(local.buffer), nameBytes, e.bytes);

            const cd = new DataView(new ArrayBuffer(46));
            cd.setUint32(0, 0x02014b50, true);       // central dir sig
            cd.setUint16(4, 20, true);
            cd.setUint16(6, 20, true);
            cd.setUint16(8, 0x0800, true);
            cd.setUint16(10, 0, true);
            cd.setUint16(12, DOS_TIME, true);
            cd.setUint16(14, DOS_DATE, true);
            cd.setUint32(16, e.crc, true);
            cd.setUint32(20, e.bytes.length, true);
            cd.setUint32(24, e.bytes.length, true);
            cd.setUint16(28, nameBytes.length, true);
            cd.setUint32(42, offset, true);          // local header offset
            central.push({ header: new Uint8Array(cd.buffer), nameBytes });

            offset += 30 + nameBytes.length + e.bytes.length;
        }

        const cdStart = offset;
        const cdParts = [];
        let cdSize = 0;
        for (const c of central) {
            cdParts.push(c.header, c.nameBytes);
            cdSize += c.header.length + c.nameBytes.length;
        }

        const eocd = new DataView(new ArrayBuffer(22));
        eocd.setUint32(0, 0x06054b50, true);
        eocd.setUint16(8, entries.length, true);
        eocd.setUint16(10, entries.length, true);
        eocd.setUint32(12, cdSize, true);
        eocd.setUint32(16, cdStart, true);

        return new Blob([...localParts, ...cdParts, new Uint8Array(eocd.buffer)], { type: 'application/zip' });
    }

    // ---- ZIP read (store-only) ------------------------------------------
    async function unzip(blob) {
        const buf = new Uint8Array(await blob.arrayBuffer());
        const dv = new DataView(buf.buffer);
        // Find End Of Central Directory (scan backwards).
        let p = buf.length - 22;
        while (p >= 0 && dv.getUint32(p, true) !== 0x06054b50) p--;
        if (p < 0) throw new Error('Netinkamas ZIP failas');
        const count = dv.getUint16(p + 10, true);
        let cdOffset = dv.getUint32(p + 16, true);

        const files = [];
        for (let i = 0; i < count; i++) {
            if (dv.getUint32(cdOffset, true) !== 0x02014b50) break;
            const method = dv.getUint16(cdOffset + 10, true);
            const compSize = dv.getUint32(cdOffset + 20, true);
            const nameLen = dv.getUint16(cdOffset + 28, true);
            const extraLen = dv.getUint16(cdOffset + 30, true);
            const commentLen = dv.getUint16(cdOffset + 32, true);
            const localOffset = dv.getUint32(cdOffset + 42, true);
            const name = dec.decode(buf.subarray(cdOffset + 46, cdOffset + 46 + nameLen));

            // Read local header to find data start.
            const lhNameLen = dv.getUint16(localOffset + 26, true);
            const lhExtraLen = dv.getUint16(localOffset + 28, true);
            const dataStart = localOffset + 30 + lhNameLen + lhExtraLen;
            const data = buf.subarray(dataStart, dataStart + compSize);
            if (method !== 0) {
                console.warn('SeimasIO: skipping compressed entry (store-only reader):', name);
            } else {
                files.push({ name, data: new Uint8Array(data) });
            }
            cdOffset += 46 + nameLen + extraLen + commentLen;
        }
        return files;
    }

    // ---- Readable transcript --------------------------------------------
    function sessionToMarkdown(session) {
        const lines = [];
        lines.push(`# ${session.title || 'Seimo posėdis'}`);
        if (session.topic) lines.push(`\n**Tema:** ${session.topic}`);
        if (session.savedAt) lines.push(`**Įrašyta:** ${session.savedAt}`);
        lines.push(`**Įvykių:** ${(session.events || []).length} · **Trukmė (modelinė):** ${session.durationMinutes || 0} min.\n`);
        lines.push('---\n');
        (session.events || []).forEach((e, i) => {
            lines.push(`### ${e.timestamp || ''} — ${e.speaker || ''}${e.title ? ` *(${e.title})*` : ''}${e.party ? ` · ${e.party}` : ''}`);
            lines.push(`\n${e.text || ''}\n`);
            if (e.update) lines.push(`> 📌 ${e.update}\n`);
        });
        return lines.join('\n');
    }

    function slugify(text) {
        return String(text || 'sesija')
            .normalize('NFD').replace(/[̀-ͯ]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'sesija';
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    window.SeimasIO = { zipFiles, unzip, sessionToMarkdown, slugify, downloadBlob, crc32 };
})();
