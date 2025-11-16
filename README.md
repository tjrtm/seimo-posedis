# Seimas AI Live Stream Generator

Lietuvos Respublikos Seimo posėdžių simuliatorius su OpenAI integracija. Generuoja realistiškus parlamentinius posėdžius su visais 141 Seimo nariu.

## Stakeholder Brief
- **Status (2025-11-15):** Feature-complete beta. Core simulator, bilingual prompt scaffolding, and local text-to-speech now run inside a React + Vite SPA (`src/App.jsx`) backed by the legacy simulation controller.
- **Value Proposition:** Enables communications, policy, and research teams to dry-run plenary debates with controllable topics, factions, and scripted realism before public sessions. Delivers JSON transcripts, live-playback UI, and optional audio for debriefs or press prep.
- **Required Inputs:** 
  - Valid OpenAI API key with GPT-5-mini access (used only for transcript generation).
  - Running Speaches server on the stakeholder device (`http://localhost:8000/v1`) with at least one Kokoro-derived TTS model downloaded.
  - (For local simulations) An Ollama instance with the chosen LLM pulled locally (e.g., `ollama pull llama3.1:70b`).
- **UI Highlights:** refreshed dark-corporate React interface with mode cards (local vs. OpenAI), bilingual prompts, and contextual status badges improves stakeholder demos without extra configuration.
- **Data Residency & Privacy:** No external calls beyond OpenAI’s Responses endpoint. All outputs, cached keys, and session files stay in the stakeholder’s browser storage or the local `sessions/` folder selected via the File System Access API.
- **Evaluation Checklist:** 
  1. Run `npm install && npm run dev`, then open `http://localhost:5173`.
  2. Fill topic + choose Lithuanian/English.
  3. Provide API key and local Speaches details, enable “Naudoti lokalią Speaches teksto į kalbą tarnybą.”
  4. Generate a full session and confirm JSON download + optional audio playback.
- **Next Milestones:** (a) plug-in Lithuanian-native TTS voices once a model is integrated into Speaches, (b) add regression tests for bilingual prompts, (c) expose summarized analytics per session for executive dashboards.

## Funkcijos

### 🏛️ Pilnas Seimas
- **141 Seimo narys** su individualiais profiliais
- Tikros frakcijos: LSDP, TS-LKD, Nemuno aušra, DSVL, Liberalai, LVŽS, LLRA-KŠS ir kt.
- Autentiški asmenybės profiliai su tikslais, gebėjimais ir apribojimais

### 🤖 AI Stenogramų generavimas
- **OpenAI GPT-5-mini** integracija per Responses API
- Ypač detalūs pasisakymai su argumentais ir statistikomis
- 50-60 įvykių su išsamiais 150-400 žodžių tekstais
- Personalizuotos kalbos pagal kiekvieno nario ideologiją
- Realūs ekonominiai duomenys ir tarptautiniai pavyzdžiai
- Gilios diskusijos su tarpusavio klausimais ir atsakymais

### 💾 Sesijų archyvavimas
- `npm run dev` ir `npm run preview` paleidžia Node API (`POST /api/sessions`), kuris automatiškai išsaugo sugeneruotas stenogramas į `sessions/` katalogą (poaplankyje pagal sesijos datą).
- Naršyklėje stenogramos atsisiunčiamos JSON formatu arba įrašomos pasirinktame aplanke naudojant Failų sistemos API, jeigu nenaudojate Node API.
- `sessions/` kataloge kaupiama chronologinė posėdžių istorija JSON formatu ir garso išklotinėms paruoštuose aplankuose.

### 🌐 Dvikalbė generacija
- Vienu jungikliu pasirinkite lietuvių (numatytoji) arba anglų kalbą
- Parinktis veikia tiek GPT stenogramoms, tiek tiesioginiams atnaujinimams
- Kalbos pasirinkimas įsimenamas naršyklėje, tad nereikia keisti kiekvieną kartą

### ⚙️ Dvigubas generavimo režimas
- **Lokalus režimas:** stenogramos kuriamos per jūsų Ollama serverį, balsai – per Speaches TTS. Jokių debesijos kaštų, visi duomenys lieka kompiuteryje.
- **Debesų režimas:** pasitelkia OpenAI GPT-5-mini ir gpt-4o-mini-tts, suteikdamas maksimalų detalumą be lokalaus paruošimo.
- Abiem atvejais galima pasirinkti kalbą, audio formatą, nurodyti konkretų modelį ar bazinį URL.

### 🌓 Moderni tamsi sąsaja
- Visi komponentai perkurti į profesionalų, korporatyvinį dark theme dizainą.
- Aiškios kortelės, segmentuotas režimų perjungimas, fokusas į skaitomumą ir prieinamumą.
- Patogūs statusiniai pranešimai (per Speaches/OpenAI) leidžia greitai diagnozuoti būseną.

### 📺 Gyvas transliavimas
- Tikras LRT stiliaus dizainas
- Real-time posėdžio eigos simuliacija
- Interaktyvus timeline su žymekliais
- Keičiami atkūrimo greičiai (0.25x-10x) su slow motion

### 🔊 Speaches lokali teksto į kalbą
- Integruota su [speaches.ai](https://speaches.ai) TTS serveriu veikiančiu lokaliai
- Numatytasis modelis – `speaches-ai/Kokoro-82M-v1.0-ONNX`, prieinamas ir per `tts-1` alias
- Kiekvienam nariui parenkamas unikalus Kokoro balsas (pvz., `af_heart`, `am_echo`, `bf_emma`)
- Galite rinktis audio formatą (`mp3`, `wav`, `ogg`) ir įrašyti generuojamus failus greta sesijos
- Speaches serverio URL, modelio ID ir formatas kontroliuojami tiesiai programos UI ir saugomi naršyklėje

### 👥 Narių duomenų bazė
- Išsami visų 141 narių informacija
- Modal dialogas su profiliais
- Paieška pagal partijas
- Detali biografinė informacija

## Naudojimas

1. **Diegimas:** paleiskite `npm install` projekto šaknyje.
2. **Dev serveris:** vykdykite `npm run dev` ir atidarykite `http://localhost:5173`.
3. **Inicializacija:** paspauskite "⚙️ Generuoti naują posėdį" viršutinėje juostoje.
4. **Tema:** įveskite klausimą (pvz. „Ar turėtų būti įvesta 4 dienų darbo savaitė?“) ir pasirinkite kalbą (lt/en).
5. **Režimai:**
   - *Lokalus:* nurodykite Ollama API (`http://localhost:11434`), modelį (`llama3.1:70b`), Speaches URL ir modelį bei pasirinktą audio formatą.
   - *Debesų (OpenAI):* pateikite OpenAI API raktą su GPT-5-mini ir gpt-4o-mini-tts prieiga.
6. **Generavimas:** spauskite "🚀 Generuoti Seimo posėdį" ir, jei norite automatinio įrašymo, pasirinkite `sessions` aplanką per File System Access.
7. **Transliacija:** stebėkite gyvą simuliaciją, naudokite TTS, sesijos archyvų įrašymą ar atsisiuntimus JSON formatu.

## Failų struktūra

```
├── index.html                          # Vite įkrovos failas + legacy skriptai
├── package.json / vite.config.js       # React build įrankiai
├── src/
│   ├── App.jsx                         # React UI (kortelės, valdikliai)
│   ├── App.css                         # Modernus tamsus stilius
│   └── main.jsx                        # React įkrova
├── public/
│   ├── favicon.ico
│   └── legacy/
│       ├── seimas_stream_enhanced.js   # Branduolio logika + Node sesijų archyvai
│       ├── seimas_members_data.js      # 141 nario duomenys (globalus Array)
│       └── animated_face.js            # WebGL veido animacija
├── seimas/                             # 141 parlamentaro profilis (Markdown)
├── sessions/                           # Sugeneruotų sesijų JSON išrašai
├── seimas_session_transcript.md        # Pavyzdinis posėdis
├── seimas_event_setup.md               # Posėdžio organizacija
└── seimas_members_assignment.md        # Narių išdėstymas salėje
```

## API Requirements

- **Lokalus režimas (Ollama + Speaches)**
  - *Ollama:* įdiekite Ollama, paleiskite `ollama serve`, atsisiųskite pasirinktą modelį (`ollama run llama3.1:70b --system ...`). Programoje nurodykite API adresą (dažniausiai `http://localhost:11434`) ir modelio pavadinimą.
  - *Speaches:* `cd speaches && docker compose -f compose.cpu.yaml up speaches`, užtikrinkite `ALLOW_ORIGINS` reikšmę (pvz., `["http://127.0.0.1:5500","http://localhost:8000"]`). Atsisiųskite Kokoro modelį ar aliasą (`uvx speaches-cli model download speaches-ai/Kokoro-82M-v1.0-ONNX`) ir UI laukuose nurodykite URL/modelį bei audio formatą.
- **Debesų režimas (OpenAI)**
  - Reikalingas **OpenAI API raktas** su GPT-5-mini ir `gpt-4o-mini-tts` prieiga
  - Raktas saugomas lokaliai naršyklėje; užklausa kainuoja **$0.05/1M in / $0.40/1M out** (2025-11-15 kainynas)
  - Grąžinami JSON atsakymai su visa stenogramos struktūra

## Technologijos

- **Vanilla JavaScript** - jokių priklausomybių
- **OpenAI Responses API** - naujausias API su GPT-5-nano
- **CSS Grid/Flexbox** - responsive dizainas
- **Local Storage** - API rakto saugojimas
- **Embedded Data** - 141 narių profiliai kode (jokių HTTP užklausų)
- **JSON structured outputs** - tikslūs API atsakymai

## Pavyzdžiai

### Galimos temos:
- "Ar Lietuva turėtų įvesti 4 dienų darbo savaitę?"
- "Dirbtinio intelekto reguliavimas Lietuvoje"
- "Klimato kaitos sprendimo priemonės"
- "Mokesčių sistemos reforma"
- "Švietimo finansavimo didinimas"

### Galimi balsavimo rezultatai:
- **Už**: 89 nariai
- **Prieš**: 31 narys  
- **Susilaikė**: 18 narių

## Demonstracija

Sistemoje yra pavyzdinis posėdis temu "Dirbtinio intelekto poveikis darbo rinkai iki 2035 metų" su pilna 3 valandų stenograma.

## Saugumo pastabos

- API raktas niekada neišsiunčiamas iš jūsų naršyklės
- Visi duomenys saugomi lokaliai
- Stenogramos generuojamos real-time su OpenAI

## Licencija

Sukurta mokymosi ir demonstracijos tikslais. Naudoja tikrus Lietuvos Seimo narių vardus edukaciniais tikslais.
