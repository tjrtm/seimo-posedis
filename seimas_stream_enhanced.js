// Enhanced Seimas Live Stream with OpenAI Integration
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
        this.eventAudioPromises = new Map();
        this.pendingAudioCompletion = null;
        this.liveStreamGeneration = 0;
        this.availableVoices = [
            { voice: 'alloy', key: 'alloy', label: 'Alloy' },
            { voice: 'echo', key: 'echo', label: 'Echo' },
            { voice: 'fable', key: 'fable', label: 'Fable' },
            { voice: 'onyx', key: 'onyx', label: 'Onyx' },
            { voice: 'nova', key: 'nova', label: 'Nova' },
            { voice: 'shimmer', key: 'shimmer', label: 'Shimmer' },
            { voice: 'coral', key: 'coral', label: 'Coral' },
            { voice: 'verse', key: 'verse', label: 'Verse' },
            { voice: 'ballad', key: 'ballad', label: 'Ballad' },
            { voice: 'ash', key: 'ash', label: 'Ash' },
            { voice: 'sage', key: 'sage', label: 'Sage' },
            { voice: 'marin', key: 'marin', label: 'Marin' },
            { voice: 'cedar', key: 'cedar', label: 'Cedar' }
        ];

        this.initializeElements();
        this.initializeAnimatedFace();
        this.loadSeimasMembers();
        this.setupEventListeners();
        this.loadAPIKey();
        this.loadTextToSpeechPreference();
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

        // Modal elements
        this.membersBtn = document.getElementById('membersBtn');
        this.membersModal = document.getElementById('membersModal');
        this.closeModal = document.getElementById('closeModal');
        this.membersGrid = document.getElementById('membersGrid');
        this.memberProfile = document.getElementById('memberProfile');
    }

    initializeAnimatedFace() {
        // Initialize the animated face in the chambersView container
        if (typeof AnimatedFace !== 'undefined') {
            try {
                this.animatedFace = new AnimatedFace('chambersView');
                console.log('AnimatedFace initialized successfully');
            } catch (error) {
                console.error('Error initializing AnimatedFace:', error);
            }
        } else {
            console.warn('AnimatedFace class not found - face animation disabled');
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
        
        this.memberProfile.classList.add('active');
        this.membersGrid.style.display = 'none';
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

        // Modal
        this.membersBtn.addEventListener('click', () => this.showMembersModal());
        this.closeModal.addEventListener('click', () => this.hideMembersModal());
        this.membersModal.addEventListener('click', (e) => {
            if (e.target === this.membersModal) this.hideMembersModal();
        });

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
        this.setupPanel.classList.toggle('active');
        if (this.setupPanel.classList.contains('active')) {
            this.toggleSetupBtn.textContent = '❌ Uždaryti setup';
        } else {
            this.toggleSetupBtn.textContent = '⚙️ Generuoti naują posėdį';
        }
    }

    showMembersModal() {
        this.membersModal.style.display = 'block';
        this.membersGrid.style.display = 'grid';
        this.memberProfile.classList.remove('active');
    }

    hideMembersModal() {
        this.membersModal.style.display = 'none';
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
        }
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
                this.updateTextToSpeechStatus('🔊 Teksto į kalbą funkcija aktyvuota. Sugeneruokite posėdį, kad būtų sukurtos kalbos.', 'success');
            } else {
                this.updateTextToSpeechStatus('🔇 Teksto į kalbą funkcija išjungta.', 'info');
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
        try {
            localStorage.setItem('seimas_tts_enabled', this.textToSpeechEnabled ? 'true' : 'false');
        } catch (error) {
            console.warn('Nepavyko išsaugoti TTS nustatymo į localStorage:', error);
        }

        if (this.textToSpeechEnabled) {
            this.updateTextToSpeechStatus('🔊 Teksto į kalbą funkcija aktyvuota. Naudojamas gpt-4o-mini-tts modelis su unikaliomis balsų kombinacijomis.', 'success');

            if (this.events.length > 0) {
                if (this.streamLiveFromTTS) {
                    const apiKey = this.apiKeyInput.value.trim();
                    if (apiKey) {
                        this.updateTextToSpeechStatus('🔄 Pasisakymai bus atkuriami realiu laiku. Spauskite „Paleisti“, kad pradėtumėte.', 'processing');
                    } else {
                        this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad būtų galima generuoti balsus.', 'error');
                    }
                    return;
                }

                const apiKey = this.apiKeyInput.value.trim();
                if (apiKey) {
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

                    this.prepareTextToSpeechAssets(transcriptInfo, apiKey, timestamp, storageContext).catch(error => {
                        console.error('TTS preparation failed on toggle:', error);
                    });
                } else {
                    this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad būtų galima generuoti balsus.', 'error');
                }
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

    resetVoiceAssignments() {
        this.voiceAssignments.clear();
        this.usedVoiceKeys.clear();
        this.availableVoiceQueue = this.availableVoices.map(profile => ({ ...profile }));
    }

    createDerivedVoiceProfile(index) {
        const variantIndex = index + 1;
        const rateMultiplier = 1 + (variantIndex % 6) * 0.035;
        return {
            voice: 'alloy',
            key: `alloy-variant-${variantIndex}`,
            label: `Alloy variant ${variantIndex}`,
            rateMultiplier
        };
    }

    getVoiceForSpeaker(speakerName) {
        if (this.voiceAssignments.has(speakerName)) {
            return this.voiceAssignments.get(speakerName);
        }

        let assignedProfile = null;

        while (this.availableVoiceQueue.length > 0 && !assignedProfile) {
            const candidate = this.availableVoiceQueue.shift();
            const key = candidate.key || candidate.voice;
            if (!this.usedVoiceKeys.has(key)) {
                assignedProfile = { ...candidate, rateMultiplier: candidate.rateMultiplier || 1 };
                this.usedVoiceKeys.add(key);
            }
        }

        if (!assignedProfile) {
            const fallbackIndex = this.voiceAssignments.size;
            assignedProfile = this.createDerivedVoiceProfile(fallbackIndex);
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

    async prepareTextToSpeechAssets(transcriptData, apiKey, timestamp, storageContext = null) {
        if (typeof window === 'undefined' || !this.textToSpeechEnabled) {
            return null;
        }

        if (!apiKey) {
            this.updateTextToSpeechStatus('⚠️ Reikalingas OpenAI API raktas teksto į kalbą generavimui.', 'error');
            return null;
        }

        if (this.audioPreparationPromise) {
            return this.audioPreparationPromise;
        }

        this.audioPreparationPromise = this._prepareTextToSpeechAssets(transcriptData, apiKey, timestamp, storageContext);
        try {
            return await this.audioPreparationPromise;
        } finally {
            this.audioPreparationPromise = null;
        }
    }

    async _prepareTextToSpeechAssets(transcriptData, apiKey, timestamp, storageContext = null) {
        try {
            const events = Array.isArray(transcriptData?.events) ? transcriptData.events : [];
            if (events.length === 0) {
                this.updateTextToSpeechStatus('🔇 Nėra įvykių, kuriuos būtų galima paversti garsu.', 'info');
                return null;
            }

            this.updateTextToSpeechStatus('🔄 Generuojami balsai naudojant gpt-4o-mini-tts...', 'processing');

            this.clearAudioAssets();
            this.resetVoiceAssignments();

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

            for (let index = 0; index < events.length; index++) {
                const event = events[index];
                if (!event || !event.text) {
                    continue;
                }

                const speakerName = event.speaker || `Seimo narys ${index + 1}`;
                const voiceProfile = this.getVoiceForSpeaker(speakerName);

                try {
                    const audioBlob = await this.requestSpeechFromOpenAI(event.text, voiceProfile, apiKey);
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
                            const fileName = `${iso}-${slug}-event-${String(index + 1).padStart(3, '0')}.mp3`;
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
                        file: savedFile
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
                        model: 'gpt-4o-mini-tts',
                        createdAt: preparationTimestamp.toISOString(),
                        sessionTitle: transcriptData.title || 'Seimo posėdis',
                        sessionTopic: transcriptData.topic || '',
                        audioDirectory: audioDirectoryDetails.path,
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
                    this.updateTextToSpeechStatus(`🔊 Sugeneruota ${mapping.length} kalbų, ${savedInfo} įrašyta į katalogą naudojant gpt-4o-mini-tts.`, 'success');
                } else {
                    this.updateTextToSpeechStatus(`🔊 Sugeneruota ${mapping.length} kalbų (vietinis atkūrimas).`, 'success');
                }
            } else if (errors.length > 0) {
                this.updateTextToSpeechStatus('⚠️ Nepavyko sugeneruoti audio failų. Peržiūrėkite konsolę.', 'error');
            } else {
                this.updateTextToSpeechStatus('🔇 Nepavyko sugeneruoti audio įrašų šiam posėdžiui.', 'info');
            }

            return {
                model: 'gpt-4o-mini-tts',
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

    async requestSpeechFromOpenAI(text, voiceProfile, apiKey) {
        const payload = {
            model: 'gpt-4o-mini-tts',
            voice: voiceProfile.voice,
            input: text
        };

        if (voiceProfile.style) {
            payload.style = voiceProfile.style;
        }

        const response = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
            throw new Error(error.error?.message || 'OpenAI TTS API klaida');
        }

        const arrayBuffer = await response.arrayBuffer();
        return new Blob([arrayBuffer], { type: 'audio/mpeg' });
    }

    async generateTranscript() {
        const question = this.questionInput.value.trim();
        const apiKey = this.apiKeyInput.value.trim();

        if (!question) {
            alert('Prašome įvesti klausimą svarstymui');
            return;
        }

        if (!apiKey || !apiKey.startsWith('sk-')) {
            alert('Prašome įvesti galiojantį OpenAI API raktą');
            return;
        }

        this.saveAPIKey();
        this.showLoading(true);

        try {
            const transcript = await this.callOpenAI(question, apiKey);
            await this.processGeneratedTranscript(transcript, question, apiKey);
            this.setupPanel.classList.remove('active');
            this.toggleSetupBtn.textContent = '⚙️ Generuoti naują posėdį';
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
            this.generateTranscriptBtn.textContent = '🚀 Generuoti pilną Seimo posėdžio stenogramą';
        }
    }

    async callOpenAI(question, apiKey) {
        const prompt = this.buildPrompt(question);
        
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-5-mini',
                input: [
                    {
                        role: 'system',
                        content: 'Jūs esate ekspertas Lietuvos parlamento posėdžių simuliavime ir politikos analizės specialistas. Jūsų užduotis - sukurti ypač detalų, realistišką Seimo posėdžio transkriptą su giliais politiniais argumentais, statistiniais duomenimis, tarptautiniais palyginimais ir nuodugniais narių pasisakymais. Kiekvienas narys turi kalbėti pagal savo politinę ideologiją ir specialybę, pateikdamas konkretų, išsamų turinį su pavyzdžiais, skaičiais ir argumentuotomis pozicijomis. SVARBU: Atsakykite TIKTAI JSON formatu.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_output_tokens: 100000, // Increased for detailed content with GPT-5-mini
                reasoning: {
                    effort: 'medium' // Correct parameter structure for Responses API
                }
            })
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

    buildPrompt(question) {
        const memberProfiles = this.seimasMembers.slice(0, 20).map(member => 
            `${member.name} (${member.party}): ${member.personality}`
        ).join('\n');

        return `
Sukurkite ypač išsamų ir realistišką Lietuvos Respublikos Seimo posėdžio transkriptą šiai temai: "${question}"

SEIMO NARIŲ PROFILIAI (naudokite tikrus vardus ir jų specialybes):
${memberProfiles}

DETALIZUOTI REIKALAVIMAI:

1. POSĖDŽIO STRUKTŪRA (3 valandos, 10:00-13:00):
   - 10:00 - Posėdžio atidarymas (S. Skvernelis su procedūriniais paaiškinimais)
   - 10:05 - Darbotvarkės pristatymas (detalus)
   - 10:15 - Pagrindinis pranešimas (ministerijos atstovas su statistikomis)
   - 10:45 - Frakcijų kalbos (kiekviena po 8-12 min., išsamios pozicijos)
   - 11:45 - 15 min pertrauka
   - 12:00 - Intensyvios diskusijos ir tarpusavio klausimai
   - 12:45 - Rezoliucijos svarstymas su pataisomis
   - 13:00 - Balsavimas su komentarais

2. KALBOS KOKYBĖS REIKALAVIMAI:
   - Kiekvienas narys kalba 150-400 žodžių (ne trumpai!)
   - Naudojami konkretūs statistiniai duomenys ir skaičiai
   - Pateikiami tarptautinių šalių pavyzdžiai
   - Cituojami ekspertų tyrimai ir ES direktyvos
   - Argumentai grindžiami ekonomikos teorijomis
   - Keliamos konkretūs klausimai kitiems nariams

3. FRAKCIJŲ IDEOLOGINĖS POZICIJOS:
   - LSDP: Socialinė apsauga, darbuotojų teisės, perkvalifikavimas
   - TS-LKD: Ekonominis efektyvumas, konkurencingumas, fiskalinė atsakomybė
   - Nemuno aušra: Piliečių teisės, demokratijos stiprinimas, žalieji sprendimai
   - DSVL: Pragmatiškas požiūris, kompromisai, regionų interesai
   - Liberalai: Laisvos rinkos principai, inovacijos, mažiau reguliavimo
   - LVŽS: Kaimo interesai, žemės ūkis, tradicinės vertybės

4. DISKUSIJŲ TURINYS:
   - Nagrinėjami ekonominiai poveikiai su skaičiais
   - Analizuojamos socialinės pasekmės su pavyzdžiais
   - Keliami procedūriniai ir konstituciniai klausimai
   - Diskutuojamos praktinio įgyvendinimo detalės
   - Pateikiamos alternatyvos ir kompromisai

5. BALSAVIMO REALIZMAS:
   - Pateikite konkrečius rezultatus pagal partijų dydžius
   - Įtraukite susilaikžiusius ir nesutariančius narių balso

FORMATAS - JSON objektas su šia struktūra:
{
  "title": "Išsamus posėdžio pavadinimas",
  "topic": "Tema su kontekstu",
  "events": [
    {
      "time": laiko_minutėmis,
      "timestamp": "HH:MM",
      "type": "tipas",
      "speaker": "Vardas Pavardė",
      "title": "Pareigos",
      "party": "Partija",
      "text": "ILGAS, DETALUS KALBOS TEKSTAS SU ARGUMENTAIS, SKAIČIAIS IR PAVYZDŽIAIS",
      "update": "Informatyvi santrauka"
    }
  ]
}

SVARBU: Generuokite 50-60 įvykių su ypač detaliais, argumentuotais transkriptais. Kiekvienas pasisakymas turi turėti konkretų turinį, o ne bendras frazes!
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

    async processGeneratedTranscript(transcriptJson, question, apiKey) {
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
                    audioMetadata = await this.prepareTextToSpeechAssets(
                        transcriptData,
                        apiKey,
                        transcriptTimestamp,
                        sessionStorageContext
                    );
                    if (audioMetadata?.mapping?.length) {
                        this.addLiveUpdate('10:02', `Sugeneruota ${audioMetadata.mapping.length} unikalių pasisakymų balsų (gpt-4o-mini-tts).`);
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
            const apiKey = this.apiKeyInput?.value?.trim();
            if (audioMetadata?.storageFolder && audioMetadata?.mapping?.length) {
                this.addLiveUpdate('10:01', `🔊 Sesijos aplankas: ${audioMetadata.storageFolder}. Naudokite „Atverti sesijos aplanką“, kad būtų įkelti audio failai.`);
            }

            if (this.textToSpeechEnabled) {
                if (apiKey) {
                    this.updateTextToSpeechStatus('🔄 Pasisakymai bus sintetinti realiu laiku. Spauskite „Paleisti“, kad pradėtumėte srautą.', 'processing');
                } else {
                    this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad balsai būtų sugeneruoti realiu laiku.', 'error');
                }
            } else if (audioMetadata?.enabled) {
                this.addLiveUpdate('10:02', 'Ši sesija turi teksto į kalbą metaduomenis. Įjunkite funkciją ir įveskite API raktą, kad atkurtumėte balsus.');
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
            const apiKey = this.apiKeyInput?.value?.trim();
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
                    if (apiKey) {
                        this.updateTextToSpeechStatus('ℹ️ Audio metaduomenys rasti, tačiau failai neprieinami. Pasisakymai bus atkuriami realiu laiku.', 'processing');
                    } else {
                        this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad sugeneruotumėte balsus realiu laiku.', 'error');
                    }
                }
            } else {
                if (this.textToSpeechEnabled) {
                    if (apiKey) {
                        this.updateTextToSpeechStatus('🔄 Ši sesija neturi audio failų. Visi pasisakymai bus įgarsinami realiu laiku.', 'processing');
                    } else {
                        this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad sugeneruotumėte balsus realiu laiku.', 'error');
                    }
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

        const nextIndex = this.currentEventIndex;
        if (nextIndex >= this.events.length) {
            this.pause();
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
            this.currentTime += appliedSpeed * 0.1;
            this.updateDisplay();
            this.checkEvents();
            
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

        while (this.currentEventIndex < this.events.length &&
               this.currentTime >= this.events[this.currentEventIndex].time) {

            const event = this.events[this.currentEventIndex];
            this.displayEvent(event, this.currentEventIndex);
            this.currentEventIndex++;
            this.completedEventsCount = this.currentEventIndex;
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

        // Add live update
        this.addLiveUpdate(event.timestamp, event.update);

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
            if (!this.audioPreparationPromise) {
                const apiKey = this.apiKeyInput?.value?.trim();
                if (apiKey) {
                    const timestamp = this.lastTranscriptTimestamp || new Date();
                    this.prepareTextToSpeechAssets({
                        title: this.sessionTitle?.textContent,
                        topic: this.sessionTopic?.textContent,
                        events: this.events
                    }, apiKey, timestamp).catch(error => {
                        console.warn('Nepavyko generuoti audio pagal poreikį:', error);
                    });
                }
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

        const apiKey = this.apiKeyInput?.value?.trim();
        if (!apiKey) {
            this.updateTextToSpeechStatus('⚠️ Įveskite OpenAI API raktą, kad balsai būtų atkuriami realiu laiku.', 'error');
            this.completeLiveEventWithoutAudio(eventIndex);
            return;
        }

        const generation = this.liveStreamGeneration;
        const speakerLabel = event.speaker || `Seimo narys ${eventIndex + 1}`;

        const runPlayback = async () => {
            try {
                this.updateTextToSpeechStatus(`🔄 Generuojamas balsas: ${speakerLabel}`, 'processing');
                const asset = await this.ensureLiveAudioAsset(eventIndex, event, apiKey);
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
                this.updateTextToSpeechStatus('⚠️ Nepavyko sugeneruoti audio šiam pasisakymui. Bandome tęsti.', 'error');
                await this.waitAfterLiveAudioIssue();
            } finally {
                this.finalizeLivePlayback(eventIndex, generation);
            }
        };

        runPlayback();
    }

    async ensureLiveAudioAsset(eventIndex, event, apiKey) {
        if (this.audioAssets.has(eventIndex)) {
            return this.audioAssets.get(eventIndex);
        }

        if (this.eventAudioPromises.has(eventIndex)) {
            return this.eventAudioPromises.get(eventIndex);
        }

        const promise = (async () => {
            const voiceProfile = this.getVoiceForSpeaker(event.speaker || `Seimo narys ${eventIndex + 1}`);
            const audioBlob = await this.requestSpeechFromOpenAI(event.text, voiceProfile, apiKey);
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

    addLiveUpdate(time, text) {
        const updateItem = document.createElement('div');
        updateItem.className = 'update-item new';
        const safeTime = this.sanitizeText(time);
        const safeText = this.sanitizeText(text);
        updateItem.innerHTML = `
            <div class="update-time">${safeTime}</div>
            <div class="update-text">${safeText}</div>
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

// Initialize the enhanced stream when page loads
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedSeimasLiveStream();
});
