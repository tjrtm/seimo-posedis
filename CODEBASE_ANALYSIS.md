# Seimas AI Live Stream Generator - Codebase Analysis
## For Implementing Animated Speaking Face Feature

---

## 1. PROJECT STRUCTURE & TECHNOLOGY STACK

### Architecture Overview
- **Type**: Single-page application (SPA) 
- **Framework**: Vanilla JavaScript (no UI framework dependencies)
- **Styling**: Vanilla CSS (Grid/Flexbox)
- **Data**: Embedded JSON in JavaScript (no HTTP requests for member data)
- **Storage**: Browser LocalStorage + File System API (for session persistence)
- **API Integration**: OpenAI Responses API (GPT-5-mini)

### File Structure
```
/home/user/seimo-posedis/
├── seimas_live_stream_enhanced.html      # Main UI (740 lines)
├── seimas_stream_enhanced.js             # Session logic & playback (870 lines)
├── seimas_members_data.js                # 141 embedded member profiles
├── seimas_stream.js                      # Legacy stream implementation
├── members.json                          # Member metadata (structured personas)
├── sessions/                             # Generated session transcripts (JSON)
│   └── .gitkeep
└── docs/
    ├── README.md
    ├── seimas_event_setup.md
    ├── seimas_session_transcript.md
    └── posedzio-instrukcijos.md
```

### Key Technologies
| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Vanilla JavaScript | ES6+ |
| Styling | CSS3 | Grid/Flexbox |
| UI Framework | None (no dependencies) | - |
| API Client | Fetch API | Native |
| Data Store | LocalStorage | Browser API |
| File I/O | File System API | Modern browsers |
| HTTP Backend | Node.js optional | For session auto-save |

---

## 2. AUDIO/SPEECH SYNTHESIS IMPLEMENTATION

### Current Status: **NOT IMPLEMENTED**
- No TTS (Text-to-Speech) integration found
- No Web Audio API usage
- No speech synthesis code present
- All playback is **text-based only** (displaying transcript text)

### Current Playback Model
Located in `seimas_stream_enhanced.js`:

```javascript
class EnhancedSeimasLiveStream {
    startTimer() {
        // Timer: 100ms tick interval with speed multiplier (0.25x - 10x)
        this.intervalId = setInterval(() => {
            this.currentTime += this.speedMultiplier * 0.1;
            this.updateDisplay();
            this.checkEvents();
        }, 100);
    }

    checkEvents() {
        // Event-based timing - displays text when currentTime >= event.time
        while (this.currentTime >= this.events[this.currentEventIndex].time) {
            const event = this.events[this.currentEventIndex];
            this.displayEvent(event);
            this.currentEventIndex++;
        }
    }

    displayEvent(event) {
        // Updates UI with speaker info and speech text
        this.speakerName.textContent = event.speaker;
        this.speakerTitle.textContent = event.title;
        this.speakerParty.textContent = event.party;
        this.currentSpeech.textContent = event.text;
    }
}
```

### Session Event Data Structure
```javascript
{
    time: 5,                          // Minutes into session
    timestamp: "10:05",               // Display time
    type: "speech",                   // Event type
    speaker: "Vardas Pavardė",        // Speaker name
    title: "Seimo pirmininkas",       // Position
    party: "Partija",                 // Political party
    text: "Ilgas, detalus tektas...", // Speech content (150-400 words)
    update: "Speaker kalba posėdyje"  // Live update message
}
```

---

## 3. UI FRAMEWORK

### Type: **Vanilla JavaScript SPA**

**Key characteristics:**
- **No framework overhead** (React, Vue, etc.)
- Direct DOM manipulation with `getElementById()` and `querySelector()`
- Event listeners attached manually
- CSS Grid/Flexbox for layout

### Main UI Elements (from HTML)
```html
<div class="main-container">
    <div class="video-area">
        <div class="parliament-chamber">
            <div class="chambers-view"></div>  <!-- SVG placeholder -->
            <div class="chamber-overlay">
                <div class="speaker-info">
                    <div id="speakerName">Speaker name</div>
                    <div id="speakerTitle">Title</div>
                    <div id="speakerParty">Party</div>
                </div>
                <div class="current-speech">Speech text</div>
            </div>
        </div>
    </div>
    <div class="sidebar">
        <!-- Session info, agenda, live updates -->
    </div>
</div>
```

### Styling Approach
- Dark theme (LRT broadcast styling): `#1a1a1a` background
- Red accent color: `#d4232a` (Lithuanian flag red)
- CSS Animations: `pulse` (live indicator), `slideIn` (updates)
- Responsive: Grid changes to single column on mobile (768px breakpoint)

---

## 4. ANIMATION & GRAPHICS LIBRARIES

### Current Status: **NONE USED**

No 3D or advanced animation libraries found:
- No Three.js
- No Babylon.js
- No WebGL/Canvas rendering
- No Pixi.js or similar sprite engines

### Graphics Currently Used
- **SVG placeholder** for parliament chamber:
  ```html
  <div class="chambers-view" id="chambersView"></div>
  <!-- Background SVG embedded in CSS data URI -->
  ```

- **CSS animations only**:
  - `@keyframes pulse` - for live indicator dot
  - `@keyframes slideIn` - for update messages
  - Transition properties on hover effects

### Available Canvas/Animation Space
The `.chambers-view` element (400px height) is currently just a styled `<div>` with SVG background. This is the **ideal location** for adding an animated avatar.

---

## 5. MAIN UI COMPONENT LOCATIONS

### Component Organization (from `seimas_live_stream_enhanced.html`)

| Component | HTML ID | Lines | Purpose |
|-----------|---------|-------|---------|
| **Header** | - | 609-618 | Logo, setup button, members button, live indicator |
| **Setup Panel** | `setupPanel` | 620-641 | AI transcript generation UI |
| **Main Container** | `main-container` | 643-692 | 2-column layout grid |
| **Video Area** | `video-area` | 644-658 | Left column (2fr width) |
| **Chamber View** | `chambersView` | 646 | Parliament chamber display (400px) |
| **Speaker Info** | `speakerInfo` | 648-652 | Speaker name/title/party |
| **Current Speech** | `currentSpeech` | 653-655 | Speech text display |
| **Sidebar** | `sidebar` | 660-691 | Right column (1fr width) |
| **Session Info** | `session-info` | 661-668 | Title, time, progress bar |
| **Agenda** | `agenda` | 670-680 | Session agenda items |
| **Live Updates** | `live-updates` | 682-690 | Real-time event feed |
| **Control Bar** | `control-bar` | 694-718 | Playback controls, timeline, speed |
| **Members Modal** | `membersModal` | 721-736 | Modal for viewing all 141 members |

### Key Display Elements
```javascript
// From EnhancedSeimasLiveStream.initializeElements()
this.speakerName = document.getElementById('speakerName');
this.speakerTitle = document.getElementById('speakerTitle');
this.speakerParty = document.getElementById('speakerParty');
this.currentSpeech = document.getElementById('currentSpeech');
this.chambersView = document.getElementById('chambersView');
```

### Layout Breakdown
```
┌─────────────────────────────────────────────────────┐
│  Header: Logo | Setup Button | Members | Live Dot  │
├────────────────────────┬──────────────────────────┤
│                        │                          │
│   Video Area (2fr)     │  Sidebar (1fr)          │
│  ┌────────────────────┐│  ┌────────────────────┐ │
│  │ Parliament Chamber ││  │ Session Info       │ │
│  │  ┌──────────────┐  ││  │ Agenda             │ │
│  │  │ Chambers     │  ││  │ Live Updates       │ │
│  │  │  View        │  ││  │  (15 max items)    │ │
│  │  └──────────────┘  ││  └────────────────────┘ │
│  │ Speaker: Name      ││                          │
│  │ Title: Position    ││                          │
│  │ Party: LSDP        ││                          │
│  │ Speech: [TEXT]     ││                          │
│  └────────────────────┘│                          │
├────────────────────────┴──────────────────────────┤
│ Control Bar: Play/Pause | Speed | Timeline        │
└─────────────────────────────────────────────────────┘
```

---

## 6. SESSIONS & TRANSCRIPTION PLAYBACK

### Session Generation Flow
```
User Input (Topic + API Key)
    ↓
OpenAI API Call (GPT-5-mini)
    ↓
Parse JSON Response
    ↓
Load Events Array into Memory
    ↓
Save to File (File System API or Download)
```

### Event Processing (from `processGeneratedTranscript`)
```javascript
async processGeneratedTranscript(transcriptJson, question) {
    // 1. Parse response (handles multiple formats)
    const transcriptData = JSON.parse(responseText);
    
    // 2. Load events array
    this.events = transcriptData.events || [];
    
    // 3. Calculate duration
    this.totalDuration = Math.max(...this.events.map(e => e.time)) + 5;
    
    // 4. Update UI
    this.sessionTitle.textContent = transcriptData.title;
    this.sessionTopic.textContent = transcriptData.topic;
    
    // 5. Save session file
    await this.saveTranscriptToFile(transcriptData);
    
    // 6. Enable playback controls
    this.playPauseBtn.disabled = false;
}
```

### Playback Engine (Timer-based)
```javascript
class PlaybackEngine {
    speedMultiplier = 2;           // 0.25x - 10x (selectable)
    currentTime = 0;               // Minutes elapsed
    totalDuration = 180;           // Total session length
    currentEventIndex = 0;         // Current event pointer
    
    // 100ms update interval
    startTimer() {
        setInterval(() => {
            this.currentTime += this.speedMultiplier * 0.1;
            this.checkEvents();
            this.updateDisplay();
        }, 100);
    }
    
    // Check if any events are due
    checkEvents() {
        while (currentTime >= events[currentEventIndex].time) {
            displayEvent(events[currentEventIndex]);
            currentEventIndex++;
        }
    }
}
```

### Session File Format (Saved JSON)
```json
{
    "savedAt": "2025-11-08T12:34:56Z",
    "title": "Seimo posėdis",
    "topic": "Ar turėtų būti įvesta 4 dienų darbo savaitė?",
    "totalEvents": 52,
    "durationMinutes": 185,
    "events": [
        {
            "time": 0,
            "timestamp": "10:00",
            "type": "opening",
            "speaker": "Saulius Skvernelis",
            "title": "Seimo pirmininkas",
            "party": "DSVL",
            "text": "Pradedame Lietuvos Respublikos Seimo posėdį...",
            "update": "Posėdis pradėtas"
        }
    ]
}
```

### Playback Features
- **Play/Pause**: Toggle via `togglePlayPause()`
- **Restart**: Reset to beginning via `restart()`
- **Speed Control**: 0.25x - 10x via dropdown selector
- **Timeline Seeking**: Click to jump to position
- **Progress Tracking**: Visual progress bar + time display
- **Live Updates**: 15-item scrollable feed with animations
- **Agenda Tracking**: Current agenda item highlighting

---

## 7. KEY INTEGRATION POINTS FOR ANIMATED FACE

### 1. **Placement Location**
```html
<div class="chambers-view" id="chambersView"></div>
```
- **Size**: 800px wide × 400px tall
- **Current Content**: SVG placeholder (parliament chamber)
- **Ideal for**: Avatar canvas/WebGL scene

### 2. **Data Available**
From `displayEvent(event)`:
```javascript
{
    speaker: "Speaker Name",
    title: "Position",
    party: "Political Party",
    text: "Full speech text (150-400 words)",
    timestamp: "HH:MM"
}
```

### 3. **Timing Data**
```javascript
// Speech duration in seconds
const speechDuration = event.time - previousEvent.time;

// Exact timing from playback engine
this.currentTime        // Current playback position (minutes)
this.speedMultiplier    // Playback speed (0.25x - 10x)
this.isPlaying          // Playback state
```

### 4. **Callback Hook Opportunity**
```javascript
displayEvent(event) {
    // UPDATE SPEAKER INFO
    this.speakerName.textContent = event.speaker;
    this.speakerTitle.textContent = event.title;
    this.speakerParty.textContent = event.party;
    this.currentSpeech.textContent = event.text;

    // *** HOOK FOR ANIMATED FACE ***
    // Could call: animateSpeak(event.text, speechDuration)
    
    this.updatePartyColor(event.party);
}
```

### 5. **Member Data Available**
141 members with detailed profiles:
```javascript
{
    name: "Agnė Bilotaitė",
    personality: "Vidaus reikalų ministrė...",
    tone: "Security expert, public safety defender...",
    party: "TS-LKD",
    abilities: [...],
    // ... more fields
}
```

---

## SUMMARY: IMPLEMENTATION READINESS

### ✅ What's Ready
1. **Text content**: Full speech transcripts available (150-400 words per event)
2. **Timing**: Precise event timing with speed-adjustable playback
3. **Display space**: `chambers-view` element ready for avatar
4. **Event hooks**: `displayEvent()` can trigger face animation
5. **Member profiles**: 141 detailed members with personality traits
6. **Playback engine**: Robust timer system (100ms ticks)
7. **Speed control**: Supports 0.25x - 10x playback speeds
8. **No dependencies**: Clean vanilla JS means no framework conflicts

### ⚠️ What Needs Building
1. **TTS Engine**: Browser Web Speech API or external TTS service
2. **Avatar Model**: 3D face model (Three.js or similar)
3. **Lip-sync Algorithm**: Sync mouth movements with speech
4. **Emotion Detection**: Map speech content to facial expressions
5. **Face Animation System**: Blink, head movement, eye tracking
6. **Audio Mixing**: Balance TTS with background/ambient sounds
7. **Performance Optimization**: Smooth 60fps animation during playback

---

## ABSOLUTE FILE PATHS FOR REFERENCE

- HTML UI: `/home/user/seimo-posedis/seimas_live_stream_enhanced.html`
- Main JS: `/home/user/seimo-posedis/seimas_stream_enhanced.js`
- Members Data: `/home/user/seimo-posedis/seimas_members_data.js`
- Members JSON: `/home/user/seimo-posedis/members.json`
- Sessions Dir: `/home/user/seimo-posedis/sessions/`

