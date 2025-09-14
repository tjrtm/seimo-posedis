// Seimas Live Stream Simulator
class SeimasLiveStream {
    constructor() {
        this.isPlaying = false;
        this.currentEventIndex = 0;
        this.speedMultiplier = 2;
        this.totalDuration = 180; // 3 hours in minutes
        this.currentTime = 0;
        this.intervalId = null;
        
        this.initializeElements();
        this.loadTranscriptData();
        this.setupEventListeners();
        this.initializeTimeline();
    }

    initializeElements() {
        this.speakerName = document.getElementById('speakerName');
        this.speakerTitle = document.getElementById('speakerTitle');
        this.speakerParty = document.getElementById('speakerParty');
        this.currentSpeech = document.getElementById('currentSpeech');
        this.updatesContainer = document.getElementById('updatesContainer');
        this.progressFill = document.getElementById('progressFill');
        this.timelineProgress = document.getElementById('timelineProgress');
        this.currentTimeDisplay = document.getElementById('currentTime');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
        this.speedSelector = document.getElementById('speedSelector');
        this.votingPanel = document.getElementById('votingPanel');
        this.votesFor = document.getElementById('votesFor');
        this.votesAgainst = document.getElementById('votesAgainst');
        this.votesAbstain = document.getElementById('votesAbstain');
    }

    loadTranscriptData() {
        // Parsed data from the Seimas session transcript
        this.events = [
            {
                time: 0,
                timestamp: '10:00',
                type: 'opening',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Gerbiamieji kolegos, pradedame Lietuvos Respublikos Seimo posėdį. Šiandien svarstysime klausimą "Dirbtinio intelekto poveikis darbo rinkai iki 2035 metų".',
                update: 'Posėdis pradėtas. Registruojasi 138 nariai iš 141.'
            },
            {
                time: 5,
                timestamp: '10:05',
                type: 'agenda',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Šiandien svarstomas klausimas yra ypač aktualus mūsų šalies ateičiai. Dirbtinis intelektas keičia darbo rinkas visame pasaulyje.',
                update: 'Pristatoma darbotvarkė. Pagrindinį pranešimą skaitys ministerijos atstovė.'
            },
            {
                time: 15,
                timestamp: '10:15',
                type: 'presentation',
                speaker: 'D. Petraitienė',
                title: 'Švietimo ministerijos atstovė',
                party: 'Ministerija',
                text: 'Gerbiamieji parlamentarai, dirbtinio intelekto technologijos auga eksponentiškai. McKinsey prognozuoja, kad iki 2035 m. automatizacija paveiks 30% darbo vietų.',
                update: 'Pradėtas pagrindinis pranešimas apie AI poveikį darbo rinkai.'
            },
            {
                time: 45,
                timestamp: '10:45',
                type: 'faction_speech',
                speaker: 'Gintautas Paluckas',
                title: 'LSDP frakcijos lyderis',
                party: 'LSDP',
                text: 'Socialdemokratai kreipia dėmesį į socialinę šio klausimo pusę. Dirbtinis intelektas neturi tapti darbuotojų priešu. Mūsų pasiūlymai: sukurti valstybės finansuojamas perkvalifikavimo programas.',
                update: 'LSDP frakcija akcentuoja darbuotojų socialinę apsaugą.'
            },
            {
                time: 50,
                timestamp: '10:50',
                type: 'faction_speech',
                speaker: 'Rasa Budbergytė',
                title: 'LSDP narė',
                party: 'LSDP',
                text: 'Moterys sudaro didžiąją dalį administracijos darbuotojų, kurias paveiks automatizacija. Reikia lyčių aspektų įvertinimo ir tikslinių programų moterims.',
                update: 'Pabrėžiamas lyčių aspektas automatizacijos poveikio kontekste.'
            },
            {
                time: 55,
                timestamp: '10:55',
                type: 'faction_speech',
                speaker: 'Gabrielius Landsbergis',
                title: 'TS-LKD frakcijos lyderis',
                party: 'TS-LKD',
                text: 'Tėvynės sąjunga mato šiame iššūkyje didžiulę galimybę Lietuvai tapti regiono lyderiu. Mūsų kryptis: sukurti "AI Valley" Vilniuje pagal Silicio slėnio modelį.',
                update: 'TS-LKD siūlo kurti "AI Valley" technologijų centrą Vilniuje.'
            },
            {
                time: 60,
                timestamp: '11:00',
                type: 'faction_speech',
                speaker: 'Ingrida Šimonytė',
                title: 'Buvusi ministrė pirmininkė',
                party: 'TS-LKD',
                text: 'Ekonomikos požiūriu, šalys, kurios pirmos adaptuoja AI, gaus konkurencinį pranašumą. Lietuva negali likti nuošalyje.',
                update: 'I. Šimonytė pabrėžia konkurencinio pranašumo svarbą AI srityje.'
            },
            {
                time: 65,
                timestamp: '11:05',
                type: 'faction_speech',
                speaker: 'Remigijus Žemaitaitis',
                title: 'Nemuno aušros lyderis',
                party: 'Nemuno aušra',
                text: 'Nemuno aušra įspėja dėl dirbtinio intelekto keliamų pavojų demokratijai. Didelės technologijų korporacijos gali kontroliuoti informacijos srautus.',
                update: 'Nemuno aušra reikalauja griežtos AI algoritmų reguliacijos.'
            },
            {
                time: 70,
                timestamp: '11:10',
                type: 'faction_speech',
                speaker: 'Naglis Puteikis',
                title: 'Nemuno aušros narys',
                party: 'Nemuno aušra',
                text: 'Žmonės bijo, kad robotai atims jų darbus. Valdžia turi garantuoti, kad technologijos tarnauja žmonėms, o ne atvirkščiai.',
                update: 'Pabrėžiamas piliečių nerimas dėl darbo vietų praradimo.'
            },
            {
                time: 75,
                timestamp: '11:15',
                type: 'faction_speech',
                speaker: 'Gediminas Černiauskas',
                title: 'DSVL frakcijos narys',
                party: 'DSVL',
                text: 'Demokratai siūlo subalansuotą požiūrį. AI diegimas turi būti laipsniškas, su socialinių partnerių dalyvavimu.',
                update: 'DSVL atstovauja pragmatišką AI diegimo požiūrį.'
            },
            {
                time: 80,
                timestamp: '11:20',
                type: 'faction_speech',
                speaker: 'Viktorija Čmilytė-Nielsen',
                title: 'Liberalų sąjūdžio lyderė',
                party: 'Liberalų sąjūdis',
                text: 'Liberalai tvirtai pasisako už technologinę pažangą ir laisvą rinką. Valstybės vaidmuo - kurti palankias sąlygas inovacijoms.',
                update: 'Liberalai pasisako už minimalų reguliavimą AI srityje.'
            },
            {
                time: 85,
                timestamp: '11:25',
                type: 'faction_speech',
                speaker: 'Eugenijus Gentvilas',
                title: 'Liberalų sąjūdžio narys',
                party: 'Liberalų sąjūdis',
                text: 'Europa atsilieka nuo JAV ir Kinijos AI srityje. Lietuva gali tapti tiltu tarp šių regionų.',
                update: 'Pabrėžiamas Lietuvos galimas vaidmuo kaip tilto tarp JAV ir Kinijos.'
            },
            {
                time: 90,
                timestamp: '11:30',
                type: 'faction_speech',
                speaker: 'Ramūnas Karbauskis',
                title: 'LVŽS frakcijos narys',
                party: 'LVŽS',
                text: 'Valstiečiai ir žalieji kreipia dėmesį į kaimo vietovių poreikius. AI gali padėti modernizuoti žemės ūkį.',
                update: 'LVŽS akcentuoja pažangų žemės ūkį su AI technologijomis.'
            },
            {
                time: 105,
                timestamp: '11:45',
                type: 'break',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Paskelbiu 15 minučių pertrauką.',
                update: '15 minučių pertrauka. Seimo nariai bendrauja poilsio zonose.'
            },
            {
                time: 120,
                timestamp: '12:00',
                type: 'discussion',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Tęsiame posėdį. Pradedame diskusijas. Pirmą žodį teikiu LSDP frakcijai.',
                update: 'Prasideda diskusijų dalis. Laukiama 23 kalbėtojų.'
            },
            {
                time: 125,
                timestamp: '12:05',
                type: 'discussion',
                speaker: 'Arturas Skardžius',
                title: 'LSDP narys',
                party: 'LSDP',
                text: 'Klausimas ekonomistei I. Šimonytei. Ar neperka darbuotojų, praradusių darbus dėl automatizacijos, finansinė kompensacija?',
                update: 'A. Skardžius klausia I. Šimonytės apie finansines kompensacijas.'
            },
            {
                time: 127,
                timestamp: '12:07',
                type: 'discussion',
                speaker: 'Ingrida Šimonytė',
                title: 'Buvusi ministrė pirmininkė',
                party: 'TS-LKD',
                text: 'Geriau investuoti į perkvalifikavimą nei mokėti pašalpas. Rinka sukurs naujas vietas.',
                update: 'I. Šimonytė atsako apie perkvalifikavimo svarbą.'
            },
            {
                time: 130,
                timestamp: '12:10',
                type: 'discussion',
                speaker: 'Rita Tamašunienė',
                title: 'TS-LKD narė',
                party: 'TS-LKD',
                text: 'Klausimas Liberalų frakcijai. Kaip užtikrinti, kad AI nepadidins nelygybės?',
                update: 'Keliamas nelygybės klausimas AI kontekste.'
            },
            {
                time: 165,
                timestamp: '12:45',
                type: 'resolution',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Pateikiamas rezoliucijos projektas "Dėl Lietuvos pasiruošimo dirbtinio intelekto iššūkiams".',
                update: 'Pristatomos rezoliucijos projekto nuostatos.'
            },
            {
                time: 180,
                timestamp: '13:00',
                type: 'voting',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Pradedame balsavimą dėl rezoliucijos projekto.',
                update: 'Aktyvuota elektroninio balsavimo sistema.',
                voting: true,
                votingResults: {
                    for: 89,
                    against: 31,
                    abstain: 18
                }
            },
            {
                time: 185,
                timestamp: '13:05',
                type: 'closing',
                speaker: 'Saulius Skvernelis',
                title: 'Seimo pirmininkas',
                party: 'DSVL',
                text: 'Rezoliucija priimta. Dėkoju visiems dalyvavusiems produktyviame posėdyje. Posėdis baigtas.',
                update: 'Posėdis oficialiai baigtas. Rezoliucija priimta.'
            }
        ];
    }

    setupEventListeners() {
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.restartBtn.addEventListener('click', () => this.restart());
        this.speedSelector.addEventListener('change', (e) => {
            this.speedMultiplier = parseFloat(e.target.value);
            if (this.isPlaying) {
                this.stopTimer();
                this.startTimer();
            }
        });

        // Timeline interaction
        const timelineTrack = document.getElementById('timelineTrack');
        timelineTrack.addEventListener('click', (e) => this.seekToTime(e));
    }

    initializeTimeline() {
        const markers = document.getElementById('timelineMarkers');
        this.events.forEach(event => {
            const position = (event.time / this.totalDuration) * 100;
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            marker.style.left = position + '%';
            marker.title = `${event.timestamp} - ${event.speaker}`;
            markers.appendChild(marker);
        });
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playPauseBtn.textContent = '⏸️ Pristabdyti';
        this.startTimer();
    }

    pause() {
        this.isPlaying = false;
        this.playPauseBtn.textContent = '▶️ Tęsti';
        this.stopTimer();
    }

    restart() {
        this.pause();
        this.currentTime = 0;
        this.currentEventIndex = 0;
        this.updateDisplay();
        this.votingPanel.classList.remove('active');
        this.updatesContainer.innerHTML = `
            <div class="update-item">
                <div class="update-time">09:55</div>
                <div class="update-text">Seimo nariai registruojasi posėdžiui</div>
            </div>
        `;
    }

    startTimer() {
        this.stopTimer();
        this.intervalId = setInterval(() => {
            this.currentTime += this.speedMultiplier * 0.1; // Update every 100ms
            this.updateDisplay();
            this.checkEvents();
            
            if (this.currentTime >= this.totalDuration) {
                this.pause();
                this.currentTime = this.totalDuration;
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
        const progress = (this.currentTime / this.totalDuration) * 100;
        this.progressFill.style.width = progress + '%';
        this.timelineProgress.style.width = progress + '%';
        
        const currentHours = Math.floor((this.currentTime + 600) / 60); // Start at 10:00
        const currentMinutes = Math.floor((this.currentTime + 600) % 60);
        const totalHours = Math.floor(this.totalDuration / 60);
        const totalMinutes = this.totalDuration % 60;
        
        this.currentTimeDisplay.textContent = 
            `2025-09-13 ${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
        
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

        const currentEvent = this.events[this.currentEventIndex];
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
        while (this.currentEventIndex < this.events.length && 
               this.currentTime >= this.events[this.currentEventIndex].time) {
            
            const event = this.events[this.currentEventIndex];
            this.displayEvent(event);
            this.currentEventIndex++;
        }
    }

    displayEvent(event) {
        // Update speaker info
        this.speakerName.textContent = event.speaker;
        this.speakerTitle.textContent = event.title;
        this.speakerParty.textContent = event.party;
        this.currentSpeech.textContent = event.text;

        // Add live update
        this.addLiveUpdate(event.timestamp, event.update);

        // Handle voting
        if (event.voting && event.votingResults) {
            this.showVotingResults(event.votingResults);
        }

        // Update party color
        this.updatePartyColor(event.party);
    }

    updatePartyColor(party) {
        const partyColors = {
            'LSDP': '#d32f2f',
            'TS-LKD': '#1976d2',
            'Nemuno aušra': '#7b1fa2',
            'DSVL': '#388e3c',
            'Liberalų sąjūdis': '#f57c00',
            'LVŽS': '#689f38',
            'Ministerija': '#455a64'
        };

        const color = partyColors[party] || '#d4232a';
        this.speakerParty.style.backgroundColor = color;
    }

    addLiveUpdate(time, text) {
        const updateItem = document.createElement('div');
        updateItem.className = 'update-item new';
        updateItem.innerHTML = `
            <div class="update-time">${time}</div>
            <div class="update-text">${text}</div>
        `;

        this.updatesContainer.insertBefore(updateItem, this.updatesContainer.firstChild);

        // Remove 'new' class after animation
        setTimeout(() => {
            updateItem.classList.remove('new');
        }, 500);

        // Keep only last 10 updates
        const updates = this.updatesContainer.children;
        while (updates.length > 10) {
            this.updatesContainer.removeChild(updates[updates.length - 1]);
        }
    }

    showVotingResults(results) {
        this.votingPanel.classList.add('active');
        
        // Animate vote counting
        this.animateVoteCount(this.votesFor, results.for, '#90ee90');
        this.animateVoteCount(this.votesAgainst, results.against, '#ff9090');
        this.animateVoteCount(this.votesAbstain, results.abstain, '#ffff90');
    }

    animateVoteCount(element, targetValue, color) {
        let currentValue = 0;
        const increment = Math.ceil(targetValue / 30);
        
        const animation = setInterval(() => {
            currentValue += increment;
            if (currentValue >= targetValue) {
                currentValue = targetValue;
                clearInterval(animation);
            }
            element.textContent = currentValue;
        }, 50);
    }

    seekToTime(e) {
        const rect = e.target.getBoundingClientRect();
        const clickPosition = (e.clientX - rect.left) / rect.width;
        this.currentTime = clickPosition * this.totalDuration;
        
        // Find appropriate event index
        this.currentEventIndex = 0;
        while (this.currentEventIndex < this.events.length && 
               this.currentTime > this.events[this.currentEventIndex].time) {
            this.currentEventIndex++;
        }
        
        this.updateDisplay();
        if (this.currentEventIndex > 0) {
            this.displayEvent(this.events[this.currentEventIndex - 1]);
        }
    }
}

// Initialize the stream when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SeimasLiveStream();
});