// Enhanced Seimas Live Stream with OpenAI + Speaches Integration
class EnhancedSeimasLiveStream {
    constructor() {
        this.isPlaying = false;
        this.currentEventIndex = 0;
        this.speedMultiplier = 1;
        this.totalDuration = 180; // Default 3 hours
        this.currentTime = 0;
        this.intervalId = null;
        this.events = [];
        this.seimasMembers = [];
        this.sessionDirectoryHandle = null;
        this.animatedFace = null;
        this.audioDirectoryHandle = null;
        this.audioAssets = new Map();
        this.voiceAssignments = new Map();
        this.availableVoiceQueue = [];
        this.usedVoiceKeys = new Set();
        this.textToSpeechEnabled = false;
        this.currentAudioElement = null;
        this.audioPreparationPromise = null;
        this.lastTranscriptTimestamp = null;
        this.currentTranscriptData = null;
        this.currentSessionTimestamp = null;
        this.currentSessionStorageContext = null;
        this.loadedSessionDirectoryHandle = null;
        this.uploadedSessionMode = false;
        this.streamLiveFromTTS = false;
        this.livePlaybackBusy = false;
        this.liveStreamAbort = false;
        this.completedEventsCount = 0;
        this.audioGateActive = false;   // holds the timeline while stored audio plays
        this.audioGateToken = 0;        // invalidates stale gate-release handlers
        this.eventAudioPromises = new Map();
        this.pendingAudioCompletion = null;
        this.liveStreamGeneration = 0;
        this.voiceLibraries = {
            speaches: [
                { voice: 'af_heart', key: 'af_heart', label: 'Heart (US F)', rateMultiplier: 1 },
                { voice: 'af_alloy', key: 'af_alloy', label: 'Alloy (US F)', rateMultiplier: 1.03 },
                { voice: 'af_bella', key: 'af_bella', label: 'Bella (US F)', rateMultiplier: 0.97 },
                { voice: 'af_kore', key: 'af_kore', label: 'Kore (US F)', rateMultiplier: 1.05 },
                { voice: 'af_nicole', key: 'af_nicole', label: 'Nicole (US F)', rateMultiplier: 0.95 },
                { voice: 'af_river', key: 'af_river', label: 'River (US F)', rateMultiplier: 1.08 },
                { voice: 'af_sky', key: 'af_sky', label: 'Sky (US F)', rateMultiplier: 0.92 },
                { voice: 'af_nova', key: 'af_nova', label: 'Nova (US F)', rateMultiplier: 1.02 },
                { voice: 'am_adam', key: 'am_adam', label: 'Adam (US M)', rateMultiplier: 1 },
                { voice: 'am_echo', key: 'am_echo', label: 'Echo (US M)', rateMultiplier: 0.98 },
                { voice: 'am_eric', key: 'am_eric', label: 'Eric (US M)', rateMultiplier: 1.06 },
                { voice: 'am_liam', key: 'am_liam', label: 'Liam (US M)', rateMultiplier: 1.04 },
                { voice: 'am_michael', key: 'am_michael', label: 'Michael (US M)', rateMultiplier: 0.96 },
                { voice: 'am_onyx', key: 'am_onyx', label: 'Onyx (US M)', rateMultiplier: 1.1 },
                { voice: 'am_puck', key: 'am_puck', label: 'Puck (US M)', rateMultiplier: 0.94 },
                { voice: 'bf_alice', key: 'bf_alice', label: 'Alice (UK F)', rateMultiplier: 1.01 },
                { voice: 'bf_emma', key: 'bf_emma', label: 'Emma (UK F)', rateMultiplier: 0.93 },
                { voice: 'bf_isabella', key: 'bf_isabella', label: 'Isabella (UK F)', rateMultiplier: 1.07 },
                { voice: 'bm_daniel', key: 'bm_daniel', label: 'Daniel (UK M)', rateMultiplier: 1.02 },
                { voice: 'bm_fable', key: 'bm_fable', label: 'Fable (UK M)', rateMultiplier: 0.9 },
                { voice: 'bm_george', key: 'bm_george', label: 'George (UK M)', rateMultiplier: 1.09 },
                { voice: 'jm_kumo', key: 'jm_kumo', label: 'Kumo (JP M)', rateMultiplier: 1.05 },
                { voice: 'jf_alpha', key: 'jf_alpha', label: 'Alpha (JP F)', rateMultiplier: 0.95 },
                { voice: 'zf_xiaoxiao', key: 'zf_xiaoxiao', label: 'Xiaoxiao (ZH F)', rateMultiplier: 0.98 },
                { voice: 'zm_yunxi', key: 'zm_yunxi', label: 'Yunxi (ZH M)', rateMultiplier: 1.03 },
                { voice: 'ef_dora', key: 'ef_dora', label: 'Dora (ES F)', rateMultiplier: 1.05 },
                { voice: 'em_alex', key: 'em_alex', label: 'Alex (ES M)', rateMultiplier: 0.97 },
                { voice: 'ff_siwis', key: 'ff_siwis', label: 'Siwis (FR F)', rateMultiplier: 1.04 },
                { voice: 'if_sara', key: 'if_sara', label: 'Sara (IT F)', rateMultiplier: 0.99 },
                { voice: 'im_nicola', key: 'im_nicola', label: 'Nicola (IT M)', rateMultiplier: 1.08 },
                { voice: 'pf_dora', key: 'pf_dora', label: 'Dora (PT-BR F)', rateMultiplier: 0.96 },
                { voice: 'pm_alex', key: 'pm_alex', label: 'Alex (PT-BR M)', rateMultiplier: 1.06 }
            ],
            openai: [
                { voice: 'alloy', key: 'alloy', label: 'Alloy', rateMultiplier: 1 },
                { voice: 'echo', key: 'echo', label: 'Echo', rateMultiplier: 0.98 },
                { voice: 'fable', key: 'fable', label: 'Fable', rateMultiplier: 1.04 },
                { voice: 'onyx', key: 'onyx', label: 'Onyx', rateMultiplier: 1.08 },
                { voice: 'nova', key: 'nova', label: 'Nova', rateMultiplier: 0.96 },
                { voice: 'shimmer', key: 'shimmer', label: 'Shimmer', rateMultiplier: 1.02 },
                { voice: 'coral', key: 'coral', label: 'Coral', rateMultiplier: 0.94 },
                { voice: 'verse', key: 'verse', label: 'Verse', rateMultiplier: 1.06 },
                { voice: 'ballad', key: 'ballad', label: 'Ballad', rateMultiplier: 0.92 },
                { voice: 'ash', key: 'ash', label: 'Ash', rateMultiplier: 1.05 },
                { voice: 'sage', key: 'sage', label: 'Sage', rateMultiplier: 0.9 },
                { voice: 'marin', key: 'marin', label: 'Marin', rateMultiplier: 1.03 },
                { voice: 'cedar', key: 'cedar', label: 'Cedar', rateMultiplier: 1.07 }
            ],
            xai: [
                { voice: 'eve', key: 'eve', label: 'Eve (F)', rateMultiplier: 1 },
                { voice: 'ara', key: 'ara', label: 'Ara (F)', rateMultiplier: 1.05 },
                { voice: 'leo', key: 'leo', label: 'Leo (M)', rateMultiplier: 1 },
                { voice: 'rex', key: 'rex', label: 'Rex (M)', rateMultiplier: 0.96 },
                { voice: 'sal', key: 'sal', label: 'Sal (M)', rateMultiplier: 1.06 }
            ]
        };
        this.availableVoices = this.voiceLibraries.speaches.map(profile => ({ ...profile }));
        this.defaultSpeachesSettings = {
            baseUrl: 'http://localhost:8000/v1',
            modelId: 'speaches-ai/Kokoro-82M-v1.0-ONNX',
            responseFormat: 'mp3'
        };
        this.speachesSettings = { ...this.defaultSpeachesSettings };
        this.sessionLanguage = 'lt';
        this.generationMode = 'local';
        this.localGenerationSettings = {
            baseUrl: 'http://localhost:11434',
            model: 'qwen3:30b',
            temperature: 0.35,
            numPredict: -1,
            optionsJson: ''
        };
        this.remoteGenerationSettings = {
            baseUrl: 'https://api.openai.com/v1',
            transcriptModel: 'gpt-5.6-luna',
            maxOutputTokens: 100000,
            reasoningEffort: 'medium',
            requestOptionsJson: '',
            ttsBaseUrl: 'https://api.openai.com/v1',
            ttsModel: 'gpt-4o-mini-tts',
            ttsResponseFormat: 'mp3',
            ttsOptionsJson: ''
        };
        this.xaiGenerationSettings = {
            apiKey: '',
            baseUrl: 'https://api.x.ai/v1',
            transcriptModel: 'grok-4.7',
            maxOutputTokens: 100000,
            temperature: 0.4,
            requestOptionsJson: '',
            ttsBaseUrl: 'https://api.x.ai/v1',
            ttsLanguage: 'auto',
            ttsResponseFormat: 'mp3',
            ttsOptionsJson: ''
        };
        this.currentTTSOptions = null;
        this.unavailableLiveTTSProvider = null;

        this.initializeElements();
        this.initializeAnimatedFace();
        this.loadSeimasMembers();
        this.setupEventListeners();
        this.loadAPIKey();
        this.loadRemoteGenerationSettings();
        this.loadXaiGenerationSettings();
        this.loadTextToSpeechPreference();
        this.loadSessionLanguagePreference();
        this.loadSpeachesSettings();
        this.loadLocalGenerationSettings();
        this.loadGenerationMode();
        this.resetVoiceAssignments(this.getTextToSpeechProvider());
    }

    initializeElements() {
        // Main display elements
        this.speakerName = document.getElementById('speakerName');
        this.speakerTitle = document.getElementById('speakerTitle');
        this.speakerParty = document.getElementById('speakerParty');
        this.currentSpeech = document.getElementById('currentSpeech');
        this.updatesContainer = document.getElementById('updatesContainer');
        this.progressFill = document.getElementById('progressFill');
        this.timelineProgress = document.getElementById('timelineProgress');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.sessionTitle = document.getElementById('sessionTitle');
        this.sessionTopic = document.getElementById('sessionTopic');

        // Control elements
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.skipNextBtn = document.getElementById('skipNextBtn');
        this.speedSelector = document.getElementById('speedSelector');
        this.loadSessionBtn = document.getElementById('loadSessionBtn');
        this.loadSessionFolderBtn = document.getElementById('loadSessionFolderBtn');
        this.loadSessionInput = document.getElementById('loadSessionInput');
        if (this.speedSelector) {
            this.speedSelector.value = '1';
        }

        // Setup elements
        this.toggleSetupBtn = document.getElementById('toggleSetupBtn');
        this.setupPanel = document.getElementById('setupPanel');
        this.questionInput = document.getElementById('questionInput');
        this.apiKeyInput = document.getElementById('apiKeyInput');
        this.generateTranscriptBtn = document.getElementById('generateTranscriptBtn');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.textToSpeechCheckbox = document.getElementById('textToSpeechCheckbox');
        this.textToSpeechStatus = document.getElementById('textToSpeechStatus');
        this.sessionLanguageSelect = document.getElementById('sessionLanguageSelect');
        this.speachesBaseUrlInput = document.getElementById('speachesBaseUrlInput');
        this.speachesModelInput = document.getElementById('speachesModelInput');
        this.speachesFormatSelect = document.getElementById('speachesFormatSelect');
        this.generationModeToggle = document.getElementById('generationModeToggle');
        this.localConfigPanel = document.getElementById('localConfigPanel');
        this.remoteConfigPanel = document.getElementById('remoteConfigPanel');
        this.localOllamaBaseUrlInput = document.getElementById('localOllamaBaseUrlInput');
        this.localOllamaModelInput = document.getElementById('localOllamaModelInput');
        this.localOllamaTemperatureInput = document.getElementById('localOllamaTemperatureInput');
        this.localOllamaNumPredictInput = document.getElementById('localOllamaNumPredictInput');
        this.localOllamaOptionsInput = document.getElementById('localOllamaOptionsInput');
        this.openAIBaseUrlInput = document.getElementById('openAIBaseUrlInput');
        this.openAITranscriptModelInput = document.getElementById('openAITranscriptModelInput');
        this.openAIMaxOutputTokensInput = document.getElementById('openAIMaxOutputTokensInput');
        this.openAIReasoningEffortSelect = document.getElementById('openAIReasoningEffortSelect');
        this.openAITTSBaseUrlInput = document.getElementById('openAITTSBaseUrlInput');
        this.openAITTSModelInput = document.getElementById('openAITTSModelInput');
        this.openAITTSFormatSelect = document.getElementById('openAITTSFormatSelect');
        this.openAIRequestOptionsInput = document.getElementById('openAIRequestOptionsInput');
        this.openAITTSOptionsInput = document.getElementById('openAITTSOptionsInput');
        this.xaiConfigPanel = document.getElementById('xaiConfigPanel');
        this.xaiApiKeyInput = document.getElementById('xaiApiKeyInput');
        this.xaiBaseUrlInput = document.getElementById('xaiBaseUrlInput');
        this.xaiTranscriptModelInput = document.getElementById('xaiTranscriptModelInput');
        this.xaiMaxOutputTokensInput = document.getElementById('xaiMaxOutputTokensInput');
        this.xaiTemperatureInput = document.getElementById('xaiTemperatureInput');
        this.xaiRequestOptionsInput = document.getElementById('xaiRequestOptionsInput');
        this.xaiTTSBaseUrlInput = document.getElementById('xaiTTSBaseUrlInput');
        this.xaiTTSLanguageInput = document.getElementById('xaiTTSLanguageInput');
        this.xaiTTSFormatSelect = document.getElementById('xaiTTSFormatSelect');
        this.xaiTTSOptionsInput = document.getElementById('xaiTTSOptionsInput');

        // Settings modal elements
        this.settingsModal = document.getElementById('settingsModal');
        this.settingsModalOpenBtn = document.getElementById('settingsModalOpenBtn');
        this.settingsModalCloseBtn = document.getElementById('settingsModalCloseBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.settingsSaveStatus = document.getElementById('settingsSaveStatus');
        try {
            const savedQuestion = localStorage.getItem('seimas_session_question');
            if (savedQuestion !== null && this.questionInput) {
                this.questionInput.value = savedQuestion;
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti posėdžio temos:', error);
        }

        // Modal elements
        this.membersBtn = document.getElementById('membersBtn');
        this.membersModal = document.getElementById('membersModal');
        this.closeModal = document.getElementById('closeModal');
        this.membersGrid = document.getElementById('membersGrid');
        this.memberProfile = document.getElementById('memberProfile');
    }

    initializeAnimatedFace() {
        // Prefer the realistic, audio-driven talking head; fall back to the
        // legacy cartoon face only if the new module is unavailable.
        if (typeof RealisticFace !== 'undefined') {
            try {
                this.animatedFace = new RealisticFace('chambersView');
                console.log('RealisticFace initialized successfully');
                return;
            } catch (error) {
                console.error('Error initializing RealisticFace:', error);
            }
        }
        if (typeof AnimatedFace !== 'undefined') {
            try {
                this.animatedFace = new AnimatedFace('chambersView');
                console.log('AnimatedFace (legacy) initialized successfully');
            } catch (error) {
                console.error('Error initializing AnimatedFace:', error);
            }
        } else {
            console.warn('No face renderer found - face animation disabled');
        }
    }

    async loadSeimasMembers() {
        try {
            // Use embedded member data instead of HTTP requests
            if (typeof window.SEIMAS_MEMBERS_DATA !== 'undefined') {
                this.seimasMembers = window.SEIMAS_MEMBERS_DATA;
                console.log(`Loaded ${this.seimasMembers.length} Seimas members from embedded data`);
            } else {
                throw new Error('SEIMAS_MEMBERS_DATA not found');
            }
            
            this.populateMembersGrid();
        } catch (error) {
            console.error('Error loading Seimas members:', error);
            // Fallback to example members
            this.loadExampleMembers();
        }
    }




    loadExampleMembers() {
        // Fallback example members based on our created profiles
        this.seimasMembers = [
            {
                name: 'Saulius Skvernelis',
                party: 'DSVL',
                personality: 'Seimo pirmininkas ir politinis lyderis',
                goals: ['Užtikrinti sklandų parlamentinio darbo procesą', 'Formuoti konsensusą tarp skirtingų politinių jėgų', 'Stiprinti demokratinius institutus'],
                tone: 'Diplomatiškas, autoritetingas, pragmatiškas',
                abilities: ['Organizuoti parlamentinius procesus', 'Derinti frakcijų pozicijas', 'Priimti sprendimus sudėtingose situacijose']
            },
            {
                name: 'Ingrida Šimonytė',
                party: 'TS-LKD',
                personality: 'Buvusi ministrė pirmininkė ir ekonomikos ekspertė',
                goals: ['Formuoti atsakingą fiskalinę politiką', 'Stiprinti ekonominį konkurencingumą', 'Užtikrinti skaidrų valdymą'],
                tone: 'Analitiškas, profesionalus, faktais grįstas',
                abilities: ['Analizuoti ekonomikos problemas', 'Formuoti plėtros strategijas', 'Vadovauti reformoms']
            }
            // Add more example members as needed
        ];
        
        this.populateMembersGrid();
    }

    populateMembersGrid() {
        this.membersGrid.innerHTML = '';
        
        // Group members by party
        const partiesOrder = ['LSDP', 'TS-LKD', 'Nemuno aušra', 'DSVL', 'Liberalų sąjūdis', 'LVŽS', 'LLRA-KŠS', 'Nacionalinis susivienijimas', 'Laisvė ir teisingumas', 'Nepriklausomas'];
        const membersByParty = {};
        
        this.seimasMembers.forEach(member => {
            if (!membersByParty[member.party]) {
                membersByParty[member.party] = [];
            }
            membersByParty[member.party].push(member);
        });

        partiesOrder.forEach(party => {
            if (membersByParty[party]) {
                membersByParty[party].forEach(member => {
                    const memberCard = document.createElement('div');
                    memberCard.className = 'member-card';
                    memberCard.innerHTML = `
                        <div class="member-name">${member.name}</div>
                        <div class="member-party">${member.party}</div>
                        <div class="member-role">${member.personality}</div>
                    `;
                    
                    memberCard.addEventListener('click', () => this.showMemberProfile(member));
                    this.membersGrid.appendChild(memberCard);
                });
            }
        });
    }

    showMemberProfile(member) {
        this.memberProfile.innerHTML = `
            <h3>${member.name}</h3>
            <div class="profile-section">
                <h4>Partija</h4>
                <p>${member.party}</p>
            </div>
            <div class="profile-section">
                <h4>Asmenybė</h4>
                <p>${member.personality}</p>
            </div>
            <div class="profile-section">
                <h4>Tonas</h4>
                <p>${member.tone}</p>
            </div>
            <div class="profile-section">
                <h4>Tikslai</h4>
                <ul>
                    ${member.goals.map(goal => `<li>${goal}</li>`).join('')}
                </ul>
            </div>
            <div class="profile-section">
                <h4>Gebėjimai</h4>
                <ul>
                    ${member.abilities.map(ability => `<li>${ability}</li>`).join('')}
                </ul>
            </div>
            ${member.systemInstruction ? `
                <div class="profile-section">
                    <h4>Sistemos instrukcijos</h4>
                    <p>${member.systemInstruction}</p>
                </div>
            ` : ''}
        `;
        
    }

    setupEventListeners() {
        // Control buttons
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.restartBtn.addEventListener('click', () => this.restart());
        if (this.skipNextBtn) {
            this.skipNextBtn.addEventListener('click', () => this.skipToNextEvent());
        }
        this.speedSelector.addEventListener('change', (e) => {
            const newValue = parseFloat(e.target.value);
            if (Number.isNaN(newValue)) {
                return;
            }
            this.speedMultiplier = newValue;
            this.updateSpeedSelectorState();

            // Update animated face speech rate
            if (this.animatedFace) {
                this.animatedFace.setRate(this.speedMultiplier);
            }

            this.updateCurrentAudioPlaybackRate();

            if (this.isPlaying) {
                this.stopTimer();
                this.startTimer();
            }
        });

        // Setup panel
        this.toggleSetupBtn.addEventListener('click', () => this.toggleSetupPanel());
        this.generateTranscriptBtn.addEventListener('click', () => this.generateTranscript());

        // API key input
        this.apiKeyInput.addEventListener('input', () => this.saveAPIKey());
        if (this.sessionLanguageSelect) {
            this.sessionLanguageSelect.addEventListener('change', (e) => this.handleSessionLanguageChange(e.target.value));
        }
        if (this.generationModeToggle) {
            this.generationModeToggle.addEventListener('click', (event) => {
                const option = event.target.closest('.mode-option');
                if (!option) {
                    return;
                }
                const mode = option.getAttribute('data-mode');
                if (mode === 'local' || mode === 'remote' || mode === 'xai') {
                    this.handleGenerationModeChange(mode);
                }
            });
        }
        if (this.localOllamaBaseUrlInput) {
            this.localOllamaBaseUrlInput.addEventListener('input', (e) => this.handleLocalGenerationSettingsChange('baseUrl', e.target.value));
        }
        if (this.localOllamaModelInput) {
            this.localOllamaModelInput.addEventListener('input', (e) => this.handleLocalGenerationSettingsChange('model', e.target.value));
        }
        if (this.localOllamaTemperatureInput) {
            this.localOllamaTemperatureInput.addEventListener('input', (e) => this.handleLocalGenerationSettingsChange('temperature', e.target.value));
        }
        if (this.localOllamaNumPredictInput) {
            this.localOllamaNumPredictInput.addEventListener('input', (e) => this.handleLocalGenerationSettingsChange('numPredict', e.target.value));
        }
        if (this.localOllamaOptionsInput) {
            this.localOllamaOptionsInput.addEventListener('input', (e) => this.handleLocalGenerationSettingsChange('optionsJson', e.target.value));
        }
        if (this.openAIBaseUrlInput) {
            this.openAIBaseUrlInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('baseUrl', e.target.value));
        }
        if (this.openAITranscriptModelInput) {
            this.openAITranscriptModelInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('transcriptModel', e.target.value));
        }
        if (this.openAIMaxOutputTokensInput) {
            this.openAIMaxOutputTokensInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('maxOutputTokens', e.target.value));
        }
        if (this.openAIReasoningEffortSelect) {
            this.openAIReasoningEffortSelect.addEventListener('change', (e) => this.handleRemoteGenerationSettingsChange('reasoningEffort', e.target.value));
        }
        if (this.openAITTSBaseUrlInput) {
            this.openAITTSBaseUrlInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('ttsBaseUrl', e.target.value));
        }
        if (this.openAITTSModelInput) {
            this.openAITTSModelInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('ttsModel', e.target.value));
        }
        if (this.openAITTSFormatSelect) {
            this.openAITTSFormatSelect.addEventListener('change', (e) => this.handleRemoteGenerationSettingsChange('ttsResponseFormat', e.target.value));
        }
        if (this.openAIRequestOptionsInput) {
            this.openAIRequestOptionsInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('requestOptionsJson', e.target.value));
        }
        if (this.openAITTSOptionsInput) {
            this.openAITTSOptionsInput.addEventListener('input', (e) => this.handleRemoteGenerationSettingsChange('ttsOptionsJson', e.target.value));
        }
        if (this.xaiApiKeyInput) {
            this.xaiApiKeyInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('apiKey', e.target.value));
        }
        if (this.xaiBaseUrlInput) {
            this.xaiBaseUrlInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('baseUrl', e.target.value));
        }
        if (this.xaiTranscriptModelInput) {
            this.xaiTranscriptModelInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('transcriptModel', e.target.value));
        }
        if (this.xaiMaxOutputTokensInput) {
            this.xaiMaxOutputTokensInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('maxOutputTokens', e.target.value));
        }
        if (this.xaiTemperatureInput) {
            this.xaiTemperatureInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('temperature', e.target.value));
        }
        if (this.xaiRequestOptionsInput) {
            this.xaiRequestOptionsInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('requestOptionsJson', e.target.value));
        }
        if (this.xaiTTSBaseUrlInput) {
            this.xaiTTSBaseUrlInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('ttsBaseUrl', e.target.value));
        }
        if (this.xaiTTSLanguageInput) {
            this.xaiTTSLanguageInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('ttsLanguage', e.target.value));
        }
        if (this.xaiTTSFormatSelect) {
            this.xaiTTSFormatSelect.addEventListener('change', (e) => this.handleXaiGenerationSettingsChange('ttsResponseFormat', e.target.value));
        }
        if (this.xaiTTSOptionsInput) {
            this.xaiTTSOptionsInput.addEventListener('input', (e) => this.handleXaiGenerationSettingsChange('ttsOptionsJson', e.target.value));
        }
        if (this.speachesBaseUrlInput) {
            this.speachesBaseUrlInput.addEventListener('input', (e) => this.handleSpeachesSettingsChange('baseUrl', e.target.value));
        }
        if (this.speachesModelInput) {
            this.speachesModelInput.addEventListener('input', (e) => this.handleSpeachesSettingsChange('modelId', e.target.value));
        }
        if (this.speachesFormatSelect) {
            this.speachesFormatSelect.addEventListener('change', (e) => this.handleSpeachesSettingsChange('responseFormat', e.target.value));
        }

        if (this.textToSpeechCheckbox) {
            this.textToSpeechCheckbox.addEventListener('change', () => this.handleTextToSpeechToggle());
        }

        if (this.loadSessionBtn && this.loadSessionInput) {
            this.loadSessionBtn.addEventListener('click', () => {
                this.loadSessionInput.value = '';
                this.loadSessionInput.click();
            });

            this.loadSessionInput.addEventListener('change', (event) => {
                const file = event.target?.files?.[0];
                if (file) {
                    this.loadSessionFromFile(file);
                }
            });
        }
        
        if (this.loadSessionFolderBtn) {
            this.loadSessionFolderBtn.addEventListener('click', () => this.loadSessionFromDirectory());
        }

        // Export bundle (JSON + transcript + audio) as a ZIP
        const exportBtn = document.getElementById('exportSessionBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSessionBundle());
        }

        // Import session JSON + audio (multi-file or .zip), cross-browser
        const importBtn = document.getElementById('importBundleBtn');
        const importInput = document.getElementById('importBundleInput');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.value = '';
                importInput.click();
            });
            importInput.addEventListener('change', (event) => {
                const list = event.target?.files;
                if (list && list.length) this.importSessionFiles(list);
            });
        }

        // Tabbed right panel (Settings / Results / Stats / Live)
        const tabBar = document.getElementById('panelTabs');
        if (tabBar) {
            tabBar.addEventListener('click', (event) => {
                const btn = event.target.closest('[data-tab-btn]');
                if (!btn) return;
                const tab = btn.getAttribute('data-tab-btn');
                tabBar.querySelectorAll('[data-tab-btn]').forEach(b =>
                    b.classList.toggle('active', b === btn));
                document.querySelectorAll('[data-tab-panel]').forEach(panel =>
                    panel.classList.toggle('active', panel.getAttribute('data-tab-panel') === tab));
                if (tab === 'results' || tab === 'stats') this.refreshAnalytics();
            });
        }

        // Collapsible settings sections
        document.querySelectorAll('[data-accordion]').forEach(head => {
            head.addEventListener('click', () => {
                const section = head.closest('.settings-section');
                if (section) section.classList.toggle('collapsed');
            });
        });

        // Per-message audio download (delegated from the live updates stream)
        const updatesContainer = document.getElementById('updatesContainer');
        if (updatesContainer) {
            updatesContainer.addEventListener('click', (event) => {
                const dl = event.target.closest('[data-audio-index]');
                if (dl) this.downloadEventAudio(parseInt(dl.getAttribute('data-audio-index'), 10));
            });
        }

        // Modal
        this.membersBtn.addEventListener('click', () => this.showMembersModal());
        this.closeModal.addEventListener('click', () => this.hideMembersModal());
        this.membersModal.addEventListener('click', (e) => {
            if (e.target === this.membersModal) this.hideMembersModal();
        });

        // Settings modal (gear icon → modern modal over the session content)
        if (this.settingsModalOpenBtn) {
            this.settingsModalOpenBtn.addEventListener('click', () => this.showSettingsModal());
        }
        if (this.settingsModalCloseBtn) {
            this.settingsModalCloseBtn.addEventListener('click', () => this.hideSettingsModal());
        }
        if (this.saveSettingsBtn) {
            this.saveSettingsBtn.addEventListener('click', () => this.saveAllSettings());
        }
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) this.hideSettingsModal();
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.settingsModal?.classList.contains('active')) {
                this.hideSettingsModal();
            } else if (e.key === 'Escape' && this.membersModal?.classList.contains('active')) {
                this.hideMembersModal();
            }
        });

        // Collapse the right sidebar for a wide, distraction-free video stream
        const toggleSidebarBtn = document.getElementById('toggleSidebarBtn');
        if (toggleSidebarBtn) {
            toggleSidebarBtn.addEventListener('click', () => this.toggleSidebar());
        }
        this.loadSidebarPreference();

        // Timeline interaction
        const timelineTrack = document.getElementById('timelineTrack');
        timelineTrack.addEventListener('click', (e) => {
            if (this.streamLiveFromTTS) {
                this.updateTextToSpeechStatus('ℹ️ Realaus laiko srauto metu laiko juosta nėra aktyvi.', 'info');
                return;
            }
            this.seekToTime(e);
        });
    }

    toggleSetupPanel() {
        // Settings now live in a modal overlay; open it.
        this.showSettingsModal();
    }

    showSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('active');
            this.updateModalScrollLock();
        }
    }

    hideSettingsModal() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('active');
            this.updateModalScrollLock();
        }
    }

    updateModalScrollLock() {
        const hasOpenModal = Boolean(
            this.settingsModal?.classList.contains('active') ||
            this.membersModal?.classList.contains('active')
        );
        document.documentElement.classList.toggle('modal-open', hasOpenModal);
        document.body.classList.toggle('modal-open', hasOpenModal);
    }

    toggleSidebar(force) {
        const inner = document.getElementById('mainGrid') || document.querySelector('.main-grid');
        if (!inner) return;
        const collapsed = typeof force === 'boolean'
            ? force
            : !inner.classList.contains('sidebar-collapsed');
        inner.classList.toggle('sidebar-collapsed', collapsed);

        const btn = document.getElementById('toggleSidebarBtn');
        if (btn) {
            btn.classList.toggle('active', collapsed);
            btn.textContent = collapsed ? '◀ Rodyti skydelį' : '⛶ Platus vaizdas';
            btn.title = collapsed
                ? 'Rodyti šoninį skydelį (rezultatai, statistika, būsena)'
                : 'Paslėpti šoninį skydelį ir žiūrėti platų vaizdo srautą';
        }
        try {
            localStorage.setItem('seimas_sidebar_collapsed', collapsed ? 'true' : 'false');
        } catch (error) {
            console.warn('Nepavyko įrašyti šoninės juostos būsenos:', error);
        }
        // Let the talking-head canvas resize to the new width.
        window.dispatchEvent(new Event('resize'));
    }

    loadSidebarPreference() {
        let collapsed = false;
        try {
            collapsed = localStorage.getItem('seimas_sidebar_collapsed') === 'true';
        } catch (error) {
            console.warn('Nepavyko nuskaityti šoninės juostos būsenos:', error);
        }
        if (collapsed) {
            this.toggleSidebar(true);
        }
    }

    showMembersModal() {
        if (this.membersModal) {
            this.membersModal.classList.add('active');
            this.updateModalScrollLock();
        }
    }

    hideMembersModal() {
        if (this.membersModal) {
            this.membersModal.classList.remove('active');
            this.updateModalScrollLock();
        }
    }

    loadAPIKey() {
        const savedKey = localStorage.getItem('openai_api_key');
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }
    }

    saveAPIKey() {
        const apiKey = this.apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('openai_api_key', apiKey);
        } else {
            localStorage.removeItem('openai_api_key');
        }
    }

    saveAllSettings() {
        try {
            this.handleLocalGenerationSettingsChange('baseUrl', this.localOllamaBaseUrlInput?.value || '');
            this.handleLocalGenerationSettingsChange('model', this.localOllamaModelInput?.value || '');
            this.handleLocalGenerationSettingsChange('temperature', this.localOllamaTemperatureInput?.value || '');
            this.handleLocalGenerationSettingsChange('numPredict', this.localOllamaNumPredictInput?.value || '');
            this.handleLocalGenerationSettingsChange('optionsJson', this.localOllamaOptionsInput?.value || '');

            this.handleSpeachesSettingsChange('baseUrl', this.speachesBaseUrlInput?.value || '');
            this.handleSpeachesSettingsChange('modelId', this.speachesModelInput?.value || '');
            this.handleSpeachesSettingsChange('responseFormat', this.speachesFormatSelect?.value || 'mp3');

            this.saveAPIKey();
            this.handleRemoteGenerationSettingsChange('baseUrl', this.openAIBaseUrlInput?.value || '');
            this.handleRemoteGenerationSettingsChange('transcriptModel', this.openAITranscriptModelInput?.value || '');
            this.handleRemoteGenerationSettingsChange('maxOutputTokens', this.openAIMaxOutputTokensInput?.value || '');
            this.handleRemoteGenerationSettingsChange('reasoningEffort', this.openAIReasoningEffortSelect?.value || 'medium');
            this.handleRemoteGenerationSettingsChange('requestOptionsJson', this.openAIRequestOptionsInput?.value || '');
            this.handleRemoteGenerationSettingsChange('ttsBaseUrl', this.openAITTSBaseUrlInput?.value || '');
            this.handleRemoteGenerationSettingsChange('ttsModel', this.openAITTSModelInput?.value || '');
            this.handleRemoteGenerationSettingsChange('ttsResponseFormat', this.openAITTSFormatSelect?.value || 'mp3');
            this.handleRemoteGenerationSettingsChange('ttsOptionsJson', this.openAITTSOptionsInput?.value || '');

            this.handleXaiGenerationSettingsChange('apiKey', this.xaiApiKeyInput?.value || '');
            this.handleXaiGenerationSettingsChange('baseUrl', this.xaiBaseUrlInput?.value || '');
            this.handleXaiGenerationSettingsChange('transcriptModel', this.xaiTranscriptModelInput?.value || '');
            this.handleXaiGenerationSettingsChange('maxOutputTokens', this.xaiMaxOutputTokensInput?.value || '');
            this.handleXaiGenerationSettingsChange('temperature', this.xaiTemperatureInput?.value || '');
            this.handleXaiGenerationSettingsChange('requestOptionsJson', this.xaiRequestOptionsInput?.value || '');
            this.handleXaiGenerationSettingsChange('ttsBaseUrl', this.xaiTTSBaseUrlInput?.value || '');
            this.handleXaiGenerationSettingsChange('ttsLanguage', this.xaiTTSLanguageInput?.value || 'auto');
            this.handleXaiGenerationSettingsChange('ttsResponseFormat', this.xaiTTSFormatSelect?.value || 'mp3');
            this.handleXaiGenerationSettingsChange('ttsOptionsJson', this.xaiTTSOptionsInput?.value || '');

            this.saveGenerationMode();
            this.sessionLanguage = this.sessionLanguageSelect?.value === 'en' ? 'en' : 'lt';
            this.saveSessionLanguagePreference();
            localStorage.setItem('seimas_local_generation_settings', JSON.stringify(this.localGenerationSettings));
            localStorage.setItem('seimas_speaches_settings', JSON.stringify(this.speachesSettings));
            localStorage.setItem('seimas_remote_generation_settings', JSON.stringify(this.remoteGenerationSettings));
            localStorage.setItem('seimas_xai_generation_settings', JSON.stringify(this.xaiGenerationSettings));
            const openAiKey = this.apiKeyInput?.value?.trim();
            if (openAiKey) {
                localStorage.setItem('openai_api_key', openAiKey);
            } else {
                localStorage.removeItem('openai_api_key');
            }
            const xaiKey = this.xaiApiKeyInput?.value?.trim();
            if (xaiKey) {
                localStorage.setItem('xai_api_key', xaiKey);
            } else {
                localStorage.removeItem('xai_api_key');
            }
            localStorage.setItem('seimas_tts_enabled', this.textToSpeechCheckbox?.checked ? 'true' : 'false');
            if (this.questionInput) {
                localStorage.setItem('seimas_session_question', this.questionInput.value);
            }

            if (this.settingsSaveStatus) {
                this.settingsSaveStatus.textContent = 'Išsaugota šiame įrenginyje · Saved in this browser';
                this.settingsSaveStatus.classList.add('is-saved');
            }
        } catch (error) {
            console.error('Nepavyko išsaugoti nustatymų:', error);
            if (this.settingsSaveStatus) {
                this.settingsSaveStatus.textContent = 'Nepavyko išsaugoti · Save failed';
                this.settingsSaveStatus.classList.remove('is-saved');
            }
        }
    }

    loadRemoteGenerationSettings() {
        let migratedDefaultModel = false;
        try {
            const stored = localStorage.getItem('seimas_remote_generation_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Upgrade the app's previous built-in default while preserving custom model IDs.
                if (typeof parsed.transcriptModel === 'string' && parsed.transcriptModel.trim() === 'gpt-5-mini') {
                    parsed.transcriptModel = 'gpt-5.6-luna';
                    migratedDefaultModel = true;
                }
                this.remoteGenerationSettings = {
                    ...this.remoteGenerationSettings,
                    ...parsed
                };
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti OpenAI generavimo nustatymų:', error);
        }
        if (migratedDefaultModel) {
            this.saveRemoteGenerationSettings();
        }
        this.applyRemoteGenerationSettingsToInputs();
    }

    applyRemoteGenerationSettingsToInputs() {
        const settings = this.remoteGenerationSettings || {};
        if (this.openAIBaseUrlInput) {
            this.openAIBaseUrlInput.value = settings.baseUrl || 'https://api.openai.com/v1';
        }
        if (this.openAITranscriptModelInput) {
            this.openAITranscriptModelInput.value = settings.transcriptModel || 'gpt-5.6-luna';
        }
        if (this.openAIMaxOutputTokensInput) {
            this.openAIMaxOutputTokensInput.value = settings.maxOutputTokens || 100000;
        }
        if (this.openAIReasoningEffortSelect) {
            this.openAIReasoningEffortSelect.value = settings.reasoningEffort || 'medium';
        }
        if (this.openAITTSBaseUrlInput) {
            this.openAITTSBaseUrlInput.value = settings.ttsBaseUrl || settings.baseUrl || 'https://api.openai.com/v1';
        }
        if (this.openAITTSModelInput) {
            this.openAITTSModelInput.value = settings.ttsModel || 'gpt-4o-mini-tts';
        }
        if (this.openAITTSFormatSelect) {
            this.openAITTSFormatSelect.value = settings.ttsResponseFormat || 'mp3';
        }
        if (this.openAIRequestOptionsInput) {
            this.openAIRequestOptionsInput.value = settings.requestOptionsJson || '';
        }
        if (this.openAITTSOptionsInput) {
            this.openAITTSOptionsInput.value = settings.ttsOptionsJson || '';
        }
    }

    saveRemoteGenerationSettings() {
        try {
            localStorage.setItem('seimas_remote_generation_settings', JSON.stringify(this.remoteGenerationSettings));
        } catch (error) {
            console.warn('Nepavyko įrašyti OpenAI generavimo nustatymų:', error);
        }
    }

    handleRemoteGenerationSettingsChange(field, value) {
        if (!this.remoteGenerationSettings) {
            this.remoteGenerationSettings = {};
        }

        if (field === 'maxOutputTokens') {
            const parsed = Number(value);
            this.remoteGenerationSettings[field] = Number.isFinite(parsed) && parsed > 0 ? parsed : '';
        } else if (field === 'ttsResponseFormat') {
            this.remoteGenerationSettings[field] = typeof value === 'string' && value.trim()
                ? value.trim().toLowerCase()
                : 'mp3';
        } else {
            this.remoteGenerationSettings[field] = typeof value === 'string' ? value.trim() : value;
        }

        this.saveRemoteGenerationSettings();

        if (this.textToSpeechEnabled && ['ttsBaseUrl', 'ttsModel', 'ttsResponseFormat', 'ttsOptionsJson'].includes(field)) {
            this.updateTextToSpeechStatus(`⚙️ OpenAI TTS nustatymai atnaujinti (${this.getActiveOpenAITTSModelLabel()}).`, 'info');
        }
    }

    loadXaiGenerationSettings() {
        let migratedDefaultModel = false;
        try {
            const stored = localStorage.getItem('seimas_xai_generation_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                // Upgrade the app's previous built-in default while preserving custom model IDs.
                if (typeof parsed.transcriptModel === 'string' && parsed.transcriptModel.trim() === 'grok-4') {
                    parsed.transcriptModel = 'grok-4.7';
                    migratedDefaultModel = true;
                }
                this.xaiGenerationSettings = {
                    ...this.xaiGenerationSettings,
                    ...parsed
                };
            }
            // Back-compat: the xAI key may also live in its own slot.
            const storedKey = localStorage.getItem('xai_api_key');
            if (storedKey && !this.xaiGenerationSettings.apiKey) {
                this.xaiGenerationSettings.apiKey = storedKey;
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti xAI generavimo nustatymų:', error);
        }
        if (migratedDefaultModel) {
            this.saveXaiGenerationSettings();
        }
        this.applyXaiGenerationSettingsToInputs();
    }

    applyXaiGenerationSettingsToInputs() {
        const settings = this.xaiGenerationSettings || {};
        if (this.xaiApiKeyInput) {
            this.xaiApiKeyInput.value = settings.apiKey || '';
        }
        if (this.xaiBaseUrlInput) {
            this.xaiBaseUrlInput.value = settings.baseUrl || 'https://api.x.ai/v1';
        }
        if (this.xaiTranscriptModelInput) {
            this.xaiTranscriptModelInput.value = settings.transcriptModel || 'grok-4.7';
        }
        if (this.xaiMaxOutputTokensInput) {
            this.xaiMaxOutputTokensInput.value = settings.maxOutputTokens || 100000;
        }
        if (this.xaiTemperatureInput) {
            this.xaiTemperatureInput.value = settings.temperature ?? 0.4;
        }
        if (this.xaiRequestOptionsInput) {
            this.xaiRequestOptionsInput.value = settings.requestOptionsJson || '';
        }
        if (this.xaiTTSBaseUrlInput) {
            this.xaiTTSBaseUrlInput.value = settings.ttsBaseUrl || settings.baseUrl || 'https://api.x.ai/v1';
        }
        if (this.xaiTTSLanguageInput) {
            this.xaiTTSLanguageInput.value = settings.ttsLanguage || 'auto';
        }
        if (this.xaiTTSFormatSelect) {
            this.xaiTTSFormatSelect.value = settings.ttsResponseFormat || 'mp3';
        }
        if (this.xaiTTSOptionsInput) {
            this.xaiTTSOptionsInput.value = settings.ttsOptionsJson || '';
        }
    }

    saveXaiGenerationSettings() {
        try {
            localStorage.setItem('seimas_xai_generation_settings', JSON.stringify(this.xaiGenerationSettings));
            if (this.xaiGenerationSettings?.apiKey) {
                localStorage.setItem('xai_api_key', this.xaiGenerationSettings.apiKey);
            } else {
                localStorage.removeItem('xai_api_key');
            }
        } catch (error) {
            console.warn('Nepavyko įrašyti xAI generavimo nustatymų:', error);
        }
    }

    handleXaiGenerationSettingsChange(field, value) {
        if (!this.xaiGenerationSettings) {
            this.xaiGenerationSettings = {};
        }
        if (field === 'maxOutputTokens') {
            const parsed = Number(value);
            this.xaiGenerationSettings[field] = Number.isFinite(parsed) && parsed > 0 ? parsed : '';
        } else if (field === 'temperature') {
            this.xaiGenerationSettings[field] = this.parseOptionalNumber(value, this.xaiGenerationSettings[field], 0.4);
        } else if (field === 'ttsResponseFormat') {
            this.xaiGenerationSettings[field] = typeof value === 'string' && value.trim()
                ? value.trim().toLowerCase()
                : 'mp3';
        } else {
            this.xaiGenerationSettings[field] = typeof value === 'string' ? value.trim() : value;
        }
        this.saveXaiGenerationSettings();

        if (this.textToSpeechEnabled && this.getTextToSpeechProvider() === 'xai'
            && ['ttsBaseUrl', 'ttsLanguage', 'ttsResponseFormat', 'ttsOptionsJson'].includes(field)) {
            this.updateTextToSpeechStatus(`⚙️ xAI Grok TTS nustatymai atnaujinti.`, 'info');
        }
    }

    ensureXaiGenerationConfigured() {
        const apiKey = (this.xaiApiKeyInput?.value || this.xaiGenerationSettings?.apiKey || '').trim();
        const baseUrl = (this.xaiBaseUrlInput?.value || this.xaiGenerationSettings?.baseUrl || '').trim();
        const transcriptModel = (this.xaiTranscriptModelInput?.value || this.xaiGenerationSettings?.transcriptModel || '').trim();
        const ttsBaseUrl = (this.xaiTTSBaseUrlInput?.value || this.xaiGenerationSettings?.ttsBaseUrl || baseUrl).trim();
        const requestOptionsJson = this.xaiRequestOptionsInput?.value?.trim() || this.xaiGenerationSettings?.requestOptionsJson || '';
        const ttsOptionsJson = this.xaiTTSOptionsInput?.value?.trim() || this.xaiGenerationSettings?.ttsOptionsJson || '';

        if (!apiKey) {
            alert('Prašome įvesti xAI (Grok) API raktą.');
            return false;
        }
        if (!baseUrl || !transcriptModel) {
            alert('Prašome nurodyti xAI bazinį URL ir Grok modelį.');
            return false;
        }
        if (!this.parseJsonOptions(requestOptionsJson, 'Papildomi xAI Chat JSON nustatymai')) {
            return false;
        }
        if (this.textToSpeechEnabled && !ttsBaseUrl) {
            alert('Prašome nurodyti xAI TTS bazinį URL.');
            return false;
        }
        if (!this.parseJsonOptions(ttsOptionsJson, 'Papildomi xAI TTS JSON nustatymai')) {
            return false;
        }

        this.xaiGenerationSettings.apiKey = apiKey;
        this.xaiGenerationSettings.baseUrl = baseUrl;
        this.xaiGenerationSettings.transcriptModel = transcriptModel;
        this.xaiGenerationSettings.maxOutputTokens = this.parseOptionalNumber(
            this.xaiMaxOutputTokensInput?.value,
            this.xaiGenerationSettings.maxOutputTokens,
            100000
        );
        this.xaiGenerationSettings.temperature = this.parseOptionalNumber(
            this.xaiTemperatureInput?.value,
            this.xaiGenerationSettings.temperature,
            0.4
        );
        this.xaiGenerationSettings.requestOptionsJson = requestOptionsJson;
        this.xaiGenerationSettings.ttsBaseUrl = ttsBaseUrl;
        this.xaiGenerationSettings.ttsLanguage = (this.xaiTTSLanguageInput?.value || this.xaiGenerationSettings.ttsLanguage || 'auto').trim() || 'auto';
        this.xaiGenerationSettings.ttsResponseFormat = this.xaiTTSFormatSelect?.value || this.xaiGenerationSettings.ttsResponseFormat || 'mp3';
        this.xaiGenerationSettings.ttsOptionsJson = ttsOptionsJson;
        this.saveXaiGenerationSettings();
        return true;
    }

    getActiveXaiTranscriptModelLabel() {
        return this.xaiGenerationSettings?.transcriptModel?.trim() || 'grok-4.7';
    }

    loadSessionLanguagePreference() {
        let stored = null;
        try {
            stored = localStorage.getItem('seimas_session_language');
        } catch (error) {
            console.warn('Nepavyko nuskaityti kalbos nustatymo iš localStorage:', error);
        }
        this.sessionLanguage = stored === 'en' ? 'en' : 'lt';
        if (this.sessionLanguageSelect) {
            this.sessionLanguageSelect.value = this.sessionLanguage;
        }
    }

    saveSessionLanguagePreference() {
        try {
            localStorage.setItem('seimas_session_language', this.sessionLanguage);
        } catch (error) {
            console.warn('Nepavyko įrašyti kalbos nustatymo į localStorage:', error);
        }
    }

    handleSessionLanguageChange(value) {
        const nextValue = value === 'en' ? 'en' : 'lt';
        this.sessionLanguage = nextValue;
        if (this.sessionLanguageSelect && this.sessionLanguageSelect.value !== nextValue) {
            this.sessionLanguageSelect.value = nextValue;
        }
        this.saveSessionLanguagePreference();
        const statusNote = nextValue === 'en'
            ? 'Session language switched to English. Regenerate a transcript to apply the change.'
            : 'Sesijos kalba nustatyta į lietuvių. Sugeneruokite naują stenogramą, kad pritaikytumėte.';
        this.addLiveUpdate(this.formatTime(0), statusNote);
    }

    loadSpeachesSettings() {
        try {
            const stored = localStorage.getItem('seimas_speaches_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.speachesSettings = {
                    ...this.defaultSpeachesSettings,
                    ...parsed
                };
            } else {
                this.speachesSettings = { ...this.defaultSpeachesSettings };
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti Speaches nustatymų iš localStorage:', error);
            this.speachesSettings = { ...this.defaultSpeachesSettings };
        }
        this.applySpeachesSettingsToInputs();
    }

    applySpeachesSettingsToInputs() {
        const settings = this.speachesSettings || this.defaultSpeachesSettings;
        if (this.speachesBaseUrlInput && typeof settings.baseUrl === 'string') {
            this.speachesBaseUrlInput.value = settings.baseUrl;
        }
        if (this.speachesModelInput && typeof settings.modelId === 'string') {
            this.speachesModelInput.value = settings.modelId;
        }
        if (this.speachesFormatSelect && settings.responseFormat) {
            this.speachesFormatSelect.value = settings.responseFormat;
        }
    }

    handleSpeachesSettingsChange(field, value) {
        if (!this.speachesSettings) {
            this.speachesSettings = { ...this.defaultSpeachesSettings };
        }

        const cleanedValue = typeof value === 'string' ? value.trim() : value;
        if (cleanedValue) {
            const normalizedValue = field === 'responseFormat' && typeof cleanedValue === 'string'
                ? cleanedValue.toLowerCase()
                : cleanedValue;
            this.speachesSettings[field] = normalizedValue;
        } else if (field === 'responseFormat') {
            this.speachesSettings[field] = this.defaultSpeachesSettings.responseFormat;
        } else {
            this.speachesSettings[field] = '';
        }

        this.saveSpeachesSettings();
        this.unavailableLiveTTSProvider = null;

        if (this.textToSpeechEnabled) {
            this.updateTextToSpeechStatus(`⚙️ Speaches nustatymai atnaujinti (modelis: ${this.getActiveSpeachesModelLabel()}).`, 'info');
        }
    }

    saveSpeachesSettings() {
        try {
            localStorage.setItem('seimas_speaches_settings', JSON.stringify(this.speachesSettings));
        } catch (error) {
            console.warn('Nepavyko įrašyti Speaches nustatymų į localStorage:', error);
        }
    }

    ensureSpeachesConfigured() {
        const baseUrl = this.speachesSettings?.baseUrl?.trim();
        const modelId = this.speachesSettings?.modelId?.trim();
        if (!baseUrl || !modelId) {
            this.updateTextToSpeechStatus('⚠️ Nurodykite Speaches serverio URL ir modelio ID teksto į kalbą nustatymuose.', 'error');
            return false;
        }
        return true;
    }

    ensureLocalGenerationConfigured() {
        const baseUrl = (this.localOllamaBaseUrlInput?.value || this.localGenerationSettings?.baseUrl || '').trim();
        const model = (this.localOllamaModelInput?.value || this.localGenerationSettings?.model || '').trim();
        const optionsJson = this.localOllamaOptionsInput?.value?.trim() || this.localGenerationSettings?.optionsJson || '';

        if (!baseUrl || !model) {
            alert('Prašome nurodyti galiojantį Ollama API adresą ir modelio pavadinimą.');
            return false;
        }

        this.localGenerationSettings.baseUrl = baseUrl;
        this.localGenerationSettings.model = model;
        this.localGenerationSettings.temperature = this.parseOptionalNumber(
            this.localOllamaTemperatureInput?.value,
            this.localGenerationSettings.temperature,
            0.35
        );
        this.localGenerationSettings.numPredict = this.parseOptionalNumber(
            this.localOllamaNumPredictInput?.value,
            this.localGenerationSettings.numPredict,
            -1
        );
        this.localGenerationSettings.optionsJson = optionsJson;
        if (!this.parseJsonOptions(optionsJson, 'Papildomi Ollama options JSON')) {
            return false;
        }
        this.saveLocalGenerationSettings();
        return true;
    }

    ensureRemoteGenerationConfigured() {
        const apiKey = this.apiKeyInput?.value?.trim();
        const baseUrl = (this.openAIBaseUrlInput?.value || this.remoteGenerationSettings?.baseUrl || '').trim();
        const transcriptModel = (this.openAITranscriptModelInput?.value || this.remoteGenerationSettings?.transcriptModel || '').trim();
        const ttsBaseUrl = (this.openAITTSBaseUrlInput?.value || this.remoteGenerationSettings?.ttsBaseUrl || baseUrl).trim();
        const ttsModel = (this.openAITTSModelInput?.value || this.remoteGenerationSettings?.ttsModel || '').trim();
        const requestOptionsJson = this.openAIRequestOptionsInput?.value?.trim() || this.remoteGenerationSettings?.requestOptionsJson || '';
        const ttsOptionsJson = this.openAITTSOptionsInput?.value?.trim() || this.remoteGenerationSettings?.ttsOptionsJson || '';

        if (!apiKey) {
            alert('Prašome įvesti OpenAI arba suderinamo endpointo API raktą.');
            return false;
        }
        if (!baseUrl || !transcriptModel) {
            alert('Prašome nurodyti OpenAI Responses bazinį URL ir stenogramos modelį.');
            return false;
        }
        if (!this.parseJsonOptions(requestOptionsJson, 'Papildomi Responses API JSON nustatymai')) {
            return false;
        }
        if (this.textToSpeechEnabled && (!ttsBaseUrl || !ttsModel)) {
            alert('Prašome nurodyti OpenAI TTS bazinį URL ir TTS modelį.');
            return false;
        }
        if (!this.parseJsonOptions(ttsOptionsJson, 'Papildomi OpenAI TTS JSON nustatymai')) {
            return false;
        }

        this.remoteGenerationSettings.baseUrl = baseUrl;
        this.remoteGenerationSettings.transcriptModel = transcriptModel;
        this.remoteGenerationSettings.maxOutputTokens = this.parseOptionalNumber(
            this.openAIMaxOutputTokensInput?.value,
            this.remoteGenerationSettings.maxOutputTokens,
            100000
        );
        this.remoteGenerationSettings.reasoningEffort = this.openAIReasoningEffortSelect?.value || this.remoteGenerationSettings.reasoningEffort || 'medium';
        this.remoteGenerationSettings.requestOptionsJson = requestOptionsJson;
        this.remoteGenerationSettings.ttsBaseUrl = ttsBaseUrl;
        this.remoteGenerationSettings.ttsModel = ttsModel || this.remoteGenerationSettings.ttsModel;
        this.remoteGenerationSettings.ttsResponseFormat = this.openAITTSFormatSelect?.value || this.remoteGenerationSettings.ttsResponseFormat || 'mp3';
        this.remoteGenerationSettings.ttsOptionsJson = ttsOptionsJson;
        this.saveRemoteGenerationSettings();
        this.saveAPIKey();
        return true;
    }

    loadLocalGenerationSettings() {
        try {
            const stored = localStorage.getItem('seimas_local_generation_settings');
            if (stored) {
                const parsed = JSON.parse(stored);
                this.localGenerationSettings = {
                    ...this.localGenerationSettings,
                    ...parsed
                };
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti lokalaus generavimo nustatymų:', error);
        }

        if (this.localOllamaBaseUrlInput && this.localGenerationSettings.baseUrl) {
            this.localOllamaBaseUrlInput.value = this.localGenerationSettings.baseUrl;
        }
        if (this.localOllamaModelInput && this.localGenerationSettings.model) {
            this.localOllamaModelInput.value = this.localGenerationSettings.model;
        }
        if (this.localOllamaTemperatureInput) {
            this.localOllamaTemperatureInput.value = this.localGenerationSettings.temperature ?? 0.35;
        }
        if (this.localOllamaNumPredictInput) {
            this.localOllamaNumPredictInput.value = this.localGenerationSettings.numPredict ?? -1;
        }
        if (this.localOllamaOptionsInput) {
            this.localOllamaOptionsInput.value = this.localGenerationSettings.optionsJson || '';
        }
    }

    saveLocalGenerationSettings() {
        try {
            localStorage.setItem('seimas_local_generation_settings', JSON.stringify(this.localGenerationSettings));
        } catch (error) {
            console.warn('Nepavyko įrašyti lokalaus generavimo nustatymų:', error);
        }
    }

    handleLocalGenerationSettingsChange(field, value) {
        if (!this.localGenerationSettings) {
            this.localGenerationSettings = {};
        }
        if (field === 'temperature' || field === 'numPredict') {
            const fallback = field === 'temperature' ? 0.35 : -1;
            this.localGenerationSettings[field] = this.parseOptionalNumber(value, this.localGenerationSettings[field], fallback);
        } else {
            this.localGenerationSettings[field] = typeof value === 'string' ? value.trim() : value;
        }
        this.saveLocalGenerationSettings();
    }

    loadGenerationMode() {
        try {
            const stored = localStorage.getItem('seimas_generation_mode');
            if (stored === 'remote' || stored === 'local' || stored === 'xai' || stored === 'chatgpt') {
                this.generationMode = stored;
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti generavimo režimo:', error);
        }
        this.applyGenerationModeToUI();
    }

    saveGenerationMode() {
        try {
            localStorage.setItem('seimas_generation_mode', this.generationMode);
        } catch (error) {
            console.warn('Nepavyko įrašyti generavimo režimo:', error);
        }
    }

    applyGenerationModeToUI() {
        document.getElementById('chatgptConfigPanel')?.classList.toggle('hidden', this.generationMode !== 'chatgpt');
        if (this.generationModeToggle) {
            const buttons = this.generationModeToggle.querySelectorAll('.mode-option');
            buttons.forEach(button => {
                const mode = button.getAttribute('data-mode');
                button.classList.toggle('active', mode === this.generationMode);
            });
        }
        if (this.localConfigPanel) {
            this.localConfigPanel.classList.toggle('hidden', this.generationMode !== 'local');
        }
        if (this.remoteConfigPanel) {
            this.remoteConfigPanel.classList.toggle('hidden', this.generationMode !== 'remote');
        }
        if (this.xaiConfigPanel) {
            this.xaiConfigPanel.classList.toggle('hidden', this.generationMode !== 'xai');
        }
    }

    handleGenerationModeChange(mode) {
        if (mode !== 'local' && mode !== 'remote' && mode !== 'xai' && mode !== 'chatgpt') {
            return;
        }
        if (this.generationMode === mode) {
            return;
        }
        this.generationMode = mode;
        this.saveGenerationMode();
        this.applyGenerationModeToUI();
        this.currentTTSOptions = null;
        this.unavailableLiveTTSProvider = null;
        this.resetVoiceAssignments(this.getTextToSpeechProvider());
        const modeLabels = { remote: 'OpenAI debesų', xai: 'xAI (Grok)', local: 'lokalų' };
        this.updateTextToSpeechStatus(`🔁 Pereita į ${modeLabels[mode] || mode} režimą. Balsams bus naudojamas ${this.getTTSProviderLabel()}.`, 'info');
    }

    getTextToSpeechProvider(mode = this.generationMode) {
        if (mode === 'remote') return 'openai';
        if (mode === 'xai') return 'xai';
        return 'speaches';
    }

    buildDefaultTTSOptions(mode = this.generationMode) {
        const provider = this.getTextToSpeechProvider(mode);
        if (provider === 'openai') {
            return {
                provider: 'openai',
                apiKey: this.apiKeyInput?.value?.trim(),
                baseUrl: this.remoteGenerationSettings?.ttsBaseUrl || this.remoteGenerationSettings?.baseUrl,
                model: this.getActiveOpenAITTSModelLabel(),
                responseFormat: this.remoteGenerationSettings?.ttsResponseFormat || 'mp3',
                optionsJson: this.remoteGenerationSettings?.ttsOptionsJson || ''
            };
        }
        if (provider === 'xai') {
            return {
                provider: 'xai',
                apiKey: (this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey),
                baseUrl: this.xaiGenerationSettings?.ttsBaseUrl || this.xaiGenerationSettings?.baseUrl,
                language: this.xaiGenerationSettings?.ttsLanguage || 'auto',
                responseFormat: this.xaiGenerationSettings?.ttsResponseFormat || 'mp3',
                optionsJson: this.xaiGenerationSettings?.ttsOptionsJson || ''
            };
        }
        return {
            provider: 'speaches',
            baseUrl: this.speachesSettings?.baseUrl,
            model: this.speachesSettings?.modelId
        };
    }

    getTTSProviderLabel() {
        const provider = this.getTextToSpeechProvider();
        if (provider === 'openai') return `OpenAI (${this.getActiveOpenAITTSModelLabel()})`;
        if (provider === 'xai') return 'xAI Grok TTS';
        return `Speaches (${this.getActiveSpeachesModelLabel()})`;
    }

    providerDisplayName(provider = this.getTextToSpeechProvider()) {
        return { openai: 'OpenAI', xai: 'xAI Grok', speaches: 'Speaches' }[provider] || provider;
    }

    getActiveSpeachesModelLabel() {
        return this.speachesSettings?.modelId?.trim() || this.defaultSpeachesSettings.modelId;
    }

    getActiveOpenAITranscriptModelLabel() {
        return this.remoteGenerationSettings?.transcriptModel?.trim() || 'gpt-5.6-luna';
    }

    getActiveOpenAITTSModelLabel() {
        return this.remoteGenerationSettings?.ttsModel?.trim() || 'gpt-4o-mini-tts';
    }

    parseOptionalNumber(value, currentValue, fallbackValue) {
        if (value === '' || value === null || typeof value === 'undefined') {
            return fallbackValue;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : currentValue ?? fallbackValue;
    }

    parseJsonOptions(rawValue, label) {
        const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
        if (!trimmed) {
            return {};
        }
        try {
            const parsed = JSON.parse(trimmed);
            if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
                throw new Error('JSON turi būti objektas');
            }
            return parsed;
        } catch (error) {
            alert(`${label} neteisingas: ${error.message}`);
            return null;
        }
    }

    mergeOptions(baseOptions, overrideOptions, protectedKeys = []) {
        const merged = { ...(baseOptions || {}) };
        Object.entries(overrideOptions || {}).forEach(([key, value]) => {
            if (protectedKeys.includes(key)) {
                return;
            }
            if (value === null) {
                delete merged[key];
            } else {
                merged[key] = value;
            }
        });
        return merged;
    }

    getOpenAIEndpoint(path, baseUrl = null) {
        const root = this.normalizeBaseUrl(baseUrl || this.remoteGenerationSettings?.baseUrl || 'https://api.openai.com/v1');
        return `${root}/${path.replace(/^\/+/, '')}`;
    }

    normalizeBaseUrl(url) {
        if (!url) {
            return '';
        }
        const trimmed = url.trim();
        const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
        return withProtocol.replace(/\/+$/, '');
    }

    getSpeachesEndpoint(path = '') {
        const rawBase = this.speachesSettings?.baseUrl?.trim();
        if (!rawBase) {
            throw new Error('Speaches serverio URL nenurodytas.');
        }

        const normalizedBase = this.normalizeBaseUrl(rawBase);
        const normalizedPath = path ? `/${path.replace(/^\/+/, '')}` : '';
        return `${normalizedBase}${normalizedPath}`;
    }

    getSpeachesMimeType() {
        const format = (this.speachesSettings?.responseFormat || 'mp3').toLowerCase();
        if (format === 'wav') {
            return 'audio/wav';
        }
        if (format === 'ogg' || format === 'oga' || format === 'vorbis') {
            return 'audio/ogg';
        }
        if (format === 'flac') {
            return 'audio/flac';
        }
        return 'audio/mpeg';
    }

    getSpeachesFileExtension() {
        const format = (this.speachesSettings?.responseFormat || 'mp3').toLowerCase();
        if (format === 'wav') {
            return 'wav';
        }
        if (format === 'ogg' || format === 'oga' || format === 'vorbis') {
            return 'ogg';
        }
        if (format === 'flac') {
            return 'flac';
        }
        return 'mp3';
    }

    async requestSpeechFromOpenAI(text, voiceProfile, providerOptions = {}) {
        const extraOptions = this.parseJsonOptions(
            providerOptions.optionsJson ?? this.remoteGenerationSettings?.ttsOptionsJson,
            'Papildomi OpenAI TTS JSON nustatymai'
        );
        if (!extraOptions) {
            throw new Error('OpenAI TTS nustatymai turi neteisingą JSON.');
        }

        let payload = this.mergeOptions({
            model: providerOptions.model || this.getActiveOpenAITTSModelLabel(),
            voice: voiceProfile.voice,
            input: text
        }, extraOptions, ['model', 'voice', 'input']);

        if (voiceProfile.style) {
            payload.style = voiceProfile.style;
        }
        if (voiceProfile.rateMultiplier && voiceProfile.rateMultiplier !== 1) {
            payload.speed = Number(voiceProfile.rateMultiplier.toFixed(2));
        }

        const responseFormat = providerOptions.responseFormat || this.remoteGenerationSettings?.ttsResponseFormat || 'mp3';
        if (responseFormat && responseFormat.toLowerCase() !== 'mp3') {
            payload.response_format = responseFormat.toLowerCase();
        }

        const endpoint = this.getOpenAIEndpoint('audio/speech', providerOptions.baseUrl || this.remoteGenerationSettings?.ttsBaseUrl);
        const headers = {
            'Content-Type': 'application/json'
        };
        const apiKey = providerOptions.apiKey || this.apiKeyInput?.value?.trim();
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || 'OpenAI TTS API klaida');
        }

        const arrayBuffer = await response.arrayBuffer();
        return new Blob([arrayBuffer], { type: response.headers.get('Content-Type') || `audio/${responseFormat || 'mpeg'}` });
    }

    async requestSpeechFromXai(text, voiceProfile, providerOptions = {}) {
        const extraOptions = this.parseJsonOptions(
            providerOptions.optionsJson ?? this.xaiGenerationSettings?.ttsOptionsJson,
            'Papildomi xAI TTS JSON nustatymai'
        );
        if (!extraOptions) {
            throw new Error('xAI TTS nustatymai turi neteisingą JSON.');
        }

        const responseFormat = (providerOptions.responseFormat || this.xaiGenerationSettings?.ttsResponseFormat || 'mp3').toLowerCase();
        // xAI /v1/tts uses an output_format object with a codec (mp3, wav, pcm, mulaw, alaw).
        const codec = responseFormat === 'mpeg' ? 'mp3' : responseFormat;
        const language = providerOptions.language || this.xaiGenerationSettings?.ttsLanguage || 'auto';

        const payload = this.mergeOptions({
            text,
            voice_id: voiceProfile.voice || 'eve',
            language,
            output_format: { codec },
            speed: voiceProfile.rateMultiplier && voiceProfile.rateMultiplier !== 1
                ? Number(voiceProfile.rateMultiplier.toFixed(2))
                : 1
        }, extraOptions, ['text', 'voice_id']);

        const baseUrl = this.normalizeBaseUrl(providerOptions.baseUrl || this.xaiGenerationSettings?.ttsBaseUrl || this.xaiGenerationSettings?.baseUrl || 'https://api.x.ai/v1');
        const endpoint = `${baseUrl}/tts`;
        const headers = { 'Content-Type': 'application/json' };
        const apiKey = providerOptions.apiKey || this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey;
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || error.message || 'xAI TTS API klaida');
        }

        const arrayBuffer = await response.arrayBuffer();
        const mimeByCodec = { mp3: 'audio/mpeg', wav: 'audio/wav', pcm: 'audio/L16', mulaw: 'audio/basic', alaw: 'audio/basic' };
        return new Blob([arrayBuffer], { type: response.headers.get('Content-Type') || mimeByCodec[codec] || 'audio/mpeg' });
    }

    loadTextToSpeechPreference() {
        if (!this.textToSpeechCheckbox) {
            return;
        }

        try {
            const savedPreference = localStorage.getItem('seimas_tts_enabled');
            const isEnabled = savedPreference === 'true';
            this.textToSpeechCheckbox.checked = isEnabled;
            this.textToSpeechEnabled = isEnabled;

            if (isEnabled) {
                this.updateTextToSpeechStatus(`🔊 Teksto į kalbą funkcija aktyvuota. Naudojamas ${this.getTTSProviderLabel()}.`, 'success');
            } else {
                this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta. Įjunkite ją, jei norite girdėti posėdį.', 'info');
            }
        } catch (error) {
            console.warn('Nepavyko nuskaityti TTS nustatymo iš localStorage:', error);
            this.textToSpeechCheckbox.checked = false;
            this.textToSpeechEnabled = false;
            this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta.', 'info');
        }

        this.updateSpeedSelectorState();
    }

    async handleTextToSpeechToggle() {
        if (!this.textToSpeechCheckbox) {
            return;
        }

        this.textToSpeechEnabled = this.textToSpeechCheckbox.checked;
        this.unavailableLiveTTSProvider = null;
        try {
            localStorage.setItem('seimas_tts_enabled', this.textToSpeechEnabled ? 'true' : 'false');
        } catch (error) {
            console.warn('Nepavyko išsaugoti TTS nustatymo į localStorage:', error);
        }

        if (this.textToSpeechEnabled) {
            const provider = this.getTextToSpeechProvider();
            if (provider === 'openai') {
                const apiKey = this.apiKeyInput?.value?.trim();
                if (!apiKey) {
                    alert('Įveskite OpenAI arba suderinamo endpointo API raktą, kad būtų galima generuoti balsus.');
                    this.textToSpeechCheckbox.checked = false;
                    this.textToSpeechEnabled = false;
                    localStorage.setItem('seimas_tts_enabled', 'false');
                    return;
                }
            } else if (provider === 'xai') {
                const apiKey = this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey;
                if (!apiKey) {
                    alert('Įveskite xAI (Grok) API raktą, kad būtų galima generuoti balsus.');
                    this.textToSpeechCheckbox.checked = false;
                    this.textToSpeechEnabled = false;
                    localStorage.setItem('seimas_tts_enabled', 'false');
                    return;
                }
            } else if (!this.ensureSpeachesConfigured()) {
                this.textToSpeechEnabled = false;
                this.textToSpeechCheckbox.checked = false;
                try {
                    localStorage.setItem('seimas_tts_enabled', 'false');
                } catch (storageError) {
                    console.warn('Nepavyko atnaujinti TTS nustatymo po klaidos:', storageError);
                }
                return;
            }

            const providerLabel = this.getTTSProviderLabel();
            this.updateTextToSpeechStatus(`🔊 Teksto į kalbą funkcija aktyvuota. Naudojamas ${providerLabel}.`, 'success');

            if (this.events.length > 0) {
                if (this.streamLiveFromTTS) {
                    this.updateTextToSpeechStatus(`🔄 ${providerLabel} generuos balsus realiu laiku. Spauskite „Paleisti“, kad pradėtumėte.`, 'processing');
                    return;
                }

                const timestamp = this.lastTranscriptTimestamp || new Date();
                const transcriptInfo = {
                    title: this.sessionTitle?.textContent,
                    topic: this.sessionTopic?.textContent,
                    events: this.events
                };
                let storageContext = this.currentSessionStorageContext;
                if (!storageContext) {
                    try {
                        storageContext = await this.prepareSessionStorageContext(transcriptInfo, timestamp);
                        if (storageContext) {
                            this.currentSessionStorageContext = storageContext;
                        }
                    } catch (contextError) {
                        console.warn('Nepavyko paruošti sesijos aplanko TTS generavimui:', contextError);
                    }
                }

                const ttsOptions = this.buildDefaultTTSOptions();
                this.currentTTSOptions = ttsOptions;
                this.resetVoiceAssignments(ttsOptions.provider || provider);

                this.prepareTextToSpeechAssets(transcriptInfo, timestamp, storageContext, ttsOptions).catch(error => {
                    console.error('TTS preparation failed on toggle:', error);
                });
            }
        } else {
            this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta.', 'info');
            this.stopCurrentAudio();
        }

        this.updateSpeedSelectorState();
    }

    updateTextToSpeechStatus(message, variant = 'info') {
        if (!this.textToSpeechStatus) {
            return;
        }

        this.textToSpeechStatus.textContent = message;
        this.textToSpeechStatus.classList.remove('success', 'error', 'processing');

        if (variant === 'success') {
            this.textToSpeechStatus.classList.add('success');
        } else if (variant === 'error') {
            this.textToSpeechStatus.classList.add('error');
        } else if (variant === 'processing') {
            this.textToSpeechStatus.classList.add('processing');
        }
    }

    updateSpeedSelectorState() {
        if (!this.speedSelector) {
            return;
        }

        this.speedSelector.disabled = false;
        const desiredValue = String(this.speedMultiplier ?? 1);
        if (this.speedSelector.value !== desiredValue) {
            this.speedSelector.value = desiredValue;
        }
    }

    resetVoiceAssignments(provider = this.getTextToSpeechProvider()) {
        this.voiceAssignments.clear();
        this.usedVoiceKeys.clear();
        const library = this.voiceLibraries[provider] || [];
        this.availableVoices = library.map(profile => ({ ...profile }));
        this.availableVoiceQueue = this.availableVoices.map(profile => ({ ...profile }));
    }

    createDerivedVoiceProfile(index, provider = this.getTextToSpeechProvider(), desiredGender = 'm') {
        const variantIndex = index + 1;
        const rateMultiplier = 1 + (variantIndex % 6) * 0.035;
        const library = this.voiceLibraries[provider] || [];
        // Reuse a base voice that matches the requested gender so the timbre stays correct.
        const gendered = library.filter(v => this.voiceGender(v.voice) === desiredGender);
        const pool = gendered.length ? gendered : library;
        const fallbackVoiceByProvider = {
            openai: desiredGender === 'f' ? 'nova' : 'onyx',
            xai: desiredGender === 'f' ? 'eve' : 'leo',
            speaches: desiredGender === 'f' ? 'af_heart' : 'am_adam'
        };
        const base = pool[variantIndex % pool.length] || pool[0] || {
            voice: fallbackVoiceByProvider[provider] || fallbackVoiceByProvider.speaches
        };
        const providerLabel = { openai: 'OpenAI', xai: 'xAI', speaches: 'Speaches' }[provider] || provider;
        return {
            voice: base.voice,
            key: `${provider}-${desiredGender}-variant-${variantIndex}`,
            label: `${providerLabel} ${desiredGender === 'f' ? 'F' : 'M'} variant ${variantIndex}`,
            rateMultiplier,
            gender: desiredGender
        };
    }

    // Map a voice id to a gender: 'f' | 'm' | 'n' (neutral).
    voiceGender(voiceId) {
        const v = (voiceId || '').toLowerCase();
        // Speaches Kokoro voices encode gender: <lang>f_ = female, <lang>m_ = male.
        const m = v.match(/^[a-z](f|m)_/);
        if (m) return m[1];
        // OpenAI voices (best-effort by timbre).
        if (['nova', 'shimmer', 'coral', 'sage', 'marin', 'ballad'].includes(v)) return 'f';
        if (['echo', 'onyx', 'ash', 'verse', 'cedar', 'fable'].includes(v)) return 'm';
        // xAI Grok voices.
        if (['eve', 'ara'].includes(v)) return 'f';
        if (['leo', 'rex', 'sal'].includes(v)) return 'm';
        return 'n'; // alloy and unknowns: neutral
    }

    // Infer a speaker's gender from member metadata, then Lithuanian name endings.
    genderForSpeaker(speakerName) {
        const member = (this.seimasMembers || []).find(m => m && m.name === speakerName);
        if (member) {
            const txt = `${member.systemInstruction || ''} ${member.personality || ''} ${member.tone || ''}`;
            if (/\b(narė|ministrė|pirmininkė|vadovė|atstovė|deputatė|kandidatė|seniūnė)\b/i.test(txt)) return 'f';
            if (/\b(narys|ministras|pirmininkas|vadovas|atstovas|deputatas|kandidatas|seniūnas)\b/i.test(txt)) return 'm';
        }
        return this.inferGenderFromName(speakerName);
    }

    inferGenderFromName(name) {
        const n = (name || '').trim().toLowerCase();
        if (!n) return 'm';
        const parts = n.split(/\s+/);
        const first = parts[0];
        const last = parts[parts.length - 1];
        // Female surname suffixes are unambiguous in Lithuanian.
        if (/(ienė|aitė|ytė|utė|ūtė|iūtė)$/.test(last)) return 'f';
        // Male given-name endings.
        if (/(as|is|us|ius|ys|jus)$/.test(first)) return 'm';
        // Female given-name endings.
        if (/(a|ė)$/.test(first)) return 'f';
        return /(a|ė)$/.test(last) ? 'f' : 'm';
    }

    getVoiceForSpeaker(speakerName) {
        const provider = this.currentTTSOptions?.provider || this.getTextToSpeechProvider();
        if (this.voiceAssignments.has(speakerName)) {
            return this.voiceAssignments.get(speakerName);
        }

        const desired = this.genderForSpeaker(speakerName);
        let assignedProfile = null;
        const isFree = c => !this.usedVoiceKeys.has(c.key || c.voice);

        // 1) Prefer an unused voice that matches the speaker's gender.
        let idx = this.availableVoiceQueue.findIndex(c => isFree(c) && this.voiceGender(c.voice) === desired);
        // 2) Otherwise accept a neutral voice (never the opposite gender).
        if (idx === -1) {
            idx = this.availableVoiceQueue.findIndex(c => isFree(c) && this.voiceGender(c.voice) === 'n');
        }
        if (idx !== -1) {
            const candidate = this.availableVoiceQueue.splice(idx, 1)[0];
            assignedProfile = { ...candidate, gender: desired, rateMultiplier: candidate.rateMultiplier || 1 };
            this.usedVoiceKeys.add(candidate.key || candidate.voice);
        }

        // 3) Ran out of matching voices: derive a fresh one of the correct gender.
        if (!assignedProfile) {
            assignedProfile = this.createDerivedVoiceProfile(this.voiceAssignments.size, provider, desired);
            this.usedVoiceKeys.add(assignedProfile.key);
        }

        this.voiceAssignments.set(speakerName, assignedProfile);
        return assignedProfile;
    }

    clearAudioAssets() {
        this.stopCurrentAudio();
        this.audioAssets.forEach(asset => {
            if (asset?.element) {
                asset.element.pause();
            }
            if (asset?.url) {
                try {
                    URL.revokeObjectURL(asset.url);
                } catch (error) {
                    console.warn('Failed to revoke audio URL:', error);
                }
            }
        });
        this.audioAssets.clear();
        this.eventAudioPromises.clear();
        this.pendingAudioCompletion = null;
    }

    stopCurrentAudio() {
        if (this.currentAudioElement) {
            try {
                this.currentAudioElement.pause();
                this.currentAudioElement.currentTime = 0;
            } catch (error) {
                console.warn('Failed to stop audio element:', error);
            }
        }
        this.currentAudioElement = null;
        if (typeof this.pendingAudioCompletion === 'function') {
            const resolver = this.pendingAudioCompletion;
            this.pendingAudioCompletion = null;
            resolver();
        }
        if (this.animatedFace && typeof this.animatedFace.detachExternalAudio === 'function') {
            this.animatedFace.detachExternalAudio();
        }
    }

    updateCurrentAudioPlaybackRate() {
        if (!this.textToSpeechEnabled || !this.currentAudioElement) {
            return;
        }

        const lastIndex = Math.max(0, this.currentEventIndex - 1);
        const asset = this.audioAssets.get(lastIndex);
        if (asset && this.currentAudioElement) {
            const baseRate = asset.basePlaybackRate || 1;
            const rateMultiplier = this.speedMultiplier || 1;
            this.currentAudioElement.playbackRate = baseRate * rateMultiplier;
        }
    }

    async prepareTextToSpeechAssets(transcriptData, timestamp, storageContext = null, ttsOptions = null) {
        if (typeof window === 'undefined' || !this.textToSpeechEnabled) {
            return null;
        }

        const options = ttsOptions || this.buildDefaultTTSOptions();
        const provider = options?.provider || this.getTextToSpeechProvider();

        if (provider === 'speaches' && !this.ensureSpeachesConfigured()) {
            return null;
        }
        if (provider === 'openai' && !options?.apiKey) {
            this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI arba suderinamo endpointo API raktą teksto į kalbą generavimui.', 'error');
            return null;
        }
        if (provider === 'xai' && !options?.apiKey) {
            this.updateTextToSpeechStatus('⚠️ Įveskite xAI (Grok) API raktą teksto į kalbą generavimui.', 'error');
            return null;
        }

        if (this.audioPreparationPromise) {
            return this.audioPreparationPromise;
        }

        this.audioPreparationPromise = this._prepareTextToSpeechAssets(transcriptData, timestamp, storageContext, options);
        try {
            return await this.audioPreparationPromise;
        } finally {
            this.audioPreparationPromise = null;
        }
    }

    async _prepareTextToSpeechAssets(transcriptData, timestamp, storageContext = null, ttsOptions = {}) {
        try {
            const events = Array.isArray(transcriptData?.events) ? transcriptData.events : [];
            if (events.length === 0) {
                this.updateTextToSpeechStatus('🔇 Nėra įvykių, kuriuos būtų galima paversti garsu.', 'info');
                return null;
            }

            const provider = ttsOptions?.provider || this.getTextToSpeechProvider();
            const modelLabel = provider === 'openai'
                ? (ttsOptions?.model || this.getActiveOpenAITTSModelLabel())
                : provider === 'xai'
                    ? 'grok-tts'
                    : this.getActiveSpeachesModelLabel();
            const responseFormat = provider === 'speaches'
                ? (this.speachesSettings?.responseFormat || 'mp3').toLowerCase()
                : provider === 'xai'
                    ? (ttsOptions?.responseFormat || this.xaiGenerationSettings?.ttsResponseFormat || 'mp3').toLowerCase()
                    : (ttsOptions?.responseFormat || this.remoteGenerationSettings?.ttsResponseFormat || 'mp3').toLowerCase();

            this.updateTextToSpeechStatus(`🔄 Generuojami balsai (${this.getTTSProviderLabel()})...`, 'processing');

            this.clearAudioAssets();
            this.resetVoiceAssignments(provider);

            const preparationTimestamp = timestamp instanceof Date ? timestamp : new Date();
            this.lastTranscriptTimestamp = preparationTimestamp;

            const mapping = [];
            const errors = [];
            const audioDirectoryDetails = { path: null, folderName: null };

            let directoryHandle = storageContext?.sessionFolderHandle || null;
            let audioDirectoryHandle = storageContext?.audioFolderHandle || null;
            let sessionFolderName = storageContext?.folderName || null;

            if (!directoryHandle && window.isSecureContext && typeof window.showDirectoryPicker === 'function') {
                try {
                    const preparedContext = await this.prepareSessionStorageContext(transcriptData, preparationTimestamp);
                    directoryHandle = preparedContext?.sessionFolderHandle || null;
                    audioDirectoryHandle = preparedContext?.audioFolderHandle || null;
                    sessionFolderName = preparedContext?.folderName || null;
                    storageContext = preparedContext || storageContext;
                } catch (error) {
                    console.warn('Nepavyko pasiekti sesijos katalogo audio failams:', error);
                }
            }

            if (directoryHandle) {
                const dirName = sessionFolderName || directoryHandle.name || 'sessions';
                audioDirectoryDetails.path = sessionFolderName ? `${sessionFolderName}/audio` : `${dirName}/audio`;
                audioDirectoryDetails.folderName = dirName;
            }

            if (audioDirectoryHandle) {
                this.audioDirectoryHandle = audioDirectoryHandle;
            }

            const savingDisabled = !audioDirectoryHandle;
            if (savingDisabled) {
                console.warn('TTS audio directory is unavailable; audio will only play in-memory.');
                this.updateTextToSpeechStatus('ℹ️ Audio bus atkuriamas tik šiame lange. Pasirinkite sesijos aplanką, jei norite įrašyti failus.', 'processing');
            }

            const slug = this.slugifySessionName(transcriptData.topic || transcriptData.title || 'seimo-posedis');
            const iso = preparationTimestamp.toISOString().replace(/[:.]/g, '-');
            const fileExtension = provider === 'speaches'
                ? this.getSpeachesFileExtension()
                : (responseFormat === 'wav' ? 'wav' : 'mp3');

            for (let index = 0; index < events.length; index++) {
                const event = events[index];
                if (!event || !event.text) {
                    continue;
                }

                const speakerName = event.speaker || `Seimo narys ${index + 1}`;
                const voiceProfile = this.getVoiceForSpeaker(speakerName);

                try {
                    const audioBlob = await this.synthesizeSpeech(event.text, voiceProfile, provider, ttsOptions);
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const audioElement = new Audio(audioUrl);
                    audioElement.preload = 'auto';
                    if ('preservesPitch' in audioElement) {
                        audioElement.preservesPitch = false;
                    } else if ('mozPreservesPitch' in audioElement) {
                        audioElement.mozPreservesPitch = false;
                    }
                    const basePlaybackRate = voiceProfile.rateMultiplier || 1;
                    audioElement.playbackRate = basePlaybackRate;
                    audioElement.addEventListener('ended', () => {
                        if (this.currentAudioElement === audioElement) {
                            this.currentAudioElement = null;
                        }
                    });

                    this.audioAssets.set(index, {
                        url: audioUrl,
                        blob: audioBlob,
                        element: audioElement,
                        basePlaybackRate,
                        voice: voiceProfile.voice,
                        voiceKey: voiceProfile.key,
                        speaker: speakerName
                    });

                    let savedFile = null;
                    if (!savingDisabled && audioDirectoryHandle && typeof audioDirectoryHandle.getFileHandle === 'function') {
                        try {
                            const fileName = `${iso}-${slug}-event-${String(index + 1).padStart(3, '0')}.${fileExtension}`;
                            const fileHandle = await audioDirectoryHandle.getFileHandle(fileName, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(audioBlob);
                            await writable.close();
                            savedFile = `audio/${fileName}`;
                        } catch (saveError) {
                            console.warn(`Nepavyko įrašyti audio failo indeksui ${index}:`, saveError);
                            errors.push({ index, speaker: speakerName, error: saveError.message });
                        }
                    }

                    mapping.push({
                        eventIndex: index,
                        speaker: speakerName,
                        voice: voiceProfile.voice,
                        voiceKey: voiceProfile.key,
                        rateMultiplier: basePlaybackRate,
                        timestamp: event.timestamp,
                        file: savedFile,
                        format: responseFormat
                    });
                } catch (error) {
                    console.error('Nepavyko sugeneruoti audio įrašo:', error);
                    errors.push({ index, speaker: speakerName, error: error.message });
                }
            }

            let mappingFilePath = null;
            if (mapping.length > 0 && directoryHandle && typeof directoryHandle.getFileHandle === 'function') {
                try {
                    const mappingFileName = 'audio-map.json';
                    const mappingFileHandle = await directoryHandle.getFileHandle(mappingFileName, { create: true });
                    const writable = await mappingFileHandle.createWritable();
                    await writable.write(JSON.stringify({
                        provider,
                        model: modelLabel,
                        responseFormat,
                        createdAt: preparationTimestamp.toISOString(),
                        sessionTitle: transcriptData.title || 'Seimo posėdis',
                        sessionTopic: transcriptData.topic || '',
                        audioDirectory: audioDirectoryDetails.path,
                        server: provider === 'speaches' ? (this.speachesSettings?.baseUrl || '') : '',
                        items: mapping
                    }, null, 2));
                    await writable.close();
                    mappingFilePath = sessionFolderName ? `${sessionFolderName}/${mappingFileName}` : mappingFileName;
                } catch (mappingError) {
                    console.warn('Nepavyko išsaugoti audio mapping failo:', mappingError);
                    errors.push({ type: 'mapping', error: mappingError.message });
                }
            }

            if (mapping.length > 0) {
                const savedInfo = mapping.filter(item => item.file).length;
                if (savedInfo > 0) {
                    this.updateTextToSpeechStatus(`🔊 Sugeneruota ${mapping.length} kalbų, ${savedInfo} įrašyta į katalogą (${this.providerDisplayName(provider)}: ${modelLabel}).`, 'success');
                } else {
                    this.updateTextToSpeechStatus(`🔊 Sugeneruota ${mapping.length} kalbų (atkuriama naršyklėje, ${this.providerDisplayName(provider)}: ${modelLabel}).`, 'success');
                }
            } else if (errors.length > 0) {
                this.updateTextToSpeechStatus('⚠️ Nepavyko sugeneruoti audio failų. Peržiūrėkite konsolę.', 'error');
            } else {
                this.updateTextToSpeechStatus('🔇 Nepavyko sugeneruoti audio įrašų šiam posėdžiui.', 'info');
            }

            return {
                provider,
                model: modelLabel,
                responseFormat,
                mapping,
                mappingFile: mappingFilePath,
                audioDirectory: audioDirectoryDetails.path,
                storageFolder: sessionFolderName,
                errors
            };
        } catch (error) {
            console.error('Nepavyko paruošti teksto į kalbą išteklių:', error);
            this.updateTextToSpeechStatus('⚠️ Teksto į kalbą generavimo klaida. Patikrinkite API raktą ar tinklo ryšį.', 'error');
            throw error;
        }
    }

    async ensureAudioDirectory(baseHandle) {
        if (!baseHandle || typeof baseHandle.getDirectoryHandle !== 'function') {
            return null;
        }

        try {
            if (this.audioDirectoryHandle) {
                return this.audioDirectoryHandle;
            }

            const audioHandle = await baseHandle.getDirectoryHandle('audio', { create: true });
            this.audioDirectoryHandle = audioHandle;
            return audioHandle;
        } catch (error) {
            console.warn('Nepavyko sukurti/atverti audio katalogo:', error);
            return null;
        }
    }

    async requestSpeechFromSpeaches(text, voiceProfile) {
        if (!this.ensureSpeachesConfigured()) {
            throw new Error('Speaches serveris nesukonfigūruotas.');
        }

        const payload = {
            model: this.getActiveSpeachesModelLabel(),
            voice: voiceProfile.voice,
            input: text
        };

        if (voiceProfile.style) {
            payload.style = voiceProfile.style;
        }

        const responseFormat = this.speachesSettings?.responseFormat;
        if (responseFormat && responseFormat.toLowerCase() !== 'mp3') {
            payload.response_format = responseFormat;
        }

        if (voiceProfile.rateMultiplier && voiceProfile.rateMultiplier !== 1) {
            const clampedSpeed = Math.min(Math.max(voiceProfile.rateMultiplier, 0.5), 2).toFixed(2);
            payload.speed = Number(clampedSpeed);
        }

        const endpoint = this.getSpeachesEndpoint('audio/speech');
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        } catch (networkError) {
            throw new Error(`Nepavyko pasiekti Speaches serverio (${endpoint}): ${networkError.message}`);
        }

        if (!response.ok) {
            const contentType = response.headers.get('Content-Type') || '';
            let errorMessage = `Speaches TTS API klaida (${response.status})`;
            if (contentType.includes('application/json')) {
                const errorBody = await response.json().catch(() => null);
                errorMessage = errorBody?.error?.message || errorBody?.message || errorMessage;
            } else {
                const errorText = await response.text().catch(() => '');
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }

        const mimeType = response.headers.get('Content-Type') || this.getSpeachesMimeType();
        const arrayBuffer = await response.arrayBuffer();
        return new Blob([arrayBuffer], { type: mimeType });
    }

    async synthesizeSpeech(text, voiceProfile, provider, providerOptions = {}) {
        if (provider === 'openai') {
            return this.requestSpeechFromOpenAI(text, voiceProfile, providerOptions);
        }
        if (provider === 'xai') {
            return this.requestSpeechFromXai(text, voiceProfile, providerOptions);
        }
        return this.requestSpeechFromSpeaches(text, voiceProfile);
    }

    async generateTranscript() {
        const question = this.questionInput.value.trim();
        const mode = this.generationMode;

        if (!question) {
            alert('Prašome įvesti klausimą svarstymui');
            return;
        }

        if (mode === 'remote') {
            if (!this.ensureRemoteGenerationConfigured()) {
                return;
            }
        } else if (mode === 'xai') {
            if (!this.ensureXaiGenerationConfigured()) {
                return;
            }
        } else if (mode !== 'chatgpt' && !this.ensureLocalGenerationConfigured()) {
            return;
        }

        this.showLoading(true);
        this.unavailableLiveTTSProvider = null;

        let transcript;

        try {
            if (mode === 'chatgpt') {
                transcript = await this.callChatGPT(question);
            } else if (mode === 'remote') {
                transcript = await this.callOpenAI(question, this.apiKeyInput.value.trim());
            } else if (mode === 'xai') {
                transcript = await this.callXai(question, (this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey));
            } else {
                transcript = await this.callLocalModel(question);
            }
            this.currentTTSOptions = this.buildDefaultTTSOptions(mode);

            this.resetVoiceAssignments(this.currentTTSOptions?.provider || this.getTextToSpeechProvider());

            await this.processGeneratedTranscript(transcript, question);
            this.setupPanel.classList.remove('active');
            this.hideSettingsModal();
            this.toggleSetupBtn.textContent = '✨ Generuoti naują posėdį';
        } catch (error) {
            console.error('Error generating transcript:', error);
            alert('Klaida generuojant stenogramą: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        this.loadingIndicator.classList.toggle('active', show);
        this.generateTranscriptBtn.disabled = show;
        
        if (show) {
            this.generateTranscriptBtn.textContent = '⏳ Generuojama...';
        } else {
            this.generateTranscriptBtn.textContent = '🚀 Generuoti Seimo posėdį';
        }
    }

    async callChatGPT(question) {
        const statusResponse = await fetch('/api/chatgpt/status');
        const status = await statusResponse.json();
        if (!statusResponse.ok || !status.canGenerate) throw new Error(status.error || 'Prisijunkite / Continue with ChatGPT first.');
        const model = document.getElementById('chatgptModelSelect')?.value;
        if (!model) throw new Error('Pasirinkite modelį / Select a ChatGPT model.');
        const response = await fetch('/api/chatgpt/generate', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Seimas-CSRF': status.csrf },
            body: JSON.stringify({ model, prompt: this.buildPrompt(question), instructions: this.buildSystemPrompt() })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'ChatGPT generation failed.');
        return data.text;
    }

    async callOpenAI(question, apiKey) {
        const prompt = this.buildPrompt(question);
        const systemPrompt = this.buildSystemPrompt();
        const model = this.getActiveOpenAITranscriptModelLabel();
        const extraOptions = this.parseJsonOptions(
            this.remoteGenerationSettings?.requestOptionsJson,
            'Papildomi Responses API JSON nustatymai'
        );
        if (!extraOptions) {
            throw new Error('OpenAI stenogramos nustatymai turi neteisingą JSON.');
        }

        const maxOutputTokens = this.parseOptionalNumber(
            this.remoteGenerationSettings?.maxOutputTokens,
            this.remoteGenerationSettings?.maxOutputTokens,
            100000
        );
        const reasoningEffort = this.remoteGenerationSettings?.reasoningEffort || 'medium';
        const requestBody = this.mergeOptions({
            model,
            input: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_output_tokens: maxOutputTokens,
            reasoning: {
                effort: reasoningEffort
            }
        }, extraOptions, ['model', 'input']);

        const endpoint = this.getOpenAIEndpoint('responses', this.remoteGenerationSettings?.baseUrl);
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API klaida');
        }

        const data = await response.json();
        console.log('Full API response:', data);
        
        // Responses API can return content in various structures
        // Check multiple possible response formats
        if (data.output && Array.isArray(data.output)) {
            // Find the message output in the array
            const messageOutput = data.output.find(item => item.type === 'message');
            if (messageOutput && messageOutput.content && messageOutput.content[0]) {
                return messageOutput.content[0].text;
            }
        } else if (data.content) {
            return data.content;
        } else if (data.text) {
            return data.text;
        } else if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        } else if (data.response) {
            return data.response;
        } else {
            // If none of the expected fields exist, return the whole object
            console.warn('Unexpected API response structure, returning full object');
            return data;
        }
    }

    async callXai(question, apiKey) {
        const prompt = this.buildPrompt(question);
        const systemPrompt = this.buildSystemPrompt();
        const model = this.getActiveXaiTranscriptModelLabel();
        const extraOptions = this.parseJsonOptions(
            this.xaiGenerationSettings?.requestOptionsJson,
            'Papildomi xAI Chat JSON nustatymai'
        );
        if (!extraOptions) {
            throw new Error('xAI stenogramos nustatymai turi neteisingą JSON.');
        }

        const maxOutputTokens = this.parseOptionalNumber(
            this.xaiGenerationSettings?.maxOutputTokens,
            this.xaiGenerationSettings?.maxOutputTokens,
            100000
        );
        const temperature = this.parseOptionalNumber(this.xaiGenerationSettings?.temperature, 0.4, 0.4);

        // xAI Grok is fully OpenAI chat-completions compatible.
        const requestBody = this.mergeOptions({
            model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ],
            max_tokens: maxOutputTokens,
            temperature
        }, extraOptions, ['model', 'messages']);

        const baseUrl = this.normalizeBaseUrl(this.xaiGenerationSettings?.baseUrl || 'https://api.x.ai/v1');
        const endpoint = `${baseUrl}/chat/completions`;
        const headers = { 'Content-Type': 'application/json' };
        if (apiKey) {
            headers.Authorization = `Bearer ${apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || error.message || 'xAI API klaida');
        }

        const data = await response.json();
        console.log('Full xAI API response:', data);
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return data.choices[0].message.content;
        }
        if (data.content) return data.content;
        if (data.text) return data.text;
        console.warn('Unexpected xAI response structure, returning full object');
        return data;
    }

    buildSystemPrompt() {
        if (this.sessionLanguage === 'en') {
            return 'You are an expert Lithuanian parliamentary simulation model. Produce exhaustive, realistic Seimas transcripts entirely in English and respond ONLY with valid JSON that matches the requested schema.';
        }
        return 'Jūs esate Lietuvos parlamento simuliacijų ekspertas. Kurkite itin detalias Seimo stenogramas lietuvių kalba ir atsakykite TIK taisyklingu JSON formatu pagal pateiktą struktūrą.';
    }

    async callLocalModel(question) {
        const prompt = this.buildPrompt(question);
        const systemPrompt = this.buildSystemPrompt();
        const baseUrl = this.normalizeBaseUrl(this.localGenerationSettings?.baseUrl || 'http://localhost:11434');
        const model = this.localGenerationSettings?.model || 'qwen3:30b';
        const temperature = Number(this.localGenerationSettings?.temperature ?? 0.35);
        const extraOptions = this.parseJsonOptions(
            this.localGenerationSettings?.optionsJson,
            'Papildomi Ollama options JSON'
        );
        if (!extraOptions) {
            throw new Error('Ollama options turi neteisingą JSON.');
        }
        const options = {
            ...extraOptions,
            temperature
        };
        const numPredict = Number(this.localGenerationSettings?.numPredict ?? -1);
        if (Number.isFinite(numPredict)) {
            options.num_predict = numPredict;
        }

        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                stream: false,
                options,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Ollama API klaida');
            throw new Error(errorText || 'Ollama API klaida');
        }

        const data = await response.json();
        return data?.message?.content || data?.response || data || '';
    }

    buildPrompt(question) {
        const memberProfiles = this.seimasMembers.slice(0, 20).map(member =>
            `${member.name} (${member.party}): ${member.personality}`
        ).join('\n');
        const isLithuanian = this.sessionLanguage !== 'en';
        const languageCode = isLithuanian ? 'lt' : 'en';

        if (isLithuanian) {
            return `
Sukurkite ypač išsamų ir realistišką Lietuvos Respublikos Seimo posėdžio transkriptą šiai temai: "${question}"

SEIMO NARIŲ PROFILIAI:
${memberProfiles}

DETALIZUOTI REIKALAVIMAI:

1. POSĖDŽIO STRUKTŪRA (3 valandos, 10:00-13:00):
   - 10:00 atidarymas ir procedūros
   - 10:05 darbotvarkės pristatymas
   - 10:15 pagrindinis ministerijos pranešimas (statistika)
   - 10:45 frakcijų kalbos (8-12 min.)
   - 11:45 15 min. pertrauka
   - 12:00 diskusijos ir klausimai
   - 12:45 rezoliucijos/pataisos
   - 13:00 balsavimo rezultatai

2. TURINIO KOKYBĖ:
   - 150-400 žodžių vienam pasisakymui
   - Konkretūs statistiniai duomenys (Eurostatas, LRV, ES)
   - Tarptautiniai palyginimai ir ekspertų citatos
   - Klausimai-atsakymai tarp frakcijų
   - Aiškūs pasiūlymai, kompromisai, rizikų vertinimas

3. IDEOLOGINĖS VĖŽĖS:
   - LSDP: socialinė apsauga, darbuotojų teisės
   - TS-LKD: konkurencingumas, fiskalinė drausmė, saugumas
   - Nemuno aušra: pilietinės laisvės, žalieji sprendimai
   - DSVL: pragmatiški kompromisai, regionai
   - Liberalai: laisva rinka, inovacijos, deregulacija
   - LVŽS: kaimo interesai, žemės ūkis, tradicijos

4. KONTEKSTAS:
   - Ekonomika (BVP, infliacija, biudžetas)
   - Socialinės pasekmės (švietimas, sveikata, nelygybė)
   - Teisiniai/procedūriniai aspektai
   - Įgyvendinimo planai ir finansavimas

5. BALSAVIMO REALIZMAS:
   - For/Prieš/Susilaikė pagal frakcijų dydžius
   - Dissent, papildomi balsavimų turai, emocinės reakcijos

FORMATAS (tik JSON):
{
  "title": "Išsamus posėdžio pavadinimas",
  "topic": "Tema ir kontekstas",
  "language": "${languageCode}",
  "events": [
    {
      "time": minutes_from_start,
      "timestamp": "HH:MM",
      "type": "speech",
      "speaker": "Vardas Pavardė",
      "title": "Pareigos",
      "party": "Partija",
      "text": "ILGAS, DETALUS TEKSTAS LIETUVIŲ KALBA SU ARGUMENTAIS",
      "update": "Trumpa santrauka lietuviškai"
    }
  ]
}

SVARBU: Sugeneruokite 50-60 įvykių ir jokio papildomo teksto už JSON ribų.
            `;
        }

        return `
Generate an exceptionally detailed and realistic transcript of the Lithuanian Parliament (Seimas) for: "${question}"

MEMBER PROFILES:
${memberProfiles}

DETAILED REQUIREMENTS:

1. SESSION STRUCTURE (3 hours, 10:00-13:00):
   - 10:00 opening and procedure overview
   - 10:05 agenda presentation
   - 10:15 ministry briefing packed with statistics
   - 10:45 party group speeches (8-12 min each)
   - 11:45 15-minute recess
   - 12:00 debate + cross-examination
   - 12:45 resolution/amendment discussion
   - 13:00 recorded vote and commentary

2. CONTENT QUALITY:
   - 150-400 words per entry
   - Concrete data (Eurostat, OECD, IMF, Lithuanian stats)
   - International comparisons, EU/NATO references
   - Clear proposals, costs, implementation steps
   - Rebuttals, interjections, emotional tone markers

3. IDEOLOGICAL GUARDRAILS:
   - LSDP: welfare state, labor rights, social equity
   - TS-LKD: competitiveness, fiscal discipline, national security
   - Nemuno aušra: civil liberties, democratic safeguards, green policies
   - DSVL: pragmatic centrism, regions, coalition management
   - Liberalai: market liberalization, startups, deregulation
   - LVŽS: rural priorities, agriculture, cultural conservatism

4. DISCUSSION CONTENT:
   - Economic/financial impacts with numbers
   - Social consequences with concrete programs
   - Constitutional/procedural disputes
   - Implementation logistics, budgets, timelines
   - Alternative proposals, compromises, dissent

5. VOTING REALISM:
   - Provide exact for/against/abstain counts
   - Show coalition tensions, dissenting MPs, applause or uproar cues

FORMAT (JSON only):
{
  "title": "Detailed session title in English",
  "topic": "Context-rich topic summary",
  "language": "${languageCode}",
  "events": [
    {
      "time": minutes_from_start,
      "timestamp": "HH:MM",
      "type": "speech",
      "speaker": "Name Surname",
      "title": "Role",
      "party": "Party",
      "text": "LONG, DATA-RICH SPEECH IN ENGLISH",
      "update": "Short ticker update in English"
    }
  ]
}

IMPORTANT: Produce 50-60 events and respond ONLY with JSON.
        `;
    }

    setupSessionPlayback(transcriptData, {
        question = '',
        timestamp = new Date(),
        message = 'Naujas posėdis sugeneruotas sėkmingai',
        isUploadedSession = false,
        streamFromApi = false
    } = {}) {
        const normalizedEvents = this.normalizeEvents(Array.isArray(transcriptData.events) ? transcriptData.events : []);
        transcriptData.events = normalizedEvents;

        this.events = normalizedEvents;
        this.totalDuration = this.calculateTotalDuration(normalizedEvents, transcriptData.durationMinutes);
        this.lastTranscriptTimestamp = timestamp;
        this.uploadedSessionMode = Boolean(isUploadedSession);
        this.streamLiveFromTTS = Boolean(streamFromApi && this.uploadedSessionMode);
        this.livePlaybackBusy = false;
        this.liveStreamAbort = false;
        this.completedEventsCount = 0;
        this.eventAudioPromises.clear();

        const topic = transcriptData.topic || question || 'Išsaugota Seimo sesija';
        if (this.streamLiveFromTTS && !this.textToSpeechEnabled) {
            this.textToSpeechEnabled = true;
            if (this.textToSpeechCheckbox) {
                this.textToSpeechCheckbox.checked = true;
            }
            try {
                localStorage.setItem('seimas_tts_enabled', 'true');
            } catch (storageError) {
                console.warn('Nepavyko įrašyti TTS nustatymo automatinio aktyvavimo metu:', storageError);
            }
        }
        this.updateSpeedSelectorState();

        this.sessionTitle.textContent = transcriptData.title || 'Seimo posėdis';
        this.sessionTopic.textContent = topic;

        if (typeof this.refreshAnalytics === 'function') {
            this.refreshAnalytics();
        }

        this.restart();

        this.playPauseBtn.disabled = false;
        this.restartBtn.disabled = false;
        if (this.skipNextBtn) {
            this.skipNextBtn.disabled = false;
        }

        this.clearAudioAssets();
        this.resetVoiceAssignments();
        this.audioPreparationPromise = null;

        this.addLiveUpdate('10:00', message);

        this.currentTranscriptData = transcriptData;
        this.currentSessionTimestamp = timestamp;

        return normalizedEvents;
    }

    calculateTotalDuration(events, fallbackDuration) {
        if (typeof fallbackDuration === 'number' && fallbackDuration > 0) {
            return fallbackDuration;
        }

        if (!Array.isArray(events) || events.length === 0) {
            return 180;
        }

        const maxTime = events.reduce((max, event) => {
            if (typeof event.time === 'number' && !Number.isNaN(event.time)) {
                return Math.max(max, event.time);
            }
            return max;
        }, 0);

        return Math.max(maxTime + 5, 5);
    }

    normalizeEvents(events) {
        if (!Array.isArray(events)) {
            return [];
        }

        return events.map((event, index) => {
            const normalized = { ...event };

            if (typeof normalized.time !== 'number') {
                const numericTime = Number(normalized.time);
                if (Number.isFinite(numericTime)) {
                    normalized.time = numericTime;
                }
            }

            if (typeof normalized.time !== 'number' || Number.isNaN(normalized.time)) {
                normalized.time = index * 5;
            }

            if (!normalized.timestamp) {
                normalized.timestamp = this.formatTime(Math.floor(normalized.time));
            }

            if (!normalized.update) {
                if (normalized.speaker) {
                    normalized.update = `${normalized.speaker} kalba posėdyje`;
                } else {
                    normalized.update = 'Posėdžio eiga atnaujinta';
                }
            }

            return normalized;
        });
    }

    sanitizeText(value) {
        if (value === null || value === undefined) {
            return '';
        }

        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async processGeneratedTranscript(transcriptJson, question) {
        try {
            // Handle different response types from Responses API
            let transcriptData;

            // Convert to string if it's an object
            const responseText = typeof transcriptJson === 'string' ? transcriptJson : JSON.stringify(transcriptJson);
            
            console.log('Response type:', typeof transcriptJson);
            console.log('Response content preview:', responseText.substring(0, 200));
            
            if (typeof transcriptJson === 'object' && transcriptJson !== null) {
                // If it's already an object, use it directly
                transcriptData = transcriptJson;
            } else if (responseText.trim().startsWith('{')) {
                // If it's a JSON string, parse it
                transcriptData = JSON.parse(responseText);
            } else {
                // If not JSON, convert plain text to structured format
                transcriptData = this.convertTextToStructuredTranscript(responseText, question);
            }

            if (!transcriptData.language) {
                transcriptData.language = this.sessionLanguage;
            }

            const transcriptTimestamp = new Date();
            this.setupSessionPlayback(transcriptData, {
                question,
                timestamp: transcriptTimestamp,
                message: 'Naujas posėdis sugeneruotas sėkmingai',
                isUploadedSession: false,
                streamFromApi: false
            });

            let sessionStorageContext = null;
            try {
                sessionStorageContext = await this.prepareSessionStorageContext(transcriptData, transcriptTimestamp);
                if (sessionStorageContext) {
                    this.currentSessionStorageContext = sessionStorageContext;
                }
            } catch (contextError) {
                console.warn('Nepavyko paruošti sesijos aplanko:', contextError);
            }

            let audioMetadata = null;
            if (this.textToSpeechEnabled) {
                try {
                    const ttsOptions = this.currentTTSOptions || this.buildDefaultTTSOptions();
                    audioMetadata = await this.prepareTextToSpeechAssets(
                        transcriptData,
                        transcriptTimestamp,
                        sessionStorageContext,
                        ttsOptions
                    );
                    if (audioMetadata?.mapping?.length) {
                        const providerLabel = audioMetadata.provider === 'openai'
                            ? `OpenAI (${audioMetadata.model || this.getActiveOpenAITTSModelLabel()})`
                            : audioMetadata.provider === 'xai'
                                ? `xAI Grok (${audioMetadata.model || 'grok-tts'})`
                                : `Speaches (${audioMetadata.model || this.getActiveSpeachesModelLabel()})`;
                        this.addLiveUpdate('10:02', `Sugeneruota ${audioMetadata.mapping.length} balsų (${providerLabel}).`);
                    }
                    if (audioMetadata?.errors?.length) {
                        this.addLiveUpdate('10:02', 'Dalis audio failų nepavyko. Patikrinkite konsolę dėl detalių.');
                    }
                } catch (ttsError) {
                    console.error('Error preparing text-to-speech assets:', ttsError);
                    this.addLiveUpdate('10:02', 'Nepavyko sugeneruoti audio įrašų.');
                }
            } else {
                this.clearAudioAssets();
                this.resetVoiceAssignments();
                this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta.', 'info');
            }

            const saveResult = await this.saveTranscriptToFile(
                transcriptData,
                transcriptTimestamp,
                audioMetadata,
                sessionStorageContext
            );
            if (saveResult.success) {
                const saveMessage = saveResult.method === 'download'
                    ? `Stenograma atsisiųsta failu: ${saveResult.path}`
                    : `Stenograma automatiškai išsaugota: ${saveResult.path}`;
                this.addLiveUpdate('10:01', saveMessage);
                if (audioMetadata?.mappingFile) {
                    this.addLiveUpdate('10:03', `Audio mapping išsaugotas faile: ${audioMetadata.mappingFile}`);
                }
            } else {
                this.addLiveUpdate('10:01', 'Nepavyko automatiškai išsaugoti stenogramos. Parsisiųskite ją rankiniu būdu.');
            }

        } catch (error) {
            console.error('Error processing transcript:', error);
            alert('Klaida apdorojant stenogramą. Bandykite dar kartą.');
        }
    }

    async saveTranscriptToFile(transcriptData, timestamp = new Date(), audioMetadata = null, sessionStorageContext = null) {
        try {
            const payload = this.createTranscriptPayload(transcriptData, timestamp, audioMetadata);
            const serialized = JSON.stringify(payload, null, 2);
            const folderName = this.buildSessionFolderName(transcriptData, timestamp);
            const fileName = `${folderName}.json`;

            if (typeof window === 'undefined') {
                const fs = require('fs');
                const path = require('path');
                const sessionsDir = path.resolve(process.cwd(), 'sessions');
                const sessionDir = path.join(sessionsDir, folderName);
                await fs.promises.mkdir(sessionDir, { recursive: true });
                const targetPath = path.join(sessionDir, fileName);
                await fs.promises.writeFile(targetPath, serialized, 'utf8');
                return { success: true, path: `sessions/${folderName}/${fileName}`, method: 'node' };
            }

            const nodeArchiveResult = await this.trySaveTranscriptViaNodeService(folderName, fileName, serialized);
            if (nodeArchiveResult?.success && nodeArchiveResult.path) {
                this.recordSavedSession(nodeArchiveResult.path, timestamp, 'node-api');
                return { success: true, path: nodeArchiveResult.path, method: 'node-api' };
            }

            if (window.isSecureContext && typeof window.showDirectoryPicker === 'function') {
                try {
                    let context = sessionStorageContext;
                    if (!context) {
                        context = await this.prepareSessionStorageContext(transcriptData, timestamp);
                    }
                    const savedPath = await this.persistTranscriptUsingFileSystemAPI(fileName, serialized, {
                        sessionFolderHandle: context?.sessionFolderHandle,
                        folderName: context?.folderName
                    });
                    this.recordSavedSession(savedPath, timestamp, 'filesystem');
                    return { success: true, path: savedPath, method: 'filesystem' };
                } catch (error) {
                    console.warn('Failų sistemos API nepavyko, bus naudojamas atsisiuntimo metodas:', error);
                }
            }

            const downloadName = this.triggerTranscriptDownload(fileName, serialized);
            this.recordSavedSession(downloadName, timestamp, 'download');
            return { success: true, path: downloadName, method: 'download' };
        } catch (error) {
            console.error('Klaida išsaugant stenogramą:', error);
            return { success: false, error };
        }
    }

    async loadSessionFromFile(file) {
        if (!file) {
            return;
        }

        try {
            const fileContents = await file.text();
            let payload;

            try {
                payload = JSON.parse(fileContents);
            } catch (parseError) {
                throw new Error('Nepavyko perskaityti JSON failo');
            }

            if (!payload || typeof payload !== 'object') {
                throw new Error('Pasirinktas failas neturi sesijos duomenų');
            }

            const eventsSource = Array.isArray(payload.events)
                ? payload.events
                : Array.isArray(payload.transcript?.events)
                    ? payload.transcript.events
                    : [];

            const transcriptData = {
                title: payload.title || payload.sessionTitle || 'Seimo posėdis',
                topic: payload.topic || payload.question || '',
                events: eventsSource,
                durationMinutes: payload.durationMinutes
            };

            const savedAt = payload.savedAt ? new Date(payload.savedAt) : new Date();
            const sessionLabel = file.name || payload.fileName || 'sesija';

            this.setupSessionPlayback(transcriptData, {
                question: transcriptData.topic,
                timestamp: savedAt,
                message: `Įkelta išsaugota sesija (${sessionLabel})`,
                isUploadedSession: true,
                streamFromApi: true
            });
            this.currentSessionStorageContext = null;
            this.loadedSessionDirectoryHandle = null;

            this.addLiveUpdate('10:01', `Sesijoje rasta ${transcriptData.events.length} įvykių.`);

            const audioMetadata = payload.audio;
            if (audioMetadata?.storageFolder && audioMetadata?.mapping?.length) {
                this.addLiveUpdate('10:01', `🔊 Sesijos aplankas: ${audioMetadata.storageFolder}. Naudokite „Atverti sesijos aplanką“, kad būtų įkelti audio failai.`);
            }

            if (this.textToSpeechEnabled) {
                this.updateTextToSpeechStatus(`🔄 Pasisakymai bus sintetinti realiu laiku (${this.getTTSProviderLabel()}). Spauskite „Paleisti“, kad pradėtumėte srautą.`, 'processing');
            } else if (audioMetadata?.enabled) {
                this.addLiveUpdate('10:02', 'Ši sesija turi teksto į kalbą metaduomenis. Įjunkite balsų generavimą ir sukonfigūruokite pasirinktą serverį, kad atkurtumėte įrašus.');
            } else {
                this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta.', 'info');
            }
        } catch (error) {
            console.error('Nepavyko įkelti sesijos failo:', error);
            this.addLiveUpdate('10:00', '❌ Nepavyko įkelti pasirinkto sesijos failo. Patikrinkite JSON formatą.');
            alert('Nepavyko įkelti sesijos failo. Įsitikinkite, kad pasirenkate teisingą JSON failą.');
        }
    }

    async loadSessionFromDirectory() {
        if (typeof window === 'undefined' ||
            !window.isSecureContext ||
            typeof window.showDirectoryPicker !== 'function') {
            alert('Naršyklė nepalaiko katalogo atvėrimo. Įkelkite JSON failą.');
            return;
        }

        try {
            const directoryHandle = await window.showDirectoryPicker({ mode: 'read' });
            if (directoryHandle) {
                await this.loadSessionFromDirectoryHandle(directoryHandle);
            }
        } catch (error) {
            if (error?.name === 'AbortError') {
                return;
            }
            console.error('Nepavyko atverti sesijos aplanko:', error);
            alert('Nepavyko įkelti sesijos aplanko. Patikrinkite, ar jame yra stenogramos JSON failas.');
        }
    }

    async loadSessionFromDirectoryHandle(directoryHandle) {
        if (!directoryHandle) {
            return;
        }

        try {
            const transcriptHandle = await this.findSessionJsonFile(directoryHandle);
            if (!transcriptHandle) {
                throw new Error('Sesijos aplanke nerastas stenogramos JSON failas.');
            }

            const file = await transcriptHandle.getFile();
            const contents = await file.text();
            const payload = JSON.parse(contents);
            const savedAt = payload.savedAt ? new Date(payload.savedAt) : new Date();

            const transcriptData = payload;
            this.setupSessionPlayback(transcriptData, {
                question: transcriptData.topic,
                timestamp: savedAt,
                message: `Sesija įkelta iš aplanko (${directoryHandle.name || 'sesija'})`,
                isUploadedSession: true,
                streamFromApi: true
            });

            this.currentSessionStorageContext = {
                sessionFolderHandle: directoryHandle,
                folderName: directoryHandle.name || 'sesija'
            };
            this.loadedSessionDirectoryHandle = directoryHandle;

            try {
                this.currentSessionStorageContext.audioFolderHandle = await directoryHandle.getDirectoryHandle('audio');
            } catch (audioDirError) {
                console.warn('Sesijos aplanke nerastas audio katalogas:', audioDirError);
                this.currentSessionStorageContext.audioFolderHandle = null;
            }

            const audioMetadata = payload.audio;
            if (audioMetadata?.mapping?.length && this.currentSessionStorageContext.audioFolderHandle) {
                await this.hydrateAudioAssetsFromDirectory(audioMetadata.mapping, this.currentSessionStorageContext.audioFolderHandle);
                if (!this.textToSpeechEnabled && this.textToSpeechCheckbox) {
                    this.textToSpeechEnabled = true;
                    this.textToSpeechCheckbox.checked = true;
                    try {
                        localStorage.setItem('seimas_tts_enabled', 'true');
                    } catch (storageError) {
                        console.warn('Nepavyko išsaugoti TTS nustatymo po sesijos įkėlimo:', storageError);
                    }
                }
                this.updateTextToSpeechStatus(`🔊 Įkelta ${audioMetadata.mapping.length} audio įrašų iš pasirinkto aplanko.`, 'success');
                this.streamLiveFromTTS = false;
                this.updateSpeedSelectorState();
            } else if (audioMetadata?.mapping?.length) {
                this.addLiveUpdate('10:02', 'Sesijos aplanke nerasta audio katalogo, todėl balsai nebuvo įkelti.');
                if (this.textToSpeechEnabled) {
                    this.updateTextToSpeechStatus(`ℹ️ Audio metaduomenys rasti, tačiau failai neprieinami. ${this.getTTSProviderLabel()} sugeneruos balsus realiu laiku.`, 'processing');
                }
            } else {
                if (this.textToSpeechEnabled) {
                    this.updateTextToSpeechStatus(`🔄 Ši sesija neturi audio failų. Visi pasisakymai bus įgarsinami realiu laiku (${this.getTTSProviderLabel()}).`, 'processing');
                } else {
                    this.updateTextToSpeechStatus('🔇 Ši sesija neturi iš anksto sugeneruotų audio failų.', 'info');
                }
            }
        } catch (error) {
            console.error('Nepavyko apdoroti sesijos aplanko:', error);
            alert('Nepavyko įkelti pasirinkto sesijos aplanko. Įsitikinkite, kad jame yra stenogramos JSON ir audio failų.');
        }
    }

    async findSessionJsonFile(directoryHandle) {
        if (!directoryHandle || typeof directoryHandle.values !== 'function') {
            return null;
        }

        for await (const entry of directoryHandle.values()) {
            if (entry.kind === 'file' && entry.name.endsWith('.json')) {
                if (!entry.name.includes('audio-map')) {
                    return entry;
                }
            }
        }

        return null;
    }

    async hydrateAudioAssetsFromDirectory(mapping, audioDirectoryHandle) {
        if (!audioDirectoryHandle || !Array.isArray(mapping)) {
            return;
        }

        for (const item of mapping) {
            if (typeof item?.eventIndex !== 'number' || !item.file) {
                continue;
            }

            const segments = item.file.split('/');
            const fileName = segments[segments.length - 1];
            if (!fileName) {
                continue;
            }

            try {
                const fileHandle = await audioDirectoryHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                const audioUrl = URL.createObjectURL(file);

                this.audioAssets.set(item.eventIndex, {
                    url: audioUrl,
                    blob: file,
                    voice: item.voice,
                    voiceKey: item.voiceKey,
                    speaker: item.speaker,
                    basePlaybackRate: item.rateMultiplier || 1
                });
            } catch (error) {
                console.warn(`Nepavyko įkelti audio failo ${fileName}:`, error);
            }
        }
    }

    // ===================================================================
    //  Analytics (votes + stats), export bundle, and cross-browser import
    // ===================================================================

    getCurrentSessionData() {
        let savedAt;
        try {
            savedAt = (this.lastTranscriptTimestamp instanceof Date)
                ? this.lastTranscriptTimestamp.toISOString()
                : new Date().toISOString();
        } catch (e) { savedAt = null; }
        return {
            savedAt,
            title: this.sessionTitle ? this.sessionTitle.textContent : 'Seimo posėdis',
            topic: this.sessionTopic ? this.sessionTopic.textContent : '',
            totalEvents: (this.events || []).length,
            durationMinutes: this.totalDuration,
            events: this.events || []
        };
    }

    refreshAnalytics() {
        if (typeof window.SeimasAnalytics === 'undefined') return;
        const session = this.getCurrentSessionData();
        const hasSession = (session.events || []).length > 0;

        const resultsEl = document.getElementById('resultsContainer');
        const statsEl = document.getElementById('statsContainer');
        if (resultsEl) {
            const votes = window.SeimasAnalytics.findVotes(session);
            resultsEl.innerHTML = window.SeimasAnalytics.renderResults(votes);
            const tab = document.querySelector('[data-tab-btn="results"] .tab-count');
            if (tab) tab.textContent = votes.length ? String(votes.length) : '';
        }
        if (statsEl) {
            const stats = window.SeimasAnalytics.computeStats(session);
            statsEl.innerHTML = window.SeimasAnalytics.renderStats(stats);
        }

        const exportBtn = document.getElementById('exportSessionBtn');
        if (exportBtn) exportBtn.disabled = !hasSession;
    }

    audioExtFromType(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('wav')) return 'wav';
        if (t.includes('ogg')) return 'ogg';
        if (t.includes('opus')) return 'opus';
        if (t.includes('aac')) return 'aac';
        if (t.includes('flac')) return 'flac';
        if (t.includes('mp4') || t.includes('m4a')) return 'm4a';
        return 'mp3';
    }

    async exportSessionBundle() {
        if (typeof window.SeimasIO === 'undefined') {
            alert('Eksporto modulis neįkeltas.');
            return;
        }
        if (!this.events || !this.events.length) {
            alert('Nėra ką eksportuoti — pirma sugeneruokite arba įkelkite posėdį.');
            return;
        }
        const IO = window.SeimasIO;
        const session = this.getCurrentSessionData();
        const slug = IO.slugify(session.title || session.topic);
        const files = [];
        const mapping = [];

        const indices = [...this.audioAssets.keys()].sort((a, b) => a - b);
        for (const idx of indices) {
            const asset = this.audioAssets.get(idx);
            if (!asset || !asset.blob) continue;
            const ext = this.audioExtFromType(asset.blob.type);
            const ev = this.events[idx] || {};
            const speaker = asset.speaker || ev.speaker || 'kalba';
            const fname = `audio/${String(idx).padStart(3, '0')}-${IO.slugify(speaker)}.${ext}`;
            files.push({ name: fname, data: asset.blob });
            mapping.push({
                eventIndex: idx, speaker,
                voice: asset.voice, voiceKey: asset.voiceKey,
                rateMultiplier: asset.basePlaybackRate || 1,
                timestamp: ev.timestamp || '', file: fname, format: ext
            });
        }

        const payload = Object.assign({}, session, {
            audio: {
                enabled: mapping.length > 0,
                model: this.getActiveSpeachesModelLabel ? this.getActiveSpeachesModelLabel() : null,
                mappingFile: mapping.length ? 'audio-map.json' : null,
                mapping
            }
        });

        files.unshift({ name: `${slug}.json`, data: JSON.stringify(payload, null, 2) });
        files.push({ name: 'transkriptas.md', data: IO.sessionToMarkdown(payload) });
        if (mapping.length) {
            files.push({ name: 'audio-map.json', data: JSON.stringify({ mapping }, null, 2) });
        }

        try {
            this.updateTextToSpeechStatus(`📦 Pakuojama ${mapping.length} audio įrašų į ZIP...`, 'processing');
            const zip = await IO.zipFiles(files);
            IO.downloadBlob(zip, `${slug}.zip`);
            this.addLiveUpdate(this.formatTime(this.currentTime || 0),
                `📦 Sesija eksportuota (${files.length} failai, ${mapping.length} audio).`);
            this.updateTextToSpeechStatus(`✅ Sesija eksportuota: ${slug}.zip`, 'success');
        } catch (error) {
            console.error('Nepavyko eksportuoti sesijos:', error);
            alert('Nepavyko sukurti eksporto archyvo. Peržiūrėkite konsolę.');
        }
    }

    async downloadEventAudio(index) {
        const asset = this.audioAssets.get(index);
        if (!asset || !asset.blob) {
            alert('Šis pasisakymas dar neturi sugeneruoto audio.');
            return;
        }
        const IO = window.SeimasIO;
        const ev = this.events[index] || {};
        const ext = this.audioExtFromType(asset.blob.type);
        const fname = `${String(index).padStart(3, '0')}-${IO.slugify(asset.speaker || ev.speaker || 'kalba')}.${ext}`;
        IO.downloadBlob(asset.blob, fname);
    }

    async importSessionFiles(fileList) {
        const files = Array.from(fileList || []);
        if (!files.length) return;
        if (typeof window.SeimasIO === 'undefined') {
            alert('Importo modulis neįkeltas.');
            return;
        }

        let sessionJson = null;
        const audioByName = new Map();
        const audioMimeFor = (name) => {
            const ext = (name.split('.').pop() || '').toLowerCase();
            return ({ mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', opus: 'audio/opus',
                aac: 'audio/aac', flac: 'audio/flac', m4a: 'audio/mp4' })[ext] || 'audio/mpeg';
        };
        const isAudioName = (n) => /\.(mp3|wav|ogg|opus|aac|flac|m4a|mpeg)$/i.test(n);

        try {
            const zipFile = files.find(f => /\.zip$/i.test(f.name));
            if (zipFile) {
                const entries = await window.SeimasIO.unzip(zipFile);
                for (const e of entries) {
                    if (/audio-map\.json$/i.test(e.name)) continue;
                    if (/\.json$/i.test(e.name) && !sessionJson) {
                        sessionJson = JSON.parse(new TextDecoder().decode(e.data));
                    } else if (isAudioName(e.name)) {
                        const base = e.name.split('/').pop();
                        audioByName.set(base, new Blob([e.data], { type: audioMimeFor(base) }));
                    }
                }
            } else {
                for (const f of files) {
                    if (/audio-map\.json$/i.test(f.name)) continue;
                    if (/\.json$/i.test(f.name) && !sessionJson) {
                        sessionJson = JSON.parse(await f.text());
                    } else if (isAudioName(f.name)) {
                        audioByName.set(f.name.split('/').pop(), f);
                    }
                }
            }
        } catch (error) {
            console.error('Nepavyko nuskaityti importuojamų failų:', error);
            alert('Nepavyko nuskaityti pasirinktų failų. Įsitikinkite, kad pasirenkate sesijos JSON (arba ZIP) ir audio failus.');
            return;
        }

        if (!sessionJson) {
            alert('Nerastas sesijos JSON failas. Pasirinkite sesijos .json (arba .zip) kartu su audio failais.');
            return;
        }

        const eventsSource = Array.isArray(sessionJson.events)
            ? sessionJson.events
            : Array.isArray(sessionJson.transcript?.events) ? sessionJson.transcript.events : [];
        const transcriptData = {
            title: sessionJson.title || sessionJson.sessionTitle || 'Importuotas posėdis',
            topic: sessionJson.topic || sessionJson.question || '',
            events: eventsSource,
            durationMinutes: sessionJson.durationMinutes
        };

        const hasAudio = audioByName.size > 0;
        const savedAt = sessionJson.savedAt ? new Date(sessionJson.savedAt) : new Date();

        this.setupSessionPlayback(transcriptData, {
            question: transcriptData.topic,
            timestamp: savedAt,
            message: `Importuota sesija (${transcriptData.events.length} įvykių)`,
            isUploadedSession: true,
            streamFromApi: !hasAudio
        });
        this.currentSessionStorageContext = null;
        this.loadedSessionDirectoryHandle = null;

        // Hydrate audio AFTER setup (setup clears audio assets).
        let attached = 0;
        if (hasAudio) {
            const mapping = sessionJson.audio?.mapping || [];
            const sortedNames = [...audioByName.keys()].sort();
            mapping.forEach((item, i) => {
                if (typeof item.eventIndex !== 'number') return;
                let blob = null;
                if (item.file) {
                    const base = item.file.split('/').pop();
                    blob = audioByName.get(base) || null;
                }
                if (!blob && sortedNames[i]) blob = audioByName.get(sortedNames[i]);
                if (!blob) return;
                this.audioAssets.set(item.eventIndex, {
                    url: URL.createObjectURL(blob),
                    blob,
                    voice: item.voice, voiceKey: item.voiceKey,
                    speaker: item.speaker || (this.events[item.eventIndex] || {}).speaker || '',
                    basePlaybackRate: item.rateMultiplier || 1
                });
                attached++;
            });
            // No mapping? attach audio files to events in sorted order.
            if (!mapping.length) {
                sortedNames.forEach((name, idx) => {
                    const blob = audioByName.get(name);
                    this.audioAssets.set(idx, {
                        url: URL.createObjectURL(blob), blob,
                        speaker: (this.events[idx] || {}).speaker || '',
                        basePlaybackRate: 1
                    });
                    attached++;
                });
            }
        }

        if (attached > 0) {
            this.streamLiveFromTTS = false;
            if (this.textToSpeechCheckbox) this.textToSpeechCheckbox.checked = true;
            this.textToSpeechEnabled = true;
            try { localStorage.setItem('seimas_tts_enabled', 'true'); } catch (e) { /* ignore */ }
            this.updateSpeedSelectorState();
            this.updateTextToSpeechStatus(`🔊 Importuota ${attached} audio įrašų. Spauskite „Paleisti".`, 'success');
            this.addLiveUpdate('10:01', `🔊 Prijungta ${attached} iš anksto sugeneruotų audio įrašų.`);
        } else {
            this.updateTextToSpeechStatus('🔇 Importuota sesija be audio failų. Įjunkite TTS, kad įgarsintumėte realiu laiku.', 'info');
        }
        this.addLiveUpdate('10:00', `📥 Importuota sesija: „${transcriptData.title}".`);
        this.refreshAnalytics();
    }

    createTranscriptPayload(transcriptData, timestamp, audioMetadata) {
        return {
            savedAt: timestamp.toISOString(),
            title: transcriptData.title || 'Seimo posėdis',
            topic: transcriptData.topic || '',
            totalEvents: Array.isArray(transcriptData.events) ? transcriptData.events.length : 0,
            durationMinutes: this.totalDuration,
            events: transcriptData.events || [],
            audio: {
                enabled: !!audioMetadata,
                model: audioMetadata?.model || null,
                mappingFile: audioMetadata?.mappingFile || null,
                audioDirectory: audioMetadata?.audioDirectory || null,
                storageFolder: audioMetadata?.storageFolder || null,
                mapping: audioMetadata?.mapping || []
            }
        };
    }

    buildSessionFileName(transcriptData, timestamp) {
        const topic = transcriptData.topic || transcriptData.title || 'seimo-posedis';
        const slug = this.slugifySessionName(topic);
        const iso = timestamp.toISOString().replace(/[:.]/g, '-');
        return `${iso}-${slug}.json`;
    }

    buildSessionFolderName(transcriptData, timestamp) {
        const fileName = this.buildSessionFileName(transcriptData, timestamp);
        return fileName.replace(/\.json$/i, '');
    }

    async prepareSessionStorageContext(transcriptData, timestamp) {
        if (typeof window === 'undefined') {
            return null;
        }

        if (!window.isSecureContext || typeof window.showDirectoryPicker !== 'function') {
            return null;
        }

        try {
            const rootHandle = await this.getSessionDirectoryHandle();
            const folderName = this.buildSessionFolderName(transcriptData, timestamp);
            const sessionFolderHandle = await rootHandle.getDirectoryHandle(folderName, { create: true });
            const audioFolderHandle = await sessionFolderHandle.getDirectoryHandle('audio', { create: true });
            const context = {
                rootHandle,
                sessionFolderHandle,
                audioFolderHandle,
                folderName
            };
            this.currentSessionStorageContext = context;
            return context;
        } catch (error) {
            console.warn('Nepavyko sukurti sesijos aplanko:', error);
            return null;
        }
    }

    slugifySessionName(text) {
        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .toLowerCase() || 'seimo-posedis';
    }

    async persistTranscriptUsingFileSystemAPI(fileName, contents, options = {}) {
        if (!window.isSecureContext || typeof window.showDirectoryPicker !== 'function') {
            throw new Error('Failų sistemos API nepasiekiama nesaugiame kontekste');
        }

        const directoryHandle = options.sessionFolderHandle || await this.getSessionDirectoryHandle();
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(contents);
        await writable.close();

        const directoryName = options.folderName || directoryHandle.name || 'sessions';
        return `${directoryName}/${fileName}`;
    }

    async trySaveTranscriptViaNodeService(folderName, fileName, contents) {
        if (typeof window === 'undefined' || typeof window.fetch !== 'function') {
            return null;
        }

        const origin = window.location?.origin || '';
        if (!origin || origin.startsWith('file://')) {
            return null;
        }

        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 6000) : null;

        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ folderName, fileName, contents }),
                signal: controller?.signal
            });

            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                throw new Error(`Serverio atsakymas: ${response.status}`);
            }

            const result = await response.json();
            if (!result?.path) {
                throw new Error('Neteisingas serverio atsakas (trūksta kelio)');
            }

            return { success: true, path: result.path };
        } catch (error) {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            console.warn('Nepavyko išsaugoti per Node sesijų API:', error);
            return null;
        }
    }

    async getSessionDirectoryHandle() {
        if (this.sessionDirectoryHandle && await this.verifyDirectoryPermission(this.sessionDirectoryHandle)) {
            return this.sessionDirectoryHandle;
        }

        const directoryHandle = await window.showDirectoryPicker({
            id: 'seimas-sessions',
            mode: 'readwrite'
        });

        const hasPermission = await this.verifyDirectoryPermission(directoryHandle);
        if (!hasPermission) {
            throw new Error('Leidimas rašyti į pasirinktą katalogą nebuvo suteiktas');
        }

        this.sessionDirectoryHandle = directoryHandle;
        return directoryHandle;
    }

    async verifyDirectoryPermission(handle) {
        if (!handle) {
            return false;
        }

        if (typeof handle.queryPermission === 'function') {
            const permission = await handle.queryPermission({ mode: 'readwrite' });
            if (permission === 'granted') {
                return true;
            }
        }

        if (typeof handle.requestPermission === 'function') {
            const permission = await handle.requestPermission({ mode: 'readwrite' });
            return permission === 'granted';
        }

        return true;
    }

    triggerTranscriptDownload(fileName, contents) {
        if (typeof document === 'undefined') {
            return fileName;
        }

        const downloadName = `sessions-${fileName}`;
        const blob = new Blob([contents], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return downloadName;
    }

    recordSavedSession(fileName, timestamp, method) {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }

        try {
            const existing = JSON.parse(window.localStorage.getItem('seimas_saved_sessions') || '[]');
            existing.unshift({ fileName, savedAt: timestamp.toISOString(), method });
            window.localStorage.setItem('seimas_saved_sessions', JSON.stringify(existing.slice(0, 20)));
        } catch (error) {
            console.warn('Nepavyko išsaugoti sesijos metaduomenų localStorage:', error);
        }
    }

    convertTextToStructuredTranscript(text, question) {
        // Simple text parsing to structured format
        const events = [];
        const lines = text.split('\n').filter(line => line.trim());
        
        let currentTime = 0;
        let eventIndex = 0;

        // Add opening event
        events.push({
            time: 0,
            timestamp: '10:00',
            type: 'opening',
            speaker: 'Saulius Skvernelis',
            title: 'Seimo pirmininkas',
            party: 'DSVL',
            text: `Pradedame Lietuvos Respublikos Seimo posėdį. Šiandien svarstysime klausimą: "${question}"`,
            update: 'Posėdis pradėtas'
        });

        // Process text content
        for (let i = 0; i < lines.length && eventIndex < 30; i++) {
            const line = lines[i].trim();
            if (line.length > 50) { // Substantial content
                currentTime += 5 + Math.random() * 10; // Variable timing
                
                // Try to extract speaker name (basic pattern matching)
                const speakerMatch = line.match(/([A-ZŠŽČĘŪĮĄ][a-zšžčęūįą]+\s+[A-ZŠŽČĘŪĮĄ][a-zšžčęūįą]+)/);
                const speaker = speakerMatch ? speakerMatch[1] : 'Seimo narys';
                
                events.push({
                    time: Math.floor(currentTime),
                    timestamp: this.formatTime(Math.floor(currentTime)),
                    type: 'speech',
                    speaker: speaker,
                    title: 'Seimo narys',
                    party: 'Frakcija',
                    text: line,
                    update: `${speaker} kalba posėdyje`
                });
                
                eventIndex++;
            }
        }

        // Add closing event
        events.push({
            time: Math.floor(currentTime) + 5,
            timestamp: this.formatTime(Math.floor(currentTime) + 5),
            type: 'closing',
            speaker: 'Saulius Skvernelis',
            title: 'Seimo pirmininkas',
            party: 'DSVL',
            text: 'Posėdis baigtas. Dėkoju visiems dalyvavusiems.',
            update: 'Posėdis oficialiai baigtas'
        });

        return {
            title: 'Seimo posėdis',
            topic: question,
            events: events
        };
    }

    formatTime(minutes) {
        const hours = Math.floor((600 + minutes) / 60);
        const mins = (600 + minutes) % 60;
        return `${hours}:${mins.toString().padStart(2, '0')}`;
    }

    // Existing playback methods (from original class)
    togglePlayPause() {
        if (this.events.length === 0) {
            alert('Pirma sugeneruokite posėdžio stenogramą');
            return;
        }

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.liveStreamAbort = false;
        this.playPauseBtn.textContent = '⏸️ Pristabdyti';
        if (this.textToSpeechEnabled && this.currentAudioElement) {
            this.currentAudioElement.play().catch(error => {
                console.warn('Nepavyko tęsti audio atkūrimo:', error);
            });
        }
        this.startTimer();
    }

    pause() {
        this.isPlaying = false;
        this.liveStreamAbort = true;
        this.playPauseBtn.textContent = '▶️ Tęsti';
        this.stopTimer();

        // Stop animated face from speaking
        if (this.animatedFace) {
            this.animatedFace.stop();
        }

        if (this.currentAudioElement) {
            try {
                this.currentAudioElement.pause();
            } catch (error) {
                console.warn('Nepavyko pristabdyti audio elemento:', error);
            }
        }
    }

    restart() {
        this.pause();
        this.liveStreamGeneration += 1;
        this.liveStreamAbort = false;
        this.livePlaybackBusy = false;
        this.completedEventsCount = 0;
        this.audioGateActive = false;
        this.audioGateToken++;
        this.pendingAudioCompletion = null;
        this.currentTime = 0;
        this.currentEventIndex = 0;
        this.stopCurrentAudio();
        this.updateDisplay();

        // Reset UI
        this.updatesContainer.innerHTML = `
            <div class="update-item">
                <div class="update-time">09:55</div>
                <div class="update-text">Seimo nariai registruojasi posėdžiui</div>
            </div>
        `;
        
        this.speakerName.textContent = 'Laukiama posėdžio pradžios';
        this.speakerTitle.textContent = '';
        this.speakerParty.textContent = '';
        this.currentSpeech.textContent = 'Posėdis prasidės netrukus';
    }

    skipToNextEvent() {
        if (!Array.isArray(this.events) || this.events.length === 0) {
            return;
        }

        this.stopCurrentAudio();

        if (this.streamLiveFromTTS) {
            const total = this.events.length;
            if (this.currentEventIndex >= total) {
                this.pause();
                this.updateDisplay();
                return;
            }

            const skippedIndex = Math.min(this.currentEventIndex, total - 1);
            const nextIndex = skippedIndex + 1;

            this.liveStreamGeneration += 1;
            this.livePlaybackBusy = false;
            this.liveStreamAbort = false;
            this.eventAudioPromises.delete(skippedIndex);
            this.audioAssets.delete(skippedIndex);

            this.completedEventsCount = Math.min(total, Math.max(this.completedEventsCount, skippedIndex + 1));

            if (nextIndex >= total) {
                this.currentEventIndex = total;
                this.pause();
                this.updateDisplay();
                return;
            }

            this.currentEventIndex = nextIndex;
            const nextEvent = this.events[nextIndex];
            if (nextEvent) {
                this.currentTime = nextEvent.time;
                this.displayEvent(nextEvent, nextIndex);
            }
            this.updateDisplay();
            return;
        }

        // Invalidate the gate-release handler for the clip we are skipping.
        this.audioGateActive = false;
        this.audioGateToken++;

        const nextIndex = this.currentEventIndex;
        if (nextIndex >= this.events.length) {
            this.pause();
            this.updateDisplay();
            return;
        }

        if (this.isStoredAudioMode()) {
            this.playGatedEvent(); // plays events[nextIndex], re-gates, increments index
            this.updateDisplay();
            return;
        }

        const nextEvent = this.events[nextIndex];
        this.currentTime = nextEvent.time;
        this.displayEvent(nextEvent, nextIndex);
        this.currentEventIndex = Math.min(nextIndex + 1, this.events.length);
        this.completedEventsCount = Math.min(this.events.length, this.currentEventIndex);
        this.updateDisplay();
    }

    startTimer() {
        this.stopTimer();
        this.intervalId = setInterval(() => {
            const appliedSpeed = this.speedMultiplier || 1;
            // While a stored audio clip is playing, freeze the timeline so the
            // next speaker does not interrupt the current one.
            if (!this.audioGateActive) {
                this.currentTime += appliedSpeed * 0.1;
            }
            this.updateDisplay();
            this.checkEvents();

            if (this.audioGateActive) {
                return;
            }

            if (!this.streamLiveFromTTS && this.currentTime >= this.totalDuration) {
                this.pause();
                this.currentTime = this.totalDuration;
            } else if (this.streamLiveFromTTS &&
                this.currentEventIndex >= this.events.length &&
                !this.livePlaybackBusy) {
                this.pause();
            }
        }, 100);
    }

    stopTimer() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    updateDisplay() {
        const totalEvents = Math.max(this.events.length, 1);
        const progress = this.streamLiveFromTTS
            ? (this.completedEventsCount / totalEvents) * 100
            : (this.currentTime / this.totalDuration) * 100;
        const boundedProgress = Math.min(progress, 100);
        this.progressFill.style.width = boundedProgress + '%';
        this.timelineProgress.style.width = boundedProgress + '%';
        
        const currentMinutes = Math.floor(this.currentTime + 600);
        const currentHours = Math.floor(currentMinutes / 60);
        const mins = currentMinutes % 60;
        
        this.currentTimeDisplay.textContent = 
            `2025-09-13 ${currentHours}:${mins.toString().padStart(2, '0')}`;
        
        const displayMinutes = Math.floor(this.currentTime);
        const displaySeconds = Math.floor((this.currentTime % 1) * 60);
        const totalDisplayMinutes = Math.floor(this.totalDuration);
        
        this.timeDisplay.textContent = 
            `${Math.floor(displayMinutes / 60)}:${(displayMinutes % 60).toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')} / ${Math.floor(totalDisplayMinutes / 60)}:${(totalDisplayMinutes % 60).toString().padStart(2, '0')}:00`;

        // Update agenda active item
        this.updateActiveAgendaItem();
    }

    updateActiveAgendaItem() {
        const agendaItems = document.querySelectorAll('.agenda-item');
        agendaItems.forEach(item => item.classList.remove('active'));

        const currentEvent = this.events[this.currentEventIndex - 1];
        if (currentEvent) {
            const matchingItem = Array.from(agendaItems).find(item => 
                item.getAttribute('data-time') === currentEvent.timestamp
            );
            if (matchingItem) {
                matchingItem.classList.add('active');
            }
        }
    }

    checkEvents() {
        if (this.streamLiveFromTTS) {
            if (this.livePlaybackBusy || this.currentEventIndex >= this.events.length) {
                return;
            }

            const nextEvent = this.events[this.currentEventIndex];
            if (!nextEvent) {
                return;
            }

            if (this.currentTime >= nextEvent.time || this.currentEventIndex === 0) {
                this.livePlaybackBusy = true;
                this.displayEvent(nextEvent, this.currentEventIndex);
            }
            return;
        }

        // Stored-audio playback: advance strictly one speaker at a time, only
        // after the previous clip has finished (or the user skips). This avoids
        // a long clip being cut off by the next event firing on the model clock.
        if (this.isStoredAudioMode()) {
            if (this.audioGateActive || this.currentEventIndex >= this.events.length) {
                return;
            }
            this.playGatedEvent();
            return;
        }

        // No audio: fall back to the model-time schedule.
        while (this.currentEventIndex < this.events.length &&
               this.currentTime >= this.events[this.currentEventIndex].time) {

            const event = this.events[this.currentEventIndex];
            this.displayEvent(event, this.currentEventIndex);
            this.currentEventIndex++;
            this.completedEventsCount = this.currentEventIndex;
        }
    }

    isStoredAudioMode() {
        return this.textToSpeechEnabled &&
            !this.streamLiveFromTTS &&
            this.audioAssets && this.audioAssets.size > 0;
    }

    // Display the current event, start its audio, and hold the timeline until
    // that audio ends. If the event has no audio, release immediately.
    playGatedEvent() {
        const index = this.currentEventIndex;
        const event = this.events[index];
        if (!event) {
            return;
        }

        this.currentTime = event.time;
        this.audioGateActive = true;
        const token = ++this.audioGateToken;

        this.displayEvent(event, index);
        this.currentEventIndex = index + 1;
        this.completedEventsCount = this.currentEventIndex;

        const audioEl = this.currentAudioElement;
        if (audioEl && this.textToSpeechEnabled) {
            const release = () => {
                audioEl.removeEventListener('ended', release);
                audioEl.removeEventListener('error', release);
                if (token !== this.audioGateToken) {
                    return; // superseded by skip/restart
                }
                this.audioGateActive = false;
                const next = this.events[this.currentEventIndex];
                this.currentTime = next ? next.time : this.totalDuration;
                if (this.currentEventIndex >= this.events.length) {
                    this.currentTime = this.totalDuration;
                    this.pause();
                    this.updateDisplay();
                }
            };
            audioEl.addEventListener('ended', release, { once: true });
            audioEl.addEventListener('error', release, { once: true });
        } else {
            // Audio not ready yet for this event — don't stall the timeline.
            this.audioGateActive = false;
        }
    }

    displayEvent(event, eventIndex) {
        if (this.streamLiveFromTTS && !this.livePlaybackBusy) {
            this.livePlaybackBusy = true;
        }

        // Update speaker info
        this.speakerName.textContent = event.speaker;
        this.speakerTitle.textContent = event.title || '';
        this.speakerParty.textContent = event.party || '';
        this.currentSpeech.textContent = event.text;
        const representationLabel = document.getElementById('stageRepresentationLabel');
        if (representationLabel) {
            representationLabel.textContent = 'Sintetinis avataras';
            representationLabel.title = 'Stilizuotas dirbtinis personažas; neatvaizduoja tikro žmogaus. / Stylized synthetic avatar; does not depict a real person.';
            representationLabel.hidden = false;
        }

        // Switch the talking-head portrait to the current speaker.
        if (this.animatedFace && typeof this.animatedFace.setSpeaker === 'function') {
            const persona = (this.seimasMembers || []).find(member => member && member.name === event.speaker) || {};
            this.animatedFace.setSpeaker({
                name: event.speaker,
                party: event.party,
                title: event.title,
                gender: this.genderForSpeaker(event.speaker),
                personality: persona.personality,
                tone: persona.tone
            });
        }

        // Add live update (with per-message audio download when available)
        this.addLiveUpdate(event.timestamp, event.update, eventIndex);

        // Update party color
        this.updatePartyColor(event.party);

        this.playAudioForEvent(eventIndex, event);
    }

    playAudioForEvent(eventIndex, event) {
        if (!this.textToSpeechEnabled) {
            if (this.streamLiveFromTTS) {
                this.completeLiveEventWithoutAudio(eventIndex);
            }
            return;
        }

        if (this.streamLiveFromTTS) {
            this.playLiveUploadedAudio(eventIndex, event);
            return;
        }

        const asset = this.audioAssets.get(eventIndex);
        if (!asset) {
            const provider = this.currentTTSOptions?.provider || this.getTextToSpeechProvider();
            const hasCredentials = provider === 'openai'
                ? Boolean((this.currentTTSOptions?.apiKey || this.apiKeyInput?.value?.trim()))
                : provider === 'xai'
                    ? Boolean((this.currentTTSOptions?.apiKey || this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey))
                    : this.ensureSpeachesConfigured();
            if (!this.audioPreparationPromise && hasCredentials) {
                const timestamp = this.lastTranscriptTimestamp || new Date();
                const ttsOptions = this.currentTTSOptions || this.buildDefaultTTSOptions();
                this.currentTTSOptions = ttsOptions;
                this.prepareTextToSpeechAssets({
                    title: this.sessionTitle?.textContent,
                    topic: this.sessionTopic?.textContent,
                    events: this.events
                }, timestamp, this.currentSessionStorageContext, ttsOptions).catch(error => {
                    console.warn('Nepavyko generuoti audio pagal poreikį:', error);
                });
            }
            return;
        }

        this.startPlaybackFromAsset(eventIndex, event, asset);
    }

    startPlaybackFromAsset(eventIndex, event, asset, { awaitCompletion = false } = {}) {
        this.stopCurrentAudio();

        const audioElement = asset.element || new Audio(asset.url);
        audioElement.preload = 'auto';
        if ('preservesPitch' in audioElement) {
            audioElement.preservesPitch = false;
        } else if ('mozPreservesPitch' in audioElement) {
            audioElement.mozPreservesPitch = false;
        }

        const baseRate = asset.basePlaybackRate || 1;
        const rateMultiplier = this.speedMultiplier || 1;
        audioElement.currentTime = 0;
        audioElement.playbackRate = baseRate * rateMultiplier;

        this.currentAudioElement = audioElement;
        asset.element = audioElement;
        this.audioAssets.set(eventIndex, asset);

        if (this.animatedFace && typeof this.animatedFace.syncWithAudioElement === 'function') {
            this.animatedFace.syncWithAudioElement(audioElement, event?.text || '');
        }

        const playPromise = audioElement.play().catch(error => {
            console.warn('Nepavyko paleisti sugeneruoto audio:', error);
        });

        if (!awaitCompletion) {
            return playPromise;
        }

        return new Promise(resolve => {
            const cleanup = () => {
                if (this.pendingAudioCompletion === cleanup) {
                    this.pendingAudioCompletion = null;
                }
                audioElement.removeEventListener('ended', cleanup);
                audioElement.removeEventListener('error', cleanup);
                resolve();
            };
            this.pendingAudioCompletion = cleanup;
            audioElement.addEventListener('ended', cleanup, { once: true });
            audioElement.addEventListener('error', cleanup, { once: true });
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => cleanup());
            }
        });
    }

    async playLiveUploadedAudio(eventIndex, event) {
        if (!event || !event.text) {
            this.completeLiveEventWithoutAudio(eventIndex);
            return;
        }

        const provider = this.currentTTSOptions?.provider || this.getTextToSpeechProvider();
        const providerOptions = this.currentTTSOptions || this.buildDefaultTTSOptions();
        if (this.unavailableLiveTTSProvider === provider) {
            this.completeLiveEventWithoutAudio(eventIndex);
            return;
        }
        if (provider === 'openai') {
            const apiKey = providerOptions?.apiKey || this.apiKeyInput?.value?.trim();
            if (!apiKey) {
                this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad balsai būtų atkuriami realiu laiku.', 'error');
                this.completeLiveEventWithoutAudio(eventIndex);
                return;
            }
            providerOptions.apiKey = apiKey;
        } else if (provider === 'xai') {
            const apiKey = providerOptions?.apiKey || this.xaiApiKeyInput?.value?.trim() || this.xaiGenerationSettings?.apiKey;
            if (!apiKey) {
                this.updateTextToSpeechStatus('⚠️ Įveskite xAI (Grok) API raktą, kad balsai būtų atkuriami realiu laiku.', 'error');
                this.completeLiveEventWithoutAudio(eventIndex);
                return;
            }
            providerOptions.apiKey = apiKey;
        } else if (!this.ensureSpeachesConfigured()) {
            this.completeLiveEventWithoutAudio(eventIndex);
            return;
        }

        const generation = this.liveStreamGeneration;
        const speakerLabel = event.speaker || `Seimo narys ${eventIndex + 1}`;

        const runPlayback = async () => {
            try {
                this.updateTextToSpeechStatus(`🔄 Generuojamas balsas (${this.providerDisplayName(provider)}): ${speakerLabel}`, 'processing');
                const asset = await this.ensureLiveAudioAsset(eventIndex, event, providerOptions);
                if (!this.isPlaying || this.liveStreamAbort || generation !== this.liveStreamGeneration) {
                    return;
                }
                await this.startPlaybackFromAsset(eventIndex, event, asset, {
                    awaitCompletion: true
                });
                if (generation === this.liveStreamGeneration) {
                    this.updateTextToSpeechStatus(`🔊 Pasisakymas atkurtas: ${speakerLabel}`, 'success');
                }
            } catch (error) {
                console.error('Live TTS playback error:', error);
                const cannotReachSpeaches = provider === 'speaches'
                    && String(error?.message || '').includes('Nepavyko pasiekti Speaches serverio');
                if (cannotReachSpeaches) {
                    this.unavailableLiveTTSProvider = provider;
                    const endpoint = this.getSpeachesEndpoint('audio/speech');
                    const message = this.sessionLanguage === 'en'
                        ? `Transcript is ready; continuing without speech because Speaches is unreachable at ${endpoint}. Start it with “cd speaches && docker compose -f compose.cpu.yaml up speaches”, or switch to OpenAI/xAI TTS in Settings.`
                        : `Stenograma paruošta; tęsiame be garso, nes Speaches nepasiekiamas adresu ${endpoint}. Paleiskite „cd speaches && docker compose -f compose.cpu.yaml up speaches“ arba nustatymuose pasirinkite OpenAI / xAI TTS.`;
                    this.updateTextToSpeechStatus(`⚠️ ${message}`, 'error');
                } else {
                    this.updateTextToSpeechStatus('⚠️ Nepavyko sugeneruoti audio šiam pasisakymui. Bandome tęsti.', 'error');
                }
                await this.waitAfterLiveAudioIssue();
            } finally {
                this.finalizeLivePlayback(eventIndex, generation);
            }
        };

        runPlayback();
    }

    async ensureLiveAudioAsset(eventIndex, event, providerOptions = {}) {
        if (this.audioAssets.has(eventIndex)) {
            return this.audioAssets.get(eventIndex);
        }

        if (this.eventAudioPromises.has(eventIndex)) {
            return this.eventAudioPromises.get(eventIndex);
        }

        const promise = (async () => {
            const provider = providerOptions?.provider || this.getTextToSpeechProvider();
            const voiceProfile = this.getVoiceForSpeaker(event.speaker || `Seimo narys ${eventIndex + 1}`);
            const audioBlob = await this.synthesizeSpeech(event.text, voiceProfile, provider, providerOptions);
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = new Audio(audioUrl);
            audioElement.preload = 'auto';
            if ('preservesPitch' in audioElement) {
                audioElement.preservesPitch = false;
            } else if ('mozPreservesPitch' in audioElement) {
                audioElement.mozPreservesPitch = false;
            }

            const basePlaybackRate = voiceProfile.rateMultiplier || 1;
            const asset = {
                url: audioUrl,
                blob: audioBlob,
                element: audioElement,
                basePlaybackRate,
                voice: voiceProfile.voice,
                voiceKey: voiceProfile.key,
                speaker: event.speaker || '',
                eventIndex
            };

            this.audioAssets.set(eventIndex, asset);
            return asset;
        })();

        this.eventAudioPromises.set(eventIndex, promise);
        try {
            return await promise;
        } finally {
            this.eventAudioPromises.delete(eventIndex);
        }
    }

    async waitAfterLiveAudioIssue() {
        return new Promise(resolve => setTimeout(resolve, 750));
    }

    finalizeLivePlayback(eventIndex, generation) {
        if (generation !== this.liveStreamGeneration) {
            this.livePlaybackBusy = false;
            return;
        }

        const completed = Math.max(this.completedEventsCount + 1, eventIndex + 1);
        this.completedEventsCount = Math.min(completed, this.events.length);
        this.currentEventIndex = eventIndex + 1;
        this.livePlaybackBusy = false;
        this.pendingAudioCompletion = null;

        if (this.currentEventIndex >= this.events.length && this.isPlaying) {
            this.pause();
        }
    }

    completeLiveEventWithoutAudio(eventIndex) {
        const completed = Math.max(this.completedEventsCount + 1, eventIndex + 1);
        this.completedEventsCount = Math.min(completed, this.events.length);
        this.currentEventIndex = eventIndex + 1;
        this.livePlaybackBusy = false;
        this.pendingAudioCompletion = null;
    }

    updatePartyColor(party) {
        const partyColors = {
            'LSDP': '#d32f2f',
            'TS-LKD': '#1976d2',
            'Nemuno aušra': '#7b1fa2',
            'DSVL': '#388e3c',
            'Liberalų sąjūdis': '#f57c00',
            'LVŽS': '#689f38',
            'LLRA-KŠS': '#795548',
            'Nepriklausomas': '#607d8b'
        };

        const color = partyColors[party] || '#d4232a';
        this.speakerParty.style.backgroundColor = color;
    }

    addLiveUpdate(time, text, eventIndex = null) {
        const updateItem = document.createElement('div');
        updateItem.className = 'update-item new';
        const safeTime = this.sanitizeText(time);
        const safeText = this.sanitizeText(text);
        const hasAudio = (typeof eventIndex === 'number') && this.audioAssets && this.audioAssets.has(eventIndex);
        const audioBtn = hasAudio
            ? `<button class="update-audio-btn" data-audio-index="${eventIndex}" title="Atsisiųsti šio pasisakymo audio">⬇️ Audio</button>`
            : '';
        updateItem.innerHTML = `
            <div class="update-time">${safeTime}</div>
            <div class="update-text">${safeText}${audioBtn}</div>
        `;

        this.updatesContainer.insertBefore(updateItem, this.updatesContainer.firstChild);

        setTimeout(() => {
            updateItem.classList.remove('new');
        }, 500);

        const updates = this.updatesContainer.children;
        while (updates.length > 15) {
            this.updatesContainer.removeChild(updates[updates.length - 1]);
        }
    }

    seekToTime(e) {
        if (this.streamLiveFromTTS) {
            this.updateTextToSpeechStatus('ℹ️ Negalima persukti transliuojamos sesijos. Palaukite, kol baigsis einamas pasisakymas.', 'info');
            return;
        }

        const rect = e.target.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        this.currentTime = clickPosition * this.totalDuration;
        
        this.currentEventIndex = 0;
        while (this.currentEventIndex < this.events.length && 
               this.currentTime > this.events[this.currentEventIndex].time) {
            this.currentEventIndex++;
        }
        
        this.updateDisplay();
        if (this.currentEventIndex > 0) {
            const lastIndex = this.currentEventIndex - 1;
            this.displayEvent(this.events[lastIndex], lastIndex);
        }
    }
}

// Expose initializer so React UI can trigger once the DOM is ready
window.initializeSeimasLiveStream = function initializeSeimasLiveStream() {
    if (!window.__seimasLiveStreamInstance) {
        window.__seimasLiveStreamInstance = new EnhancedSeimasLiveStream();
    }
    return window.__seimasLiveStreamInstance;
};
