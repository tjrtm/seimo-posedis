# Animated Speaking Face - Implementation Guide

## Quick Reference: Key Code Locations and Integration Points

---

## 1. WHERE TO ADD ANIMATED FACE

### HTML Element
**File**: `/home/user/seimo-posedis/seimas_live_stream_enhanced.html`
**Line**: 646

```html
<div class="chambers-view" id="chambersView"></div>
```

**Current CSS** (lines 544-551):
```css
.chambers-view {
    width: 100%;
    height: 400px;
    background: url('data:image/svg+xml,...');
    position: relative;
    border-radius: 10px;
    overflow: hidden;
}
```

**To implement**:
1. Replace background SVG with a `<canvas>` element
2. Initialize Three.js/Babylon.js scene in this container
3. Render 3D avatar face model

---

## 2. WHEN TO TRIGGER ANIMATION

### Hook Point in Playback Engine
**File**: `/home/user/seimo-posedis/seimas_stream_enhanced.js`
**Function**: `displayEvent(event)` (lines 800-812)

```javascript
displayEvent(event) {
    // UPDATE SPEAKER INFO
    this.speakerName.textContent = event.speaker;
    this.speakerTitle.textContent = event.title;
    this.speakerParty.textContent = event.party;
    this.currentSpeech.textContent = event.text;

    // ADD HERE: Trigger animated face
    // Example: this.animateSpeak(event);

    this.addLiveUpdate(event.timestamp, event.update);
    this.updatePartyColor(event.party);
}
```

**What you have access to**:
```javascript
event: {
    time: 5,                    // Minutes into session
    speaker: "Name Surname",
    title: "Position",
    party: "Political Party",
    text: "Full speech text",
    timestamp: "HH:MM",
    type: "speech" | "opening" | "closing" | etc
}

// Also available from class instance:
this.currentTime        // Current playback position (minutes)
this.speedMultiplier    // 0.25x to 10x
this.isPlaying          // Boolean
this.totalDuration      // Total session length in minutes
```

---

## 3. SPEECH DURATION CALCULATION

Speech timing varies between events. Calculate duration with:

```javascript
// In displayEvent() or new method:
const currentEventIndex = this.currentEventIndex - 1;
const nextEventTime = this.events[currentEventIndex + 1]?.time || this.totalDuration;
const speechDurationMinutes = nextEventTime - event.time;
const speechDurationSeconds = speechDurationMinutes * 60;

console.log(`Speech duration: ${speechDurationSeconds} seconds`);
```

**Typical speech lengths** (from analysis): 150-400 words at ~2.5 words/second = 60-160 seconds per speech

---

## 4. DATA AVAILABLE FOR ANIMATION

### Member Profile Information
**File**: `/home/user/seimo-posedis/seimas_members_data.js`

```javascript
// Access member data by name:
const memberName = event.speaker;
const member = this.seimasMembers.find(m => m.name === memberName);

// Available fields:
{
    name: "Agnė Bilotaitė",
    personality: "Description...",      // Use for emotion/expression
    tone: "Security expert...",         // Use for tone-of-speech
    party: "TS-LKD",                    // Use for styling (color)
    abilities: [...],                   // Skills/context
    // ... more fields
}
```

### Party Colors (already defined)
**File**: `/home/user/seimo-posedis/seimas_stream_enhanced.js`
**Lines**: 814-828

```javascript
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
```

---

## 5. IMPLEMENTATION ARCHITECTURE SUGGESTION

### Modular Structure
```javascript
// 1. Create new file: seimas_animated_face.js
class AnimatedFace {
    constructor(containerElement) {
        this.container = containerElement;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.avatarModel = null;
        this.audioContext = null;
        
        this.initScene();
        this.loadAvatarModel();
    }
    
    initScene() {
        // Initialize Three.js scene, camera, renderer
        // Setup lighting, background
    }
    
    loadAvatarModel() {
        // Load 3D model (gltf/glb file)
        // Setup materials, armature for animation
    }
    
    animateSpeak(text, durationSeconds, memberProfile) {
        // 1. Play TTS audio (Web Speech API or external service)
        // 2. Detect phonemes from text
        // 3. Sync mouth movements (viseme animation)
        // 4. Play secondary animations (blinking, head movement)
        // 5. Apply expression based on memberProfile.tone
    }
    
    updateFaceExpression(emotionType) {
        // Morph targets or bone animations for expressions
        // Happy, serious, concerned, etc.
    }
    
    animate() {
        // RequestAnimationFrame loop for continuous rendering
        this.renderer.render(this.scene, this.camera);
    }
}

// 2. Integrate into EnhancedSeimasLiveStream class:
class EnhancedSeimasLiveStream {
    constructor() {
        // ... existing code ...
        
        // Add animated face after chamber view is ready:
        setTimeout(() => {
            this.animatedFace = new AnimatedFace(
                document.getElementById('chambersView')
            );
        }, 100);
    }
    
    displayEvent(event) {
        // ... existing code ...
        
        // Add trigger for animated face:
        if (this.animatedFace) {
            const nextEventTime = this.events[this.currentEventIndex]?.time 
                || this.totalDuration;
            const durationSeconds = (nextEventTime - event.time) * 60;
            
            const memberProfile = this.seimasMembers.find(
                m => m.name === event.speaker
            );
            
            this.animatedFace.animateSpeak(
                event.text,
                durationSeconds,
                memberProfile
            );
        }
    }
}
```

---

## 6. PLAYBACK STATE ACCESS

### Monitor Playback Changes
```javascript
// In displayEvent() or setupEventListeners():

// Current playback state is always available:
console.log(this.isPlaying);           // boolean
console.log(this.currentTime);         // minutes elapsed
console.log(this.speedMultiplier);     // playback speed
console.log(this.currentEventIndex);   // which event are we on

// Listen to pause/play:
this.playPauseBtn.addEventListener('click', () => {
    if (this.animatedFace) {
        this.animatedFace.pauseAnimation();
    }
});

this.restartBtn.addEventListener('click', () => {
    if (this.animatedFace) {
        this.animatedFace.resetAnimation();
    }
});

// Handle speed changes:
this.speedSelector.addEventListener('change', () => {
    if (this.animatedFace) {
        this.animatedFace.updatePlaybackSpeed(this.speedMultiplier);
    }
});
```

---

## 7. TTS INTEGRATION OPTIONS

### Option A: Browser Web Speech API (Simple)
```javascript
// Built-in, no dependencies, limited voices
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'lt-LT';  // Lithuanian
utterance.rate = this.speedMultiplier;

utterance.onstart = () => console.log('Speaking...');
utterance.onend = () => console.log('Done speaking');

window.speechSynthesis.speak(utterance);
```

**Pros**: Built-in, free
**Cons**: Limited quality, no lip-sync data, limited language support

### Option B: Google Cloud Text-to-Speech API (Professional)
```javascript
// High-quality voices, supports Lithuanian
const response = await fetch(
    'https://texttospeech.googleapis.com/v1/text:synthesize',
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            input: { text: text },
            voice: {
                languageCode: 'lt-LT',
                name: 'lt-LT-Standard-A'
            },
            audioConfig: { audioEncoding: 'MP3' }
        })
    }
);

const audioContent = await response.json();
const audioData = audioContent.audioContent;
// Play audio and extract phoneme/timing data
```

**Pros**: High quality, reliable
**Cons**: Requires API key, costs money

### Option C: ElevenLabs (Best Quality)
```javascript
// Premium voices, excellent quality
const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}',
    {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75
            }
        })
    }
);

const audio = await response.arrayBuffer();
// Play and sync with avatar
```

**Pros**: Best quality, multiple languages
**Cons**: Requires API key, costs money

---

## 8. FILES TO CREATE/MODIFY

### New Files to Create
1. **seimas_animated_face.js** - Main avatar class
2. **avatar_models/** - Directory for 3D models (gltf/glb files)
3. **seimas_tts_handler.js** - TTS integration logic
4. **IMPLEMENTATION_NOTES.md** - Your development notes

### Files to Modify
1. **seimas_live_stream_enhanced.html**
   - Add script tag for animated face JS
   - Optionally add canvas or adjust chamber-view styling

2. **seimas_stream_enhanced.js**
   - Add animated face instantiation in constructor
   - Add call to animateSpeak() in displayEvent()
   - Add listeners for play/pause/restart
   - Add speed change handler

### No Changes Needed
- Members data files
- Session generation logic
- UI layout (reuse chambers-view element)

---

## 9. TESTING CHECKLIST

- [ ] Avatar renders in chambers-view container
- [ ] Avatar responds to displayEvent() calls
- [ ] Mouth movements sync with speech
- [ ] Playback speed affects animation speed
- [ ] Pause/resume works correctly
- [ ] Facial expressions reflect member personality/tone
- [ ] Head movements/blinking occur naturally
- [ ] No memory leaks (check browser DevTools)
- [ ] Smooth 60fps animation (check Performance tab)
- [ ] Works with all speech speeds (0.25x - 10x)
- [ ] Responsive on different screen sizes

---

## 10. USEFUL REFERENCES

### Three.js Documentation
- https://threejs.org/docs/
- Morphs/Blend Shapes for facial animation
- SkinnedMesh for rigged models
- AudioListener for audio visualization

### Babylon.js Documentation
- https://doc.babylonjs.com/
- Morph targets for facial expressions
- Bones/Skeleton for rigged animations

### Web Audio API
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- AudioContext for frequency analysis
- AnalyserNode for visualizer effects

### Lip-Sync Libraries
- visemeData.js - Phoneme-to-viseme mapping
- Visemizer - Automatic viseme detection from audio
- Rhubarb Lip Sync - Offline tool for generating lip-sync data

---

## ABSOLUTE FILE PATHS

```
/home/user/seimo-posedis/seimas_live_stream_enhanced.html
/home/user/seimo-posedis/seimas_stream_enhanced.js
/home/user/seimo-posedis/seimas_members_data.js
/home/user/seimo-posedis/members.json
/home/user/seimo-posedis/sessions/
```

