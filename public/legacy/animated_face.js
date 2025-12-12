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
    grad.addColorStop(0, '#0e1222');
    grad.addColorStop(1, '#070910');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Center face area
    const cx = w / 2;
    const cy = h / 2 + Math.sin(Date.now() * 0.001) * 2; // subtle breathing
    const faceR = Math.min(w, h) * 0.28;
    const tiltY = this.headRotation.y || 0;
    const tiltX = this.headRotation.x || 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tiltY * 0.12);

    // Neck & shoulders
    const neckGrad = ctx.createLinearGradient(0, faceR * 0.6, 0, faceR * 1.1);
    neckGrad.addColorStop(0, '#f2cda7');
    neckGrad.addColorStop(1, '#d9ae7e');
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.4, faceR * 0.65);
    ctx.bezierCurveTo(-faceR * 0.2, faceR * 1.1, faceR * 0.2, faceR * 1.1, faceR * 0.4, faceR * 0.65);
    ctx.lineTo(faceR * 0.5, faceR * 1.1);
    ctx.lineTo(-faceR * 0.5, faceR * 1.1);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#1b2435';
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.5, faceR * 1.05);
    ctx.quadraticCurveTo(0, faceR * 1.25, faceR * 0.5, faceR * 1.05);
    ctx.lineTo(faceR * 0.65, faceR * 1.45);
    ctx.lineTo(-faceR * 0.65, faceR * 1.45);
    ctx.closePath();
    ctx.fill();

    // Head silhouette (vector oval)
    const skinGrad = ctx.createLinearGradient(0, -faceR, 0, faceR);
    skinGrad.addColorStop(0, '#f7e0c7');
    skinGrad.addColorStop(0.55, '#f1cfa7');
    skinGrad.addColorStop(1, '#dcae7f');
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.moveTo(0, -faceR * 0.9);
    ctx.bezierCurveTo(faceR * 0.75, -faceR * 0.9, faceR * 0.9, faceR * 0.2, faceR * 0.85, faceR * 0.8);
    ctx.bezierCurveTo(faceR * 0.5, faceR * 1.1, -faceR * 0.5, faceR * 1.1, -faceR * 0.85, faceR * 0.8);
    ctx.bezierCurveTo(-faceR * 0.9, faceR * 0.2, -faceR * 0.75, -faceR * 0.9, 0, -faceR * 0.9);
    ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.18)';
    ctx.shadowBlur = faceR * 0.08;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Hair mass
    const hairGrad = ctx.createLinearGradient(-faceR, -faceR, faceR, faceR);
    hairGrad.addColorStop(0, '#3b2a1f');
    hairGrad.addColorStop(1, '#2a1e17');
    ctx.fillStyle = hairGrad;
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.85, -faceR * 0.35);
    ctx.bezierCurveTo(-faceR * 0.95, -faceR * 0.9, faceR * 0.95, -faceR * 0.95, faceR * 0.75, -faceR * 0.35);
    ctx.bezierCurveTo(faceR * 0.9, faceR * 0.4, faceR * 0.5, faceR * 0.2, faceR * 0.4, faceR * 0.15);
    ctx.bezierCurveTo(0, -faceR * 0.05, -faceR * 0.5, faceR * 0.1, -faceR * 0.65, faceR * 0.2);
    ctx.closePath();
    ctx.fill();

    // Hair highlight strokes
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = faceR * 0.05;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.45, -faceR * 0.5);
    ctx.quadraticCurveTo(-faceR * 0.25, -faceR * 0.7, faceR * 0.05, -faceR * 0.55);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(faceR * 0.2, -faceR * 0.55);
    ctx.quadraticCurveTo(faceR * 0.4, -faceR * 0.6, faceR * 0.6, -faceR * 0.4);
    ctx.stroke();

    // Cheeks (soft blush)
    const cheek = ctx.createRadialGradient(-faceR * 0.35, faceR * 0.15, faceR * 0.05, -faceR * 0.35, faceR * 0.15, faceR * 0.18);
    cheek.addColorStop(0, 'rgba(255,132,132,0.25)');
    cheek.addColorStop(1, 'rgba(255,132,132,0)');
    ctx.fillStyle = cheek;
    ctx.beginPath();
    ctx.arc(-faceR * 0.35, faceR * 0.15, faceR * 0.18, 0, Math.PI * 2);
    ctx.fill();
    const cheekR = ctx.createRadialGradient(faceR * 0.35, faceR * 0.15, faceR * 0.05, faceR * 0.35, faceR * 0.15, faceR * 0.18);
    cheekR.addColorStop(0, 'rgba(255,132,132,0.25)');
    cheekR.addColorStop(1, 'rgba(255,132,132,0)');
    ctx.fillStyle = cheekR;
    ctx.beginPath();
    ctx.arc(faceR * 0.35, faceR * 0.15, faceR * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    const eyeOffsetX = faceR * 0.38 + tiltY * faceR * 0.05;
    const eyeY = -faceR * 0.1 + tiltX * faceR * 0.05;
    const eyeR = faceR * 0.12;

    // Eyelid openness from 0..1
    const open = Math.max(0, Math.min(1, this.eyeOpenAmount));
    const lid = eyeR * (1 - open);

    ['left', 'right'].forEach((side, i) => {
        const ex = (i === 0 ? -eyeOffsetX : eyeOffsetX);
        ctx.save();
        ctx.translate(ex, eyeY);

        // Eye white with subtle shading
        const scleraGrad = ctx.createLinearGradient(-eyeR, -eyeR, eyeR, eyeR);
        scleraGrad.addColorStop(0, '#f6f7fb');
        scleraGrad.addColorStop(1, '#dfe3f0');
        ctx.fillStyle = scleraGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, eyeR * 1.05, eyeR * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Iris
        const irisR = eyeR * 0.6;
        const irisGrad = ctx.createRadialGradient(-irisR * 0.2, -irisR * 0.2, irisR * 0.4, 0, 0, irisR);
        irisGrad.addColorStop(0, '#4a7bb7');
        irisGrad.addColorStop(0.5, '#2e4f7b');
        irisGrad.addColorStop(1, '#16243c');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(0, 0, irisR, 0, Math.PI * 2);
        ctx.fill();

        // Pupil
        ctx.fillStyle = '#0c0c0c';
        ctx.beginPath();
        ctx.arc(0, 0, irisR * 0.45, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlight
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(-irisR * 0.25, -irisR * 0.35, irisR * 0.15, 0, Math.PI * 2);
        ctx.fill();

        // Eyelid overlay
        if (lid > 0) {
            ctx.fillStyle = skinGrad;
            ctx.beginPath();
            ctx.ellipse(0, -lid * (open < 0.5 ? 0.25 : 0.05), eyeR * 1.05, eyeR * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Brows
    ctx.strokeStyle = '#2c1b12';
    ctx.lineWidth = faceR * 0.07;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-eyeOffsetX - faceR * 0.1, eyeY - faceR * 0.28);
    ctx.quadraticCurveTo(-eyeOffsetX, eyeY - faceR * 0.35, -eyeOffsetX + faceR * 0.25, eyeY - faceR * 0.25);
    ctx.moveTo(eyeOffsetX - faceR * 0.25, eyeY - faceR * 0.25);
    ctx.quadraticCurveTo(eyeOffsetX, eyeY - faceR * 0.35, eyeOffsetX + faceR * 0.1, eyeY - faceR * 0.28);
    ctx.stroke();

    // Nose (vector shading)
    ctx.fillStyle = skinGrad;
    ctx.beginPath();
    ctx.moveTo(0, -faceR * 0.05);
    ctx.quadraticCurveTo(faceR * 0.1, faceR * 0.25, 0, faceR * 0.35);
    ctx.quadraticCurveTo(-faceR * 0.1, faceR * 0.25, 0, -faceR * 0.05);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = faceR * 0.01;
    ctx.beginPath();
    ctx.moveTo(-faceR * 0.05, faceR * 0.32);
    ctx.quadraticCurveTo(0, faceR * 0.38, faceR * 0.05, faceR * 0.32);
    ctx.stroke();

    // Lips & mouth interior
    const openAmt = Math.max(0, this.mouthOpenAmount);
    const mouthW = faceR * 0.65;
    const mouthH = faceR * 0.1 + openAmt * faceR * 0.22;
    const mouthY = faceR * 0.45;

    // Bottom lip shadow
    const lipShadow = ctx.createLinearGradient(0, mouthY, 0, mouthY + mouthH * 1.2);
    lipShadow.addColorStop(0, '#5a2c2c');
    lipShadow.addColorStop(1, '#2d1414');
    ctx.fillStyle = lipShadow;
    ctx.beginPath();
    ctx.moveTo(-mouthW / 2, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 1.1, mouthW / 2, mouthY);
    ctx.quadraticCurveTo(0, mouthY - mouthH * 0.25, -mouthW / 2, mouthY);
    ctx.fill();

    // Inner mouth
    const innerGrad = ctx.createLinearGradient(0, mouthY, 0, mouthY + mouthH * 1.6);
    innerGrad.addColorStop(0, '#2a0f0f');
    innerGrad.addColorStop(1, '#150707');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(-mouthW * 0.45, mouthY + mouthH * 0.05);
    ctx.quadraticCurveTo(0, mouthY + mouthH, mouthW * 0.45, mouthY + mouthH * 0.05);
    ctx.quadraticCurveTo(0, mouthY - mouthH * 0.2, -mouthW * 0.45, mouthY + mouthH * 0.05);
    ctx.fill();

    // Teeth bar
    ctx.fillStyle = '#f3f6fb';
    ctx.beginPath();
    ctx.moveTo(-mouthW * 0.4, mouthY + mouthH * 0.05);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 0.35, mouthW * 0.4, mouthY + mouthH * 0.05);
    ctx.quadraticCurveTo(0, mouthY - mouthH * 0.05, -mouthW * 0.4, mouthY + mouthH * 0.05);
    ctx.fill();

    // Upper lip
    const upperLip = ctx.createLinearGradient(0, mouthY - mouthH * 0.6, 0, mouthY + mouthH * 0.2);
    upperLip.addColorStop(0, '#b25b5b');
    upperLip.addColorStop(1, '#7d3d3d');
    ctx.fillStyle = upperLip;
    ctx.beginPath();
    ctx.moveTo(-mouthW / 2, mouthY);
    ctx.quadraticCurveTo(-mouthW * 0.25, mouthY - mouthH * 0.6, 0, mouthY - mouthH * 0.35);
    ctx.quadraticCurveTo(mouthW * 0.25, mouthY - mouthH * 0.6, mouthW / 2, mouthY);
    ctx.quadraticCurveTo(0, mouthY + mouthH * 0.15, -mouthW / 2, mouthY);
    ctx.fill();

    ctx.restore();
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedFace;
}
