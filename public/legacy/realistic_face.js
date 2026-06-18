/**
 * RealisticFace — a semi-realistic, audio-driven talking head for the browser.
 *
 * Architecture (per 2026 research recommendation): 2D portrait + a browser
 * viseme engine driven by real Web Audio FFT analysis of the actually playing
 * audio. No GPU, no per-minute cost, scales to 141 speakers, fully offline.
 *
 *  - Each speaker gets a DETERMINISTIC portrait seeded from their name
 *    (skin tone, face shape, hair, eyes, glasses, facial hair, party tie),
 *    so the same MP always looks the same and looks distinct from others.
 *  - The mouth is driven by genuine visemes extracted from the audio signal
 *    (energy → jaw openness, spectral centroid → vowel shape), not random.
 *  - Optional real photos: if window.SEIMAS_MEMBER_PHOTOS maps a name to an
 *    image URL, that photo is used and the mouth region is animated over it.
 *
 * Public API (kept compatible with the previous AnimatedFace):
 *    new RealisticFace(containerId)
 *    .setSpeaker({ name, party, title })
 *    .syncWithAudioElement(audioElement, text)
 *    .speak(text, rate)         // fallback when no audio element is available
 *    .setRate(rate)
 *    .stop()
 *    .destroy()
 */
(function () {
    'use strict';

    // ---- Deterministic PRNG (mulberry32) seeded from a string -------------
    function hashString(str) {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }
    function mulberry32(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Infer a likely gender from Lithuanian name endings (best-effort, visual only).
    function inferFemale(name) {
        const n = (name || '').trim().toLowerCase();
        if (!n) return false;
        const parts = n.split(/\s+/);
        const last = parts[parts.length - 1];
        const first = parts[0];
        // Female surname suffixes
        if (/(ienė|aitė|ytė|utė|ūtė|tė)$/.test(last)) return true;
        // Female given names usually end in -a or -ė; male given names end in -as/-is/-us/-ius/-jus
        if (/(as|is|us|ius|jus|ys| as)$/.test(first)) return false;
        if (/(a|ė)$/.test(first)) return true;
        return /(a|ė)$/.test(last);
    }

    const SKIN_TONES = ['#f3d2b3', '#ecc19b', '#e3b38b', '#d9a679', '#cf9a6c', '#f7dcc0', '#e8bf9a'];
    const HAIR_COLORS = ['#2b2118', '#3d2b1a', '#5a4326', '#7a5c34', '#9c7a45', '#b9b4ad', '#d7d3cc', '#8a8a8a', '#1c1a17'];
    const EYE_COLORS = ['#5b4636', '#6f4e37', '#3a6ea5', '#4a7c59', '#7b8794', '#52423a'];

    const PARTY_COLORS = {
        'LSDP': '#d32f2f', 'TS-LKD': '#1976d2', 'Nemuno aušra': '#7b1fa2',
        'DSVL': '#2e8b57', 'Liberalų sąjūdis': '#f9a825', 'LVŽS': '#2e7d32',
        'LLRA-KŠS': '#6d4c41', 'Demokratų frakcija': '#00897b', 'Mišri': '#607d8b',
        'Nepriklausomas': '#78909c'
    };
    function partyColor(party) {
        if (!party) return '#5c6f82';
        return PARTY_COLORS[party] || PARTY_COLORS[Object.keys(PARTY_COLORS).find(k => party.includes(k)) || ''] || '#5c6f82';
    }

    // ---- Viseme targets: {open, wide, round} in 0..1 ---------------------
    const VISEMES = {
        sil:  { open: 0.02, wide: 0.30, round: 0.20 }, // closed / rest
        MBP:  { open: 0.00, wide: 0.34, round: 0.18 }, // bilabial closure
        aa:   { open: 0.85, wide: 0.55, round: 0.10 }, // "a" open
        E:    { open: 0.42, wide: 0.85, round: 0.05 }, // "e/i" wide
        I:    { open: 0.30, wide: 0.92, round: 0.02 },
        O:    { open: 0.62, wide: 0.30, round: 0.85 }, // "o" round
        U:    { open: 0.34, wide: 0.22, round: 0.95 }, // "u" pucker
        FV:   { open: 0.16, wide: 0.55, round: 0.10 }
    };

    class RealisticFace {
        constructor(containerId) {
            this.container = typeof containerId === 'string'
                ? document.getElementById(containerId) : containerId;
            if (!this.container) {
                console.error('RealisticFace: container not found:', containerId);
                return;
            }
            this.isSpeaking = false;
            this.speechRate = 1;
            this.profile = this._buildProfile('', '');

            // Animation state
            this.mouth = { open: 0.02, wide: 0.30, round: 0.20 };
            this.target = Object.assign({}, VISEMES.sil);
            this.blinkTimer = 0;
            this.eyeOpen = 1;
            this.head = { x: 0, y: 0 };
            this.headTarget = { x: 0, y: 0 };
            this.energy = 0;
            this.expression = {
                jaw: 0,
                cheek: 0,
                brow: 0,
                nostril: 0,
                ear: 0,
                squint: 0,
                lipTension: 0
            };

            // Audio analysis
            this.audioEl = null;
            this.audioListeners = null;
            this.manualTimeout = null;

            this._setupCanvas();
            this._loop = this._loop.bind(this);
            this._raf = requestAnimationFrame(this._loop);
            this._onResize = () => this._resize();
            window.addEventListener('resize', this._onResize);
            this.isInitialized = true;
        }

        _setupCanvas() {
            this.container.innerHTML = '';
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'realistic-face-canvas';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            this.container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d', { alpha: false });

            // Offscreen pipeline buffers.
            this.faceCanvas = document.createElement('canvas');   // base face render
            this.faceCtx = this.faceCanvas.getContext('2d', { willReadFrequently: true });
            this.workCanvas = document.createElement('canvas');   // warped + dispersed result
            this.workCtx = this.workCanvas.getContext('2d', { willReadFrequently: true });
            this.bloomCanvas = document.createElement('canvas');  // blurred highlight layer
            this.bloomCtx = this.bloomCanvas.getContext('2d');
            this.bloom2 = document.createElement('canvas');
            this.bloom2Ctx = this.bloom2.getContext('2d');

            this._renderScale = 1;        // adaptive quality (1 → 0.6)
            this._frameMs = 16;
            this._time = 0;
            this._microHead = { x: 0, y: 0, tx: 0, ty: 0 };
            this._saccade = { x: 0, y: 0, tx: 0, ty: 0, t: 0 };

            this._makeGrain();
            this._resize();
        }

        _resize() {
            if (!this.canvas) return;
            const rect = this.container.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            this.cw = Math.max(1, Math.floor(rect.width));
            this.ch = Math.max(1, Math.floor(rect.height));
            this.canvas.width = Math.floor(this.cw * dpr);
            this.canvas.height = Math.floor(this.ch * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            this._sizeBuffers();
        }

        // Internal render resolution is capped for the per-pixel passes, then
        // upscaled to the visible canvas (the soft upscale reads as cinematic).
        _sizeBuffers() {
            const aspect = this.ch / this.cw;
            const Wi = Math.max(160, Math.min(360, Math.round(this.cw * this._renderScale)));
            const Hi = Math.max(160, Math.min(520, Math.round(Wi * aspect)));
            this.Wi = Wi; this.Hi = Hi;
            [this.faceCanvas, this.workCanvas].forEach(c => { c.width = Wi; c.height = Hi; });
            const bw = Math.max(1, Math.round(Wi / 3)), bh = Math.max(1, Math.round(Hi / 3));
            this.bloomCanvas.width = bw; this.bloomCanvas.height = bh;
            this.bloom2.width = Math.max(1, Math.round(bw / 2)); this.bloom2.height = Math.max(1, Math.round(bh / 2));
        }

        _makeGrain() {
            const g = document.createElement('canvas');
            g.width = g.height = 128;
            const gc = g.getContext('2d');
            const img = gc.createImageData(128, 128);
            for (let i = 0; i < img.data.length; i += 4) {
                const v = (Math.random() * 255) | 0;
                img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
                img.data[i + 3] = 255;
            }
            gc.putImageData(img, 0, 0);
            this.grainCanvas = g;
            this._grainPhase = 0;
        }

        // ---- Per-speaker deterministic appearance ------------------------
        _buildProfile(name, party) {
            const rng = mulberry32(hashString((name || 'default') + '|' + (party || '')));
            const hasName = Boolean((name || '').trim());
            const female = inferFemale(name);
            const pick = arr => arr[Math.floor(rng() * arr.length)];
            const grayBias = rng();
            const hair = grayBias > 0.88 ? pick(['#b9b4ad', '#d7d3cc', '#8a8a8a'])
                : pick(HAIR_COLORS.slice(0, 6));
            const photo = (window.SEIMAS_MEMBER_PHOTOS && name && window.SEIMAS_MEMBER_PHOTOS[name]) || null;
            return {
                name, party,
                female,
                photo,
                photoImg: null,
                skin: pick(SKIN_TONES),
                hair,
                eye: pick(EYE_COLORS),
                tie: partyColor(party),
                // Women get a slightly narrower face & jaw, softer brows, fuller lips,
                // and (almost always) longer hair so gender reads clearly.
                faceWidth: (female ? 0.80 : 0.88) + rng() * 0.16,
                jaw: (female ? 0.62 : 0.85) + rng() * 0.22,
                bald: hasName && !female && rng() > 0.78,
                receding: hasName && !female && rng() > 0.55,
                longHair: female ? rng() > 0.12 : false,
                glasses: rng() > (female ? 0.8 : 0.58),
                beard: hasName && !female && rng() > 0.74,
                mustache: hasName && !female && rng() > 0.84,
                earrings: female && rng() > 0.45,
                blush: female,
                browThick: (female ? 0.35 : 0.7) + rng() * (female ? 0.4 : 0.7),
                noseLen: (female ? 0.85 : 0.95) + rng() * 0.3,
                eyeSpacing: 0.92 + rng() * 0.16,
                lashes: female,
                lipFull: female ? 1.25 : 0.95,
                lipTint: female ? '#bd5b63' : '#a9645c',
                seed: rng()
            };
        }

        setSpeaker(info) {
            const name = (info && info.name) || '';
            const party = (info && info.party) || '';
            if (this.profile && this.profile.name === name && this.profile.party === party) return;
            this.profile = this._buildProfile(name, party);
            if (this.profile.photo) {
                const img = new Image();
                img.onload = () => { this.profile.photoImg = img; };
                img.src = this.profile.photo;
            }
        }

        // ---- Audio-driven lip sync ---------------------------------------
        _ensureAudioContext() {
            if (!RealisticFace._audioCtx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return null;
                RealisticFace._audioCtx = new Ctx();
                RealisticFace._sources = new WeakMap();
            }
            return RealisticFace._audioCtx;
        }

        syncWithAudioElement(audioElement, text) {
            if (!audioElement || typeof audioElement.addEventListener !== 'function') return;
            this._detachAudio();
            this.audioEl = audioElement;

            const ctx = this._ensureAudioContext();
            if (ctx) {
                try {
                    if (ctx.state === 'suspended') ctx.resume();
                    let node = RealisticFace._sources.get(audioElement);
                    if (!node) {
                        const source = ctx.createMediaElementSource(audioElement);
                        const analyser = ctx.createAnalyser();
                        analyser.fftSize = 1024;
                        analyser.smoothingTimeConstant = 0.6;
                        source.connect(analyser);
                        analyser.connect(ctx.destination);
                        node = { source, analyser };
                        RealisticFace._sources.set(audioElement, node);
                    }
                    this.analyser = node.analyser;
                    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
                    this.sampleRate = ctx.sampleRate;
                } catch (err) {
                    console.warn('RealisticFace: audio analysis unavailable, using fallback', err);
                    this.analyser = null;
                }
            }

            const onPlay = () => {
                this.isSpeaking = true;
                if (RealisticFace._audioCtx && RealisticFace._audioCtx.state === 'suspended') {
                    RealisticFace._audioCtx.resume();
                }
                this._startHeadMotion();
            };
            const onStop = () => {
                if (!audioElement.paused && !audioElement.ended) return;
                this.isSpeaking = false;
                this.target = Object.assign({}, VISEMES.sil);
            };
            audioElement.addEventListener('play', onPlay);
            audioElement.addEventListener('playing', onPlay);
            audioElement.addEventListener('pause', onStop);
            audioElement.addEventListener('ended', onStop);
            this.audioListeners = { onPlay, onStop };
            if (!audioElement.paused) onPlay();
        }

        _detachAudio() {
            if (this.audioEl && this.audioListeners) {
                this.audioEl.removeEventListener('play', this.audioListeners.onPlay);
                this.audioEl.removeEventListener('playing', this.audioListeners.onPlay);
                this.audioEl.removeEventListener('pause', this.audioListeners.onStop);
                this.audioEl.removeEventListener('ended', this.audioListeners.onStop);
            }
            this.audioEl = null;
            this.audioListeners = null;
            this.analyser = null;
            if (this.manualTimeout) { clearTimeout(this.manualTimeout); this.manualTimeout = null; }
        }

        // Fallback when there is no real audio element (e.g. preview).
        speak(text, rate) {
            this._detachAudio();
            const len = Math.max(1, (text || '').length);
            const dur = Math.min(20, Math.max(2, len / (12 * Math.max(rate || 1, 0.1))));
            this.isSpeaking = true;
            this._startHeadMotion();
            if (this.manualTimeout) clearTimeout(this.manualTimeout);
            this.manualTimeout = setTimeout(() => {
                this.isSpeaking = false;
                this.target = Object.assign({}, VISEMES.sil);
            }, dur * 1000);
            return Promise.resolve();
        }

        setRate(rate) { this.speechRate = rate || 1; }

        stop() {
            this._detachAudio();
            this.isSpeaking = false;
            this.target = Object.assign({}, VISEMES.sil);
        }

        detachExternalAudio() { this._detachAudio(); }

        destroy() {
            this.stop();
            cancelAnimationFrame(this._raf);
            window.removeEventListener('resize', this._onResize);
            if (this.container) this.container.innerHTML = '';
        }

        _startHeadMotion() {
            const move = () => {
                if (!this.isSpeaking) { this.headTarget = { x: 0, y: 0 }; return; }
                this.headTarget = {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.07
                };
                setTimeout(move, 900 + Math.random() * 1600);
            };
            move();
        }

        // Analyse the current audio frame -> choose a viseme target.
        _analyseAudio() {
            if (!this.analyser || !this.freqData) return;
            this.analyser.getByteFrequencyData(this.freqData);
            const bins = this.freqData;
            const n = bins.length;
            const nyquist = (this.sampleRate || 44100) / 2;
            const hzPerBin = nyquist / n;

            let total = 0, weighted = 0, low = 0, mid = 0, high = 0;
            for (let i = 1; i < n; i++) {
                const v = bins[i];
                const hz = i * hzPerBin;
                total += v;
                weighted += v * hz;
                if (hz < 500) low += v;
                else if (hz < 2000) mid += v;
                else high += v;
            }
            const energy = total / n / 255;          // 0..~1 loudness
            const centroid = total > 0 ? weighted / total : 0; // Hz

            // Smooth energy for jaw openness.
            this.energy += (energy - this.energy) * 0.5;
            const e = this.energy;

            if (e < 0.06) {
                this.target = Object.assign({}, VISEMES.sil);
                return;
            }

            // Choose vowel shape from spectral balance.
            let v;
            const highRatio = high / (total || 1);
            const lowRatio = low / (total || 1);
            if (centroid > 1700 || highRatio > 0.34) {
                v = e > 0.34 ? VISEMES.E : VISEMES.I;
            } else if (centroid < 750 && lowRatio > 0.5) {
                v = e > 0.32 ? VISEMES.O : VISEMES.U;
            } else if (highRatio > 0.22 && e < 0.2) {
                v = VISEMES.FV;
            } else {
                v = VISEMES.aa;
            }
            // Scale openness by loudness so quiet syllables don't gape.
            const openScale = Math.min(1, 0.35 + e * 1.4);
            this.target = {
                open: v.open * openScale,
                wide: v.wide,
                round: v.round
            };
        }

        // ---- Render loop -------------------------------------------------
        _loop() {
            this._raf = requestAnimationFrame(this._loop);
            const dt = 0.016;

            if (this.isSpeaking && this.analyser) {
                this._analyseAudio();
            } else if (this.isSpeaking) {
                // No analyser: gentle procedural motion.
                this.target = {
                    open: 0.25 + Math.abs(Math.sin(Date.now() * 0.012)) * 0.45,
                    wide: 0.45 + Math.sin(Date.now() * 0.006) * 0.15,
                    round: 0.2
                };
            } else {
                this.energy += (0 - this.energy) * 0.1;
            }

            // Fluid time advances faster while speaking.
            this._time += dt * (0.6 + this.energy * 1.6);

            // Ease mouth toward target.
            const k = Math.min(1, dt * 16);
            this.mouth.open += (this.target.open - this.mouth.open) * k;
            this.mouth.wide += (this.target.wide - this.mouth.wide) * k * 0.7;
            this.mouth.round += (this.target.round - this.mouth.round) * k * 0.7;

            const speechDrive = this.isSpeaking ? Math.max(this.energy, this.mouth.open * 0.55) : 0;
            const vowelTension = Math.max(0, this.mouth.wide - this.mouth.round * 0.45);
            const expTarget = {
                jaw: this.mouth.open,
                cheek: speechDrive * 0.7 + vowelTension * 0.18,
                brow: speechDrive * 0.28 + Math.sin(this._time * 1.7) * 0.035,
                nostril: speechDrive * 0.45 + this.mouth.round * 0.12,
                ear: speechDrive * 0.2 + Math.sin(this._time * 2.1 + (this.profile.seed || 0) * 6) * 0.025,
                squint: Math.min(0.45, speechDrive * 0.22 + this.mouth.wide * 0.08),
                lipTension: Math.max(0, this.mouth.wide - this.mouth.round) * 0.55
            };
            Object.keys(expTarget).forEach(key => {
                this.expression[key] += (expTarget[key] - this.expression[key]) * dt * 8;
            });

            // Blink.
            this.blinkTimer += dt;
            if (this.blinkTimer > 2.8 + (this.profile.seed || 0.5) * 2.5) {
                this.blinkTimer = 0;
                this._blinking = 0.001;
            }
            if (this._blinking !== undefined) {
                this._blinking += dt;
                const p = this._blinking / 0.16;
                if (p < 0.5) this.eyeOpen = 1 - p * 2;
                else if (p < 1) this.eyeOpen = (p - 0.5) * 2;
                else { this.eyeOpen = 1; this._blinking = undefined; }
            }

            // Head sway + organic micro-motion.
            this.head.x += (this.headTarget.x - this.head.x) * dt * 2;
            this.head.y += (this.headTarget.y - this.head.y) * dt * 2;
            this._microHead.t -= dt;
            if (this._microHead.t <= 0) {
                this._microHead.tx = (Math.random() - 0.5) * 0.05;
                this._microHead.ty = (Math.random() - 0.5) * 0.04;
                this._microHead.t = 0.7 + Math.random() * 1.6;
            }
            this._microHead.x += (this._microHead.tx - this._microHead.x) * dt * 1.6;
            this._microHead.y += (this._microHead.ty - this._microHead.y) * dt * 1.6;

            this._saccade.t -= dt;
            if (this._saccade.t <= 0) {
                const speakingBias = this.isSpeaking ? 1.35 : 0.7;
                this._saccade.tx = (Math.random() - 0.5) * 0.12 * speakingBias;
                this._saccade.ty = (Math.random() - 0.5) * 0.08 * speakingBias;
                this._saccade.t = 0.35 + Math.random() * (this.isSpeaking ? 1.1 : 2.4);
            }
            this._saccade.x += (this._saccade.tx - this._saccade.x) * dt * 9;
            this._saccade.y += (this._saccade.ty - this._saccade.y) * dt * 9;

            this._draw();
        }

        // ---- Cinematic pipeline ------------------------------------------
        _draw() {
            if (!this.ctx || !this.Wi) return;
            const t0 = performance.now();
            this._renderBase();        // rich face → faceCanvas (internal res)
            this._warpDisperse();      // per-pixel fluid warp + chromatic dispersion → workCanvas
            this._bloom();             // highlight extract + blur → bloomCanvas
            this._composite();         // upscale + bloom + grain + vignette → visible

            // Adaptive quality to keep the heavy passes near 60fps.
            const ms = performance.now() - t0;
            this._frameMs += (ms - this._frameMs) * 0.1;
            if (this._frameMs > 24 && this._renderScale > 0.62) {
                this._renderScale -= 0.08; this._sizeBuffers();
            } else if (this._frameMs < 12 && this._renderScale < 1) {
                this._renderScale = Math.min(1, this._renderScale + 0.05); this._sizeBuffers();
            }
        }

        _renderBase() {
            const ctx = this.faceCtx, W = this.Wi, H = this.Hi, p = this.profile;

            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#111827');
            bg.addColorStop(0.55, '#070a12');
            bg.addColorStop(1, '#04060b');
            ctx.fillStyle = bg;
            ctx.fillRect(0, 0, W, H);
            const halo = ctx.createRadialGradient(W / 2, H * 0.42, 8, W / 2, H * 0.42, Math.max(W, H) * 0.6);
            halo.addColorStop(0, this._rgba(p.tie, 0.25));
            halo.addColorStop(0.32, 'rgba(230,181,74,0.08)');
            halo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = halo;
            ctx.fillRect(0, 0, W, H);
            this._drawBroadcastDome(ctx, W, H);

            const cx = W / 2 + (this.head.y + this._microHead.y) * W * 0.35;
            const baseR = Math.min(W, H) * 0.24;
            const cy = H * 0.46 + (this.head.x + this._microHead.x) * H * 0.18
                + Math.sin(this._time * 1.3) * H * 0.004; // breathing
            this._faceCenter = { cx, cy, R: baseR };
            this._mouthPos = { x: cx, y: cy + baseR * 0.72 };
            this._eyePos = {
                lx: cx - baseR * 0.42 * p.eyeSpacing,
                rx: cx + baseR * 0.42 * p.eyeSpacing,
                y: cy + this._eyeY(baseR)
            };

            if (p.photoImg) {
                this._drawPhoto(ctx, p, cx, cy, baseR, W, H);
                return;
            }

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate((this.head.y + this._microHead.y) * 0.2);
            this._drawShoulders(ctx, p, baseR, H, cy);
            this._drawNeck(ctx, p, baseR);
            this._drawEars(ctx, p, baseR);
            this._drawHead(ctx, p, baseR);
            this._drawFacialMuscleField(ctx, p, baseR);
            this._drawHair(ctx, p, baseR);
            if (p.beard) this._drawBeard(ctx, p, baseR);
            this._drawBrows(ctx, p, baseR);
            this._drawEyes(ctx, p, baseR);
            this._drawNose(ctx, p, baseR);
            this._drawMouth(ctx, p, baseR);
            if (p.mustache) this._drawMustache(ctx, p, baseR);
            if (p.glasses) this._drawGlasses(ctx, p, baseR);
            ctx.restore();
        }

        // Per-pixel fluid warp + chromatic dispersion. The flow is built on a
        // coarse grid (cheap sines + audio + a mouth/jaw pulse) and bilinearly
        // sampled per pixel; RGB are sampled at slightly different positions so
        // edges and motion fringe like a real lens.
        _warpDisperse() {
            const W = this.Wi, H = this.Hi;
            const src = this.faceCtx.getImageData(0, 0, W, H);
            const sd = src.data;
            const out = this.workCtx.createImageData(W, H);
            const od = out.data;

            const energy = this.energy;
            const t = this._time;
            const { cx, cy, R } = this._faceCenter;
            const mouthX = this._mouthPos.x, mouthY = this._mouthPos.y;
            const eyeLx = this._eyePos.lx, eyeRx = this._eyePos.rx, eyeY = this._eyePos.y;
            const open = this.mouth.open;

            // Build coarse flow grid (px displacement) + a face mask.
            const GX = 26, GY = 32;
            const fX = this._fX || (this._fX = new Float32Array(GX * GY));
            const fY = this._fY || (this._fY = new Float32Array(GX * GY));
            for (let gy = 0; gy < GY; gy++) {
                const v = gy / (GY - 1), py = v * H;
                for (let gx = 0; gx < GX; gx++) {
                    const u = gx / (GX - 1), px = u * W;
                    let dx = Math.sin(v * 7.0 + t * 1.1) + 0.6 * Math.sin((u * 2 + v) * 5.3 - t * 0.8);
                    let dy = Math.cos(u * 6.2 - t * 0.9) + 0.6 * Math.sin((u + v * 2) * 4.7 + t * 1.0);
                    const ex = (px - cx) / (R * 1.55), ey = (py - cy) / (R * 1.95);
                    const faceMask = Math.exp(-(ex * ex + ey * ey) * 0.9);
                    const amp = (0.4 + energy * 1.5) * (0.3 + faceMask);
                    dx *= amp; dy *= amp;
                    // Jaw/mouth pulse: push pixels below the mouth downward as it opens.
                    const mdx = (px - mouthX) / (R * 0.7), mdy = (py - mouthY) / (R * 0.6);
                    const mMask = Math.exp(-(mdx * mdx + mdy * mdy));
                    dy += open * R * 0.22 * mMask * (py > mouthY - R * 0.12 ? 1 : 0.25);
                    dx += open * R * 0.05 * mMask * (px < mouthX ? -1 : 1);
                    const eyeDistL = ((px - eyeLx) / (R * 0.34)) ** 2 + ((py - eyeY) / (R * 0.24)) ** 2;
                    const eyeDistR = ((px - eyeRx) / (R * 0.34)) ** 2 + ((py - eyeY) / (R * 0.24)) ** 2;
                    const eyeMask = Math.exp(-Math.min(eyeDistL, eyeDistR));
                    dx += this._saccade.x * R * 0.08 * eyeMask;
                    dy += this._saccade.y * R * 0.06 * eyeMask - this.expression.squint * R * 0.035 * eyeMask;
                    const earMask = Math.max(
                        Math.exp(-(((px - (cx - R * 1.05)) / (R * 0.28)) ** 2 + ((py - cy) / (R * 0.52)) ** 2)),
                        Math.exp(-(((px - (cx + R * 1.05)) / (R * 0.28)) ** 2 + ((py - cy) / (R * 0.52)) ** 2))
                    );
                    dx += Math.sign(px - cx) * this.expression.ear * R * 0.05 * earMask;
                    const i = gy * GX + gx;
                    fX[i] = dx; fY[i] = dy;
                }
            }

            const dispBase = 0.35 + energy * 1.5;
            const sample = (fx, fy, ch) => {
                let sx = fx | 0, sy = fy | 0;
                if (sx < 0) sx = 0; else if (sx >= W) sx = W - 1;
                if (sy < 0) sy = 0; else if (sy >= H) sy = H - 1;
                return sd[(sy * W + sx) * 4 + ch];
            };

            const gsx = (GX - 1) / W, gsy = (GY - 1) / H;
            for (let y = 0; y < H; y++) {
                const gyf = y * gsy, gy0 = gyf | 0, ty = gyf - gy0;
                const gy1 = gy0 + 1 < GY ? gy0 + 1 : gy0;
                for (let x = 0; x < W; x++) {
                    const gxf = x * gsx, gx0 = gxf | 0, tx = gxf - gx0;
                    const gx1 = gx0 + 1 < GX ? gx0 + 1 : gx0;
                    const i00 = gy0 * GX + gx0, i10 = gy0 * GX + gx1;
                    const i01 = gy1 * GX + gx0, i11 = gy1 * GX + gx1;
                    const w00 = (1 - tx) * (1 - ty), w10 = tx * (1 - ty), w01 = (1 - tx) * ty, w11 = tx * ty;
                    const fx = fX[i00] * w00 + fX[i10] * w10 + fX[i01] * w01 + fX[i11] * w11;
                    const fy = fY[i00] * w00 + fY[i10] * w10 + fY[i01] * w01 + fY[i11] * w11;

                    const ddx = x - cx, ddy = y - cy;
                    const rr = Math.sqrt(ddx * ddx + ddy * ddy) + 1e-3;
                    const rn = rr / (R * 2.2);
                    const disp = dispBase * (rn < 1 ? rn : 1);
                    const dirx = ddx / rr, diry = ddy / rr;
                    const bx = x - fx, by = y - fy;

                    const o = (y * W + x) * 4;
                    od[o]     = sample(bx + dirx * disp, by + diry * disp, 0);
                    od[o + 1] = sample(bx, by, 1);
                    od[o + 2] = sample(bx - dirx * disp, by - diry * disp, 2);
                    od[o + 3] = 255;
                }
            }
            this.workCtx.putImageData(out, 0, 0);
        }

        _bloom() {
            const bw = this.bloomCanvas.width, bh = this.bloomCanvas.height;
            const bctx = this.bloomCtx;
            bctx.globalCompositeOperation = 'source-over';
            bctx.clearRect(0, 0, bw, bh);
            // Downscale the warped frame (bilinear ≈ blur); 'screen' compositing
            // later makes only bright areas glow.
            bctx.drawImage(this.workCanvas, 0, 0, bw, bh);
            // Explicit speculars (eye catchlights, lip sheen, nose, forehead).
            this._addSpeculars(bctx, bw / this.Wi);
            // Second blur pass.
            const b2 = this.bloom2, b2c = this.bloom2Ctx;
            b2c.clearRect(0, 0, b2.width, b2.height);
            b2c.drawImage(this.bloomCanvas, 0, 0, b2.width, b2.height);
            bctx.globalAlpha = 0.7;
            bctx.drawImage(b2, 0, 0, bw, bh);
            bctx.globalAlpha = 1;
        }

        _addSpeculars(bctx, S) {
            bctx.globalCompositeOperation = 'lighter';
            const glow = (x, y, r, a) => {
                const g = bctx.createRadialGradient(x * S, y * S, 0, x * S, y * S, r * S);
                g.addColorStop(0, `rgba(255,248,232,${a})`);
                g.addColorStop(1, 'rgba(255,248,232,0)');
                bctx.fillStyle = g;
                bctx.beginPath();
                bctx.arc(x * S, y * S, r * S, 0, Math.PI * 2);
                bctx.fill();
            };
            const R = this._faceCenter.R;
            glow(this._eyePos.lx - R * 0.03, this._eyePos.y - R * 0.03, R * 0.12, 0.9);
            glow(this._eyePos.rx - R * 0.03, this._eyePos.y - R * 0.03, R * 0.12, 0.9);
            // lip sheen scales with how open/wet the mouth is
            glow(this._mouthPos.x, this._mouthPos.y, R * (0.18 + this.mouth.open * 0.14), 0.35 + this.energy * 0.3);
            glow(this._faceCenter.cx, this._faceCenter.cy - R * 0.55, R * 0.45, 0.18); // forehead
            bctx.globalCompositeOperation = 'source-over';
        }

        _composite() {
            const ctx = this.ctx, W = this.cw, H = this.ch;
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.drawImage(this.workCanvas, 0, 0, W, H);

            // Bloom (screen so only highlights add light).
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5 + this.energy * 0.3;
            ctx.drawImage(this.bloomCanvas, 0, 0, W, H);

            // Film grain (dispersion-like micro texture).
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = 0.045;
            const gx = -((Math.random() * 110) | 0), gy = -((Math.random() * 110) | 0);
            ctx.drawImage(this.grainCanvas, gx, gy, W + 128, H + 128);

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            const vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.18, W / 2, H * 0.52, Math.max(W, H) * 0.72);
            vg.addColorStop(0, 'rgba(0,0,0,0)');
            vg.addColorStop(1, 'rgba(0,0,0,0.5)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);
        }

        _drawBroadcastDome(ctx, W, H) {
            const y = H * 0.9;
            const cx = W * 0.5;
            const rx = W * 0.46;
            const ry = H * 0.24;
            ctx.save();
            ctx.strokeStyle = 'rgba(230,181,74,0.16)';
            ctx.lineWidth = Math.max(1, W * 0.002);
            ctx.beginPath();
            ctx.ellipse(cx, y, rx, ry, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(61,217,211,0.08)';
            for (let i = -4; i <= 4; i++) {
                const x = cx + (i / 4) * rx;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.quadraticCurveTo(cx + (i / 8) * rx, y - ry * 0.78, cx, y - ry);
                ctx.stroke();
            }
            for (let j = 1; j <= 3; j++) {
                ctx.beginPath();
                ctx.ellipse(cx, y, rx * (j / 3), ry * (j / 3), 0, Math.PI, Math.PI * 2);
                ctx.stroke();
            }
            ctx.restore();
        }

        _drawFacialMuscleField(ctx, p, R) {
            const e = this.expression;
            const cheekAlpha = 0.06 + e.cheek * 0.18;
            ctx.save();
            ctx.globalCompositeOperation = 'soft-light';
            [-1, 1].forEach(s => {
                const g = ctx.createRadialGradient(s * R * 0.42, R * 0.25, 0, s * R * 0.42, R * 0.25, R * 0.42);
                g.addColorStop(0, `rgba(255,220,190,${cheekAlpha})`);
                g.addColorStop(0.72, `rgba(184,92,99,${cheekAlpha * 0.35})`);
                g.addColorStop(1, 'rgba(255,220,190,0)');
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(s * R * 0.42, R * 0.28 - e.cheek * R * 0.06, R * 0.38, R * 0.28, s * 0.18, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(105,65,48,${0.08 + e.jaw * 0.16})`;
            ctx.beginPath();
            ctx.ellipse(0, R * (0.82 + e.jaw * 0.1), R * 0.62, R * (0.16 + e.jaw * 0.12), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        _drawPhoto(ctx, p, cx, cy, baseR, W, H) {
            const img = p.photoImg;
            const size = baseR * 4.4;
            const ar = img.width / img.height;
            let dw = size, dh = size;
            if (ar > 1) dh = size / ar; else dw = size * ar;
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(cx, cy, baseR * 1.5, baseR * 1.9, 0, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
            // Animated mouth overlay over the photo.
            const my = cy + baseR * 0.62;
            const open = this.mouth.open * baseR * 0.5;
            ctx.fillStyle = 'rgba(60,20,20,0.85)';
            ctx.beginPath();
            ctx.ellipse(cx, my, baseR * (0.32 + this.mouth.wide * 0.12), Math.max(2, open), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        _shade(ctx, x, y, rx, ry, base, light, dark) {
            const g = ctx.createRadialGradient(x - rx * 0.3, y - ry * 0.4, ry * 0.1, x, y, ry * 1.2);
            g.addColorStop(0, light);
            g.addColorStop(0.6, base);
            g.addColorStop(1, dark);
            ctx.fillStyle = g;
        }

        _drawShoulders(ctx, p, R, H, cy) {
            const y = R * 1.7;
            const suit = ctx.createLinearGradient(0, R * 1.25, 0, R * 3.25);
            suit.addColorStop(0, '#20283a');
            suit.addColorStop(1, '#080b13');
            ctx.fillStyle = suit;
            ctx.beginPath();
            ctx.moveTo(-R * 2.6, R * 3.2);
            ctx.quadraticCurveTo(-R * 1.9, y, 0, y - R * 0.1);
            ctx.quadraticCurveTo(R * 1.9, y, R * 2.6, R * 3.2);
            ctx.closePath();
            ctx.fill();
            // Shirt collar
            ctx.fillStyle = '#f4f1e8';
            ctx.beginPath();
            ctx.moveTo(-R * 0.5, R * 1.45);
            ctx.lineTo(0, R * 2.0);
            ctx.lineTo(R * 0.5, R * 1.45);
            ctx.lineTo(R * 0.32, R * 1.3);
            ctx.lineTo(-R * 0.32, R * 1.3);
            ctx.closePath();
            ctx.fill();
            // Tie (party colour)
            ctx.fillStyle = p.tie;
            ctx.beginPath();
            ctx.moveTo(-R * 0.12, R * 1.5);
            ctx.lineTo(R * 0.12, R * 1.5);
            ctx.lineTo(R * 0.22, R * 3.0);
            ctx.lineTo(0, R * 3.3);
            ctx.lineTo(-R * 0.22, R * 3.0);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = this._rgba(p.tie, 0.6);
            ctx.beginPath();
            ctx.moveTo(-R * 0.14, R * 1.45);
            ctx.lineTo(R * 0.14, R * 1.45);
            ctx.lineTo(R * 0.18, R * 1.7);
            ctx.lineTo(-R * 0.18, R * 1.7);
            ctx.closePath();
            ctx.fill();
        }

        _drawNeck(ctx, p, R) {
            this._shade(ctx, 0, R * 1.1, R * 0.35, R * 0.5,
                p.skin, this._lighten(p.skin, 8), this._darken(p.skin, 22));
            ctx.fillRect(-R * 0.35, R * 0.7, R * 0.7, R * 0.8);
            ctx.beginPath();
            ctx.ellipse(0, R * 1.4, R * 0.4, R * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawHead(ctx, p, R) {
            const rx = R * p.faceWidth;
            const ry = R * 1.18;
            this._shade(ctx, 0, 0, rx, ry, p.skin, this._lighten(p.skin, 14), this._darken(p.skin, 26));
            ctx.beginPath();
            // Face outline: forehead round, jaw narrows.
            ctx.moveTo(-rx, -ry * 0.25);
            ctx.quadraticCurveTo(-rx, -ry, 0, -ry);
            ctx.quadraticCurveTo(rx, -ry, rx, -ry * 0.25);
            ctx.quadraticCurveTo(rx * 0.96, ry * 0.55, rx * p.jaw * 0.6, ry * 0.9);
            ctx.quadraticCurveTo(0, ry * 1.12, -rx * p.jaw * 0.6, ry * 0.9);
            ctx.quadraticCurveTo(-rx * 0.96, ry * 0.55, -rx, -ry * 0.25);
            ctx.closePath();
            ctx.fill();
            // Cheek warmth (stronger blush for a feminine read)
            ctx.fillStyle = this._rgba('#df8576', p.blush ? 0.22 : 0.1);
            ctx.beginPath();
            ctx.ellipse(-rx * 0.55, ry * 0.25, rx * 0.22, ry * 0.16, 0, 0, Math.PI * 2);
            ctx.ellipse(rx * 0.55, ry * 0.25, rx * 0.22, ry * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawEars(ctx, p, R) {
            const rx = R * p.faceWidth;
            const e = this.expression;
            [-1, 1].forEach(s => {
                const pulse = e.ear * R * 0.18;
                ctx.fillStyle = this._darken(p.skin, 6);
                ctx.beginPath();
                ctx.ellipse(s * (rx * 0.99 + pulse * 0.1), R * (0.05 - e.cheek * 0.035), R * (0.16 + pulse * 0.02), R * (0.26 + pulse * 0.03), s * 0.04, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = this._rgba(this._darken(p.skin, 24), 0.28);
                ctx.beginPath();
                ctx.ellipse(s * rx * 1.0, R * 0.06, R * 0.07, R * 0.15, s * 0.18, 0, Math.PI * 2);
                ctx.fill();
                if (p.earrings) {
                    ctx.fillStyle = '#e8d27a';
                    ctx.beginPath();
                    ctx.arc(s * rx * 0.98, R * (0.34 + e.ear * 0.03), R * 0.045, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        }

        _drawHair(ctx, p, R) {
            const rx = R * p.faceWidth;
            const ry = R * 1.18;
            if (p.bald) {
                // subtle fringe on the sides only
                ctx.fillStyle = p.hair;
                [-1, 1].forEach(s => {
                    ctx.beginPath();
                    ctx.ellipse(s * rx * 0.92, ry * 0.05, R * 0.14, R * 0.4, 0, 0, Math.PI * 2);
                    ctx.fill();
                });
                return;
            }
            ctx.fillStyle = p.hair;
            ctx.beginPath();
            const top = -ry * (p.receding ? 0.86 : 1.04);
            ctx.moveTo(-rx * 1.05, ry * (p.longHair ? 0.9 : 0.05));
            ctx.quadraticCurveTo(-rx * 1.12, top, 0, top);
            ctx.quadraticCurveTo(rx * 1.12, top, rx * 1.05, ry * (p.longHair ? 0.9 : 0.05));
            if (p.longHair) {
                ctx.quadraticCurveTo(rx * 1.0, ry * 0.4, rx * 0.78, ry * 0.5);
                ctx.quadraticCurveTo(rx * 0.5, -ry * 0.5, 0, -ry * 0.55);
                ctx.quadraticCurveTo(-rx * 0.5, -ry * 0.5, -rx * 0.78, ry * 0.5);
                ctx.quadraticCurveTo(-rx * 1.0, ry * 0.4, -rx * 1.05, ry * 0.9);
            } else {
                // hairline dipping over forehead
                const dip = p.receding ? -ry * 0.42 : -ry * 0.58;
                ctx.quadraticCurveTo(rx * 0.6, -ry * 0.62, rx * 0.4, dip);
                ctx.quadraticCurveTo(0, -ry * (p.receding ? 0.5 : 0.72), -rx * 0.4, dip);
                ctx.quadraticCurveTo(-rx * 0.6, -ry * 0.62, -rx * 1.05, ry * 0.05);
            }
            ctx.closePath();
            ctx.fill();
            // highlight
            ctx.fillStyle = this._lighten(p.hair, 18);
            ctx.beginPath();
            ctx.ellipse(-rx * 0.3, -ry * 0.7, rx * 0.3, ry * 0.18, -0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        _eyeY(R) { return -R * 0.12; }
        _eyeX(R) { return R * 0.42 * this.profile.eyeSpacing; }

        _drawBrows(ctx, p, R) {
            const ey = this._eyeY(R) - R * (0.34 + this.expression.brow * 0.16);
            const ex = this._eyeX(R);
            ctx.strokeStyle = this._darken(p.hair, 10);
            ctx.lineWidth = R * 0.07 * p.browThick;
            ctx.lineCap = 'round';
            [-1, 1].forEach(s => {
                ctx.beginPath();
                const asym = Math.sin(this._time * 1.4 + s) * R * 0.025 * (0.4 + this.energy);
                ctx.moveTo(s * ex - R * 0.18, ey + R * 0.03 + asym);
                ctx.quadraticCurveTo(s * ex, ey - R * (0.06 + this.expression.brow * 0.06), s * ex + R * 0.18, ey + R * 0.02 - asym);
                ctx.stroke();
            });
        }

        _drawEyes(ctx, p, R) {
            const ey = this._eyeY(R);
            const ex = this._eyeX(R);
            const ew = R * (0.19 + this.expression.squint * 0.012);
            const eh = R * 0.095 * this.eyeOpen * (1 - this.expression.squint * 0.34) + 0.5;
            [-1, 1].forEach(s => {
                const x = s * ex;
                // white
                ctx.fillStyle = '#f4f1ec';
                ctx.beginPath();
                ctx.ellipse(x, ey, ew, eh, 0, 0, Math.PI * 2);
                ctx.fill();
                if (this.eyeOpen > 0.2) {
                    // iris + pupil, slight gaze drift
                    const gazeX = this._saccade.x * R + Math.sin(Date.now() * 0.0006 + (p.seed || 0) * 6) * R * 0.018;
                    const gazeY = this._saccade.y * R;
                    ctx.fillStyle = p.eye;
                    ctx.beginPath();
                    ctx.arc(x + gazeX, ey + gazeY, R * 0.076, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#10100f';
                    ctx.beginPath();
                    ctx.arc(x + gazeX, ey + gazeY, R * 0.035, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = 'rgba(255,255,255,0.8)';
                    ctx.beginPath();
                    ctx.arc(x + gazeX - R * 0.024, ey + gazeY - R * 0.022, R * 0.014, 0, Math.PI * 2);
                    ctx.fill();
                }
                // upper lid line
                ctx.strokeStyle = this._darken(p.skin, 30);
                ctx.lineWidth = R * 0.02;
                ctx.beginPath();
                ctx.ellipse(x, ey, ew, eh, 0, Math.PI, Math.PI * 2);
                ctx.stroke();
                // eyelashes for a clearer feminine read
                if (p.lashes && this.eyeOpen > 0.3) {
                    ctx.strokeStyle = '#1c1813';
                    ctx.lineWidth = R * 0.018;
                    for (let k = -2; k <= 2; k++) {
                        const lx = x + (k / 2) * ew * 0.8;
                        ctx.beginPath();
                        ctx.moveTo(lx, ey - eh * 0.95);
                        ctx.lineTo(lx + s * R * 0.03, ey - eh * 1.5);
                        ctx.stroke();
                    }
                }
            });
        }

        _drawNose(ctx, p, R) {
            const len = R * 0.5 * p.noseLen;
            const flare = this.expression.nostril;
            ctx.strokeStyle = this._darken(p.skin, 18);
            ctx.lineWidth = R * 0.03;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-R * 0.04, -R * 0.05);
            ctx.lineTo(-R * 0.07, len);
            ctx.quadraticCurveTo(0, len + R * 0.1, R * 0.12, len);
            ctx.stroke();
            // nostril shadow
            ctx.fillStyle = this._rgba(this._darken(p.skin, 40), 0.5);
            [-1, 1].forEach(s => {
                ctx.beginPath();
                ctx.ellipse(s * R * (0.06 + flare * 0.03), len + R * (0.02 + flare * 0.015), R * (0.065 + flare * 0.035), R * (0.038 + flare * 0.02), s * 0.12, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.fillStyle = this._rgba('#fff2d6', 0.09 + this.energy * 0.08);
            ctx.beginPath();
            ctx.ellipse(-R * 0.09, len - R * 0.12, R * 0.045, R * 0.18, 0.22, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawMouth(ctx, p, R) {
            const e = this.expression;
            const my = R * (0.72 + e.jaw * 0.12);
            const open = this.mouth.open * R * 0.55;
            const widthF = (0.5 + this.mouth.wide * (0.58 + e.lipTension * 0.12)) * (1 - this.mouth.round * 0.46);
            const w = R * 0.6 * widthF * p.lipFull;
            const roundPucker = this.mouth.round * R * 0.08;

            // lips outer
            const lipGrad = ctx.createRadialGradient(-w * 0.18, my - R * 0.03, 0, 0, my, w + R * 0.18);
            lipGrad.addColorStop(0, this._lighten(p.lipTint || '#b56b63', 18));
            lipGrad.addColorStop(0.58, this._darken(p.lipTint || '#b56b63', 4));
            lipGrad.addColorStop(1, this._darken(p.lipTint || '#b56b63', 24));
            ctx.fillStyle = lipGrad;
            ctx.beginPath();
            ctx.ellipse(0, my, w + R * 0.04 - roundPucker, open + R * (0.08 + this.mouth.round * 0.04), 0, 0, Math.PI * 2);
            ctx.fill();
            // mouth interior
            const inner = ctx.createRadialGradient(0, my + open * 0.2, 0, 0, my, Math.max(R * 0.08, open + w * 0.2));
            inner.addColorStop(0, '#8f3440');
            inner.addColorStop(0.62, '#481821');
            inner.addColorStop(1, '#18080d');
            ctx.fillStyle = inner;
            ctx.beginPath();
            ctx.ellipse(0, my, Math.max(R * 0.07, w - roundPucker), Math.max(1, open), 0, 0, Math.PI * 2);
            ctx.fill();
            // teeth (upper) when open enough
            if (open > R * 0.07) {
                ctx.fillStyle = '#f3efe6';
                ctx.beginPath();
                ctx.ellipse(0, my - open * 0.55, w * 0.82, open * 0.28, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = 'rgba(95,72,62,0.3)';
                ctx.lineWidth = Math.max(0.6, R * 0.006);
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo((i / 3) * w * 0.56, my - open * 0.78);
                    ctx.lineTo((i / 3) * w * 0.5, my - open * 0.36);
                    ctx.stroke();
                }
                // tongue
                ctx.fillStyle = '#b85c63';
                ctx.beginPath();
                ctx.ellipse(0, my + open * 0.5, w * 0.6, open * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // upper lip line
            ctx.strokeStyle = this._darken('#a85c54', 10);
            ctx.lineWidth = R * 0.02;
            ctx.beginPath();
            ctx.moveTo(-w - R * 0.04, my);
            ctx.quadraticCurveTo(0, my - R * (0.06 + e.lipTension * 0.06), w + R * 0.04, my);
            ctx.stroke();
            ctx.strokeStyle = `rgba(255,236,218,${0.18 + this.energy * 0.16})`;
            ctx.lineWidth = R * 0.012;
            ctx.beginPath();
            ctx.moveTo(-w * 0.45, my - open * 0.25 - R * 0.035);
            ctx.quadraticCurveTo(0, my - open * 0.42 - R * 0.02, w * 0.45, my - open * 0.25 - R * 0.035);
            ctx.stroke();
        }

        _drawBeard(ctx, p, R) {
            ctx.fillStyle = this._rgba(this._darken(p.hair, 6), 0.92);
            ctx.beginPath();
            ctx.moveTo(-R * 0.72, R * 0.1);
            ctx.quadraticCurveTo(-R * 0.7, R * 1.0, 0, R * 1.16);
            ctx.quadraticCurveTo(R * 0.7, R * 1.0, R * 0.72, R * 0.1);
            ctx.quadraticCurveTo(R * 0.4, R * 0.55, 0, R * 0.5);
            ctx.quadraticCurveTo(-R * 0.4, R * 0.55, -R * 0.72, R * 0.1);
            ctx.closePath();
            ctx.fill();
        }

        _drawMustache(ctx, p, R) {
            ctx.fillStyle = this._darken(p.hair, 6);
            ctx.beginPath();
            ctx.ellipse(0, R * 0.55, R * 0.32, R * 0.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        _drawGlasses(ctx, p, R) {
            const ey = this._eyeY(R);
            const ex = this._eyeX(R);
            ctx.strokeStyle = 'rgba(25,28,34,0.9)';
            ctx.lineWidth = R * 0.035;
            [-1, 1].forEach(s => {
                ctx.beginPath();
                ctx.ellipse(s * ex, ey, R * 0.3, R * 0.24, 0, 0, Math.PI * 2);
                ctx.stroke();
            });
            ctx.beginPath();
            ctx.moveTo(-ex + R * 0.3, ey);
            ctx.lineTo(ex - R * 0.3, ey);
            ctx.moveTo(-ex - R * 0.3, ey);
            ctx.lineTo(-ex - R * 0.55, ey - R * 0.08);
            ctx.moveTo(ex + R * 0.3, ey);
            ctx.lineTo(ex + R * 0.55, ey - R * 0.08);
            ctx.stroke();
        }

        // ---- colour helpers ----------------------------------------------
        _rgba(hex, a) {
            const c = this._toRgb(hex);
            return `rgba(${c.r},${c.g},${c.b},${a})`;
        }
        _toRgb(hex) {
            const h = hex.replace('#', '');
            return { r: parseInt(h.substr(0, 2), 16), g: parseInt(h.substr(2, 2), 16), b: parseInt(h.substr(4, 2), 16) };
        }
        _lighten(hex, amt) {
            const c = this._toRgb(hex);
            return `rgb(${Math.min(255, c.r + amt)},${Math.min(255, c.g + amt)},${Math.min(255, c.b + amt)})`;
        }
        _darken(hex, amt) {
            const c = this._toRgb(hex);
            return `rgb(${Math.max(0, c.r - amt)},${Math.max(0, c.g - amt)},${Math.max(0, c.b - amt)})`;
        }
    }

    window.RealisticFace = RealisticFace;
})();
