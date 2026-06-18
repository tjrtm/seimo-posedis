/**
 * AnimatedFace - WebGL-based animated speaking face using Three.js
 * Features: lip-sync, facial expressions, eye blinking, head movements
 */

class AnimatedFace {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isInitialized = false;
        this.isSpeaking = false;
        this.currentVoice = null;
        this.speechRate = 1.0;
        this.externalAudioElement = null;
        this.externalAudioListeners = null;
        this.manualSpeechTimeout = null;

        // Animation state
        this.mouthOpenAmount = 0;
        this.targetMouthOpen = 0;
        this.blinkTimer = 0;
        this.eyeOpenAmount = 1.0;
        this.headRotation = { x: 0, y: 0, z: 0 };
        this.targetHeadRotation = { x: 0, y: 0, z: 0 };

        // Audio analysis
        this.audioContext = null;
        this.analyser = null;
        this.audioSource = null;

        // Rendering backend flag
        this.useThree = false;

        // Canvas fallback refs
        this.canvas = null;
        this.ctx = null;

        this.init();
    }

    init() {
        if (!this.container) {
            console.error('AnimatedFace: Container not found');
            return;
        }

        if (this.canUseThreeRenderer()) {
            try {
                // Use Three.js if available
                this.useThree = true;

                // Create Three.js scene
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x1a1a1a);

                // Camera setup
                this.camera = new THREE.PerspectiveCamera(
                    45,
                    this.container.clientWidth / this.container.clientHeight,
                    0.1,
                    1000
                );
                this.camera.position.z = 5;

                // Renderer setup
                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
                this.renderer.setPixelRatio(window.devicePixelRatio);
                this.container.innerHTML = ''; // Clear container
                this.container.appendChild(this.renderer.domElement);

                // Lighting
                const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
                this.scene.add(ambientLight);

                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(5, 5, 5);
                this.scene.add(directionalLight);

                const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
                fillLight.position.set(-5, 0, -5);
                this.scene.add(fillLight);

                // Create face
                this.createFace();
            } catch (error) {
                console.error('AnimatedFace: Failed to initialize Three.js renderer, falling back to 2D', error);
                this.useThree = false;
                this.initCanvasFallback();
            }
        } else {
            // Fallback to a lightweight Canvas 2D animation
            console.warn('AnimatedFace: THREE.js renderer unavailable — using 2D fallback');
            this.initCanvasFallback();
        }

        if (!this.boundResizeHandler) {
            this.boundResizeHandler = () => this.onWindowResize();
        }
        window.addEventListener('resize', this.boundResizeHandler);

        // Start animation loop
        this.animate();

        this.isInitialized = true;
    }

    canUseThreeRenderer() {
        if (typeof THREE === 'undefined') {
            return false;
        }

        const requiredConstructors = [
            'WebGLRenderer',
            'Scene',
            'PerspectiveCamera',
            'Color',
            'Group',
            'Mesh',
            'MeshPhongMaterial',
            'SphereGeometry'
        ];

        const missing = requiredConstructors.filter(name => typeof THREE[name] !== 'function');

        if (missing.length > 0) {
            console.warn(`AnimatedFace: Missing THREE constructors (${missing.join(', ')})`);
            return false;
        }

        return true;
    }

    createFace() {
        this.face = new THREE.Group();

        // Head (main sphere)
        const headGeometry = new THREE.SphereGeometry(1, 32, 32);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdbac,
            flatShading: false,
            shininess: 30
        });
        this.head = new THREE.Mesh(headGeometry, headMaterial);
        this.face.add(this.head);

        // Eyes
        this.createEyes();

        // Eyebrows
        this.createEyebrows();

        // Nose
        this.createNose();

        // Mouth
        this.createMouth();

        // Hair
        this.createHair();

        this.scene.add(this.face);
    }

    createEyes() {
        this.eyes = new THREE.Group();

        // Left eye
        const eyeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });

        this.leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        this.leftEyeWhite.position.set(-0.3, 0.2, 0.85);

        const pupilGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const pupilMaterial = new THREE.MeshPhongMaterial({ color: 0x4a3728 });

        this.leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.leftPupil.position.set(-0.3, 0.2, 0.95);

        // Right eye
        this.rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        this.rightEyeWhite.position.set(0.3, 0.2, 0.85);

        this.rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        this.rightPupil.position.set(0.3, 0.2, 0.95);

        // Eyelids (for blinking)
        const eyelidGeometry = new THREE.SphereGeometry(0.16, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const eyelidMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });

        this.leftEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.leftEyelid.position.set(-0.3, 0.2, 0.85);
        this.leftEyelid.rotation.x = Math.PI;

        this.rightEyelid = new THREE.Mesh(eyelidGeometry, eyelidMaterial);
        this.rightEyelid.position.set(0.3, 0.2, 0.85);
        this.rightEyelid.rotation.x = Math.PI;

        this.eyes.add(this.leftEyeWhite, this.leftPupil, this.rightEyeWhite, this.rightPupil);
        this.eyes.add(this.leftEyelid, this.rightEyelid);

        this.face.add(this.eyes);
    }

    createEyebrows() {
        const eyebrowGeometry = new THREE.CapsuleGeometry(0.05, 0.3, 4, 8);
        const eyebrowMaterial = new THREE.MeshPhongMaterial({ color: 0x3d2817 });

        // Left eyebrow
        this.leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        this.leftEyebrow.position.set(-0.3, 0.45, 0.9);
        this.leftEyebrow.rotation.z = Math.PI / 2;

        // Right eyebrow
        this.rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        this.rightEyebrow.position.set(0.3, 0.45, 0.9);
        this.rightEyebrow.rotation.z = Math.PI / 2;

        this.face.add(this.leftEyebrow, this.rightEyebrow);
    }

    createNose() {
        const noseGeometry = new THREE.ConeGeometry(0.08, 0.25, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });

        this.nose = new THREE.Mesh(noseGeometry, noseMaterial);
        this.nose.position.set(0, 0, 1);
        this.nose.rotation.x = Math.PI / 2;

        this.face.add(this.nose);
    }

    createMouth() {
        this.mouth = new THREE.Group();

        // Outer mouth shape
        const mouthShape = new THREE.Shape();
        mouthShape.moveTo(-0.3, 0);
        mouthShape.quadraticCurveTo(-0.15, -0.1, 0, -0.05);
        mouthShape.quadraticCurveTo(0.15, -0.1, 0.3, 0);

        const extrudeSettings = {
            depth: 0.1,
            bevelEnabled: true,
            bevelThickness: 0.02,
            bevelSize: 0.02,
            bevelSegments: 3
        };

        const mouthGeometry = new THREE.ExtrudeGeometry(mouthShape, extrudeSettings);
        const mouthMaterial = new THREE.MeshPhongMaterial({ color: 0x8b4545 });

        this.mouthMesh = new THREE.Mesh(mouthGeometry, mouthMaterial);
        this.mouthMesh.position.set(0, -0.3, 0.85);

        // Lower jaw (for mouth opening)
        const jawGeometry = new THREE.SphereGeometry(0.6, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const jawMaterial = new THREE.MeshPhongMaterial({ color: 0xffdbac });

        this.jaw = new THREE.Mesh(jawGeometry, jawMaterial);
        this.jaw.position.set(0, -0.4, 0);

        this.mouth.add(this.mouthMesh, this.jaw);
        this.face.add(this.mouth);
    }

    createHair() {
        const hairGeometry = new THREE.SphereGeometry(1.1, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x3d2817,
            shininess: 50
        });

        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.set(0, 0.3, 0);

        this.face.add(this.hair);
    }

    initSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.synth = window.speechSynthesis;

            // Get available voices
            this.loadVoices();

            // Chrome loads voices asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.loadVoices();
            }
        } else {
            console.error('Web Speech API not supported');
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();

        // Try to find a good English voice, prefer female voices for variety
        this.currentVoice = voices.find(voice =>
            voice.lang.startsWith('en') && voice.name.includes('Female')
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
    }

    speak(text = '', rate = 1.0) {
        this.detachExternalAudio();
        const normalizedLength = Math.max(1, (text || '').length);
        const durationSeconds = Math.min(20, Math.max(2, normalizedLength / (12 * Math.max(rate, 0.1))));

        this.isSpeaking = true;
        this.startLipSync();
        this.addHeadMovements();

        if (this.manualSpeechTimeout) {
            clearTimeout(this.manualSpeechTimeout);
        }

        this.manualSpeechTimeout = setTimeout(() => this.stopManualSpeech(), durationSeconds * 1000);
        return Promise.resolve();
    }

    syncWithAudioElement(audioElement) {
        if (!audioElement || typeof audioElement.addEventListener !== 'function') {
            return;
        }

        this.detachExternalAudio();
        this.externalAudioElement = audioElement;

        const handlePlay = () => {
            if (!this.isSpeaking) {
                this.isSpeaking = true;
                this.startLipSync();
                this.addHeadMovements();
            }
        };

        const handleStop = () => {
            if (!audioElement.paused) {
                return;
            }
            this.isSpeaking = false;
            this.stopLipSync();
        };

        audioElement.addEventListener('play', handlePlay);
        audioElement.addEventListener('pause', handleStop);
        audioElement.addEventListener('ended', handleStop);

        this.externalAudioListeners = { handlePlay, handleStop };

        if (!audioElement.paused) {
            handlePlay();
        }
    }

    detachExternalAudio() {
        if (this.externalAudioElement && this.externalAudioListeners) {
            this.externalAudioElement.removeEventListener('play', this.externalAudioListeners.handlePlay);
            this.externalAudioElement.removeEventListener('pause', this.externalAudioListeners.handleStop);
            this.externalAudioElement.removeEventListener('ended', this.externalAudioListeners.handleStop);
        }

        this.externalAudioElement = null;
        this.externalAudioListeners = null;
        this.stopManualSpeech();
    }

    stopManualSpeech() {
        if (this.manualSpeechTimeout) {
            clearTimeout(this.manualSpeechTimeout);
            this.manualSpeechTimeout = null;
        }

        if (!this.externalAudioElement) {
            this.isSpeaking = false;
            this.stopLipSync();
        }
    }

    startLipSync() {
        // Simple lip-sync: oscillate mouth opening while speaking
        this.lipSyncInterval = setInterval(() => {
            if (this.isSpeaking) {
                // Random mouth movement for more natural look
                this.targetMouthOpen = 0.3 + Math.random() * 0.4;
            }
        }, 100);
    }

    stopLipSync() {
        if (this.lipSyncInterval) {
            clearInterval(this.lipSyncInterval);
            this.lipSyncInterval = null;
        }
        this.targetMouthOpen = 0;
    }

    addHeadMovements() {
        // Add subtle random head movements while speaking
        const addMovement = () => {
            if (this.isSpeaking) {
                this.targetHeadRotation.y = (Math.random() - 0.5) * 0.2;
                this.targetHeadRotation.x = (Math.random() - 0.5) * 0.1;
                setTimeout(addMovement, 1000 + Math.random() * 2000);
            } else {
                this.targetHeadRotation = { x: 0, y: 0, z: 0 };
            }
        };
        addMovement();
    }

    updateMouthAnimation(deltaTime) {
        // Smooth interpolation to target mouth opening
        const lerpSpeed = 10 * deltaTime;
        this.mouthOpenAmount += (this.targetMouthOpen - this.mouthOpenAmount) * lerpSpeed;

        // Apply mouth opening to jaw rotation
        if (this.jaw) {
            this.jaw.rotation.x = this.mouthOpenAmount * 0.5;
            this.jaw.position.y = -0.4 - this.mouthOpenAmount * 0.2;
        }

        // Scale mouth slightly
        if (this.mouthMesh) {
            this.mouthMesh.scale.y = 1 + this.mouthOpenAmount * 0.5;
        }
    }

    updateBlinkAnimation(deltaTime) {
        this.blinkTimer += deltaTime;

        // Blink every 3-5 seconds
        if (this.blinkTimer > 3 + Math.random() * 2) {
            this.blinkTimer = 0;
            this.performBlink();
        }
    }

    performBlink() {
        // Quick blink animation
        const blinkDuration = 0.15;
        let blinkTime = 0;

        const blinkInterval = setInterval(() => {
            blinkTime += 0.016; // ~60fps

            if (blinkTime < blinkDuration / 2) {
                // Closing
                this.eyeOpenAmount = 1 - (blinkTime / (blinkDuration / 2));
            } else if (blinkTime < blinkDuration) {
                // Opening
                this.eyeOpenAmount = (blinkTime - blinkDuration / 2) / (blinkDuration / 2);
            } else {
                this.eyeOpenAmount = 1;
                clearInterval(blinkInterval);
            }

            // Apply eyelid position
            if (this.leftEyelid && this.rightEyelid) {
                const eyelidY = 0.2 + (1 - this.eyeOpenAmount) * 0.3;
                this.leftEyelid.position.y = eyelidY;
                this.rightEyelid.position.y = eyelidY;
            }
        }, 16);
    }

    updateHeadRotation(deltaTime) {
        // Smooth interpolation to target head rotation
        const lerpSpeed = 2 * deltaTime;

        this.headRotation.x += (this.targetHeadRotation.x - this.headRotation.x) * lerpSpeed;
        this.headRotation.y += (this.targetHeadRotation.y - this.headRotation.y) * lerpSpeed;
        this.headRotation.z += (this.targetHeadRotation.z - this.headRotation.z) * lerpSpeed;

        if (this.face) {
            this.face.rotation.x = this.headRotation.x;
            this.face.rotation.y = this.headRotation.y;
            this.face.rotation.z = this.headRotation.z;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const deltaTime = 0.016; // Approximate 60fps

        // Update animations
        this.updateMouthAnimation(deltaTime);
        this.updateBlinkAnimation(deltaTime);
        this.updateHeadRotation(deltaTime);

        if (this.useThree) {
            // Add subtle breathing motion
            if (this.face) {
                this.face.position.y = Math.sin(Date.now() * 0.001) * 0.02;
            }
            this.renderer.render(this.scene, this.camera);
        } else {
            this.drawCanvasFallback();
        }
    }

    onWindowResize() {
        if (!this.container) return;
        if (this.useThree) {
            this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        } else if (this.canvas && this.ctx) {
            this.resizeCanvas();
        }
    }

    stop() {
        if (this.synth) {
            this.synth.cancel();
        }
        this.detachExternalAudio();
        this.isSpeaking = false;
        this.stopLipSync();
    }

    setRate(rate) {
        this.speechRate = rate;
    }

    destroy() {
        this.stop();
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// ----- Canvas 2D fallback implementation -----
AnimatedFace.prototype.initCanvasFallback = function () {
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
};

AnimatedFace.prototype.resizeCanvas = function () {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
};

AnimatedFace.prototype.drawCanvasFallback = function () {
    const ctx = this.ctx;
    if (!ctx) return;

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a1a');
    grad.addColorStop(1, '#111');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Center face area
    const cx = w / 2;
    const cy = h / 2 + Math.sin(Date.now() * 0.001) * 2; // subtle breathing
    const faceR = Math.min(w, h) * 0.28;

    // Head
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
    ctx.fill();

    // Hair (top semicircle)
    ctx.fillStyle = '#3d2817';
    ctx.beginPath();
    ctx.arc(cx, cy - faceR * 0.2, faceR * 1.05, Math.PI, 0);
    ctx.fill();

    // Eyes
    const eyeOffsetX = faceR * 0.4;
    const eyeY = cy - faceR * 0.15;
    const eyeR = faceR * 0.12;

    // Eyelid openness from 0..1
    const open = Math.max(0, Math.min(1, this.eyeOpenAmount));
    const lid = eyeR * (1 - open);

    ['left', 'right'].forEach((side, i) => {
        const ex = cx + (i === 0 ? -eyeOffsetX : eyeOffsetX);
        // White
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(ex, eyeY, eyeR, eyeR * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        // Pupil
        ctx.fillStyle = '#4a3728';
        ctx.beginPath();
        ctx.arc(ex, eyeY, eyeR * 0.45, 0, Math.PI * 2);
        ctx.fill();
        // Eyelid overlay
        if (lid > 0) {
            ctx.fillStyle = '#ffdbac';
            ctx.beginPath();
            ctx.ellipse(ex, eyeY - (open < 0.5 ? lid * 0.2 : 0), eyeR, eyeR * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Brows
    ctx.strokeStyle = '#3d2817';
    ctx.lineWidth = faceR * 0.06;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - eyeOffsetX - faceR * 0.1, eyeY - faceR * 0.25);
    ctx.lineTo(cx - eyeOffsetX + faceR * 0.1, eyeY - faceR * 0.3);
    ctx.moveTo(cx + eyeOffsetX - faceR * 0.1, eyeY - faceR * 0.3);
    ctx.lineTo(cx + eyeOffsetX + faceR * 0.1, eyeY - faceR * 0.25);
    ctx.stroke();

    // Nose
    ctx.fillStyle = '#ffdbac';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx - faceR * 0.05, cy + faceR * 0.15);
    ctx.lineTo(cx + faceR * 0.05, cy + faceR * 0.15);
    ctx.closePath();
    ctx.fill();

    // Mouth
    const openAmt = Math.max(0, this.mouthOpenAmount);
    const mouthW = faceR * 0.6;
    const mouthH = faceR * 0.1 + openAmt * faceR * 0.25;
    const mouthY = cy + faceR * 0.35;
    ctx.fillStyle = '#8b4545';
    ctx.beginPath();
    ctx.moveTo(cx - mouthW / 2, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + mouthH, cx + mouthW / 2, mouthY);
    ctx.quadraticCurveTo(cx, mouthY - mouthH * 0.3, cx - mouthW / 2, mouthY);
    ctx.fill();
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedFace;
}
