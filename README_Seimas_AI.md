# Seimas AI Live Stream Generator

Lietuvos Respublikos Seimo posėdžių simuliatorius su OpenAI integracija. Generuoja realistiškus parlamentinius posėdžius su visais 141 Seimo nariu.

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

### 📺 Gyvas transliavimas
- Tikras LRT stiliaus dizainas
- Real-time posėdžio eigos simuliacija
- Interaktyvus timeline su žymekliais
- Keičiami atkūrimo greičiai (0.25x-10x) su slow motion

### 👥 Narių duomenų bazė
- Išsami visų 141 narių informacija
- Modal dialogas su profiliais
- Paieška pagal partijas
- Detali biografinė informacija

## Naudojimas

1. **Atidarykite** `seimas_live_stream_enhanced.html`
2. **Spauskite** "⚙️ Generuoti naują posėdį"
3. **Įveskite** posėdžio temą (pvz.: "Ar turėtų būti įvesta 4 dienų darbo savaitė?")
4. **Įveskite** OpenAI API raktą
5. **Spauskite** "🚀 Generuoti pilną stenogramą"
6. **Stebėkite** gyvą simuliaciją!

## Failų struktūra

```
├── seimas_live_stream_enhanced.html    # Pagrindinis UI
├── seimas_stream_enhanced.js           # AI integracija ir logika
├── seimas/                             # 141 parlamentaro profilis
│   ├── Saulius_Skvernelis-0001.md
│   ├── Ingrida_Simonyte-0002.md
│   └── ... (139 daugiau)
├── seimas_session_transcript.md        # Pavyzdinis posėdis
├── seimas_event_setup.md              # Posėdžio organizacija
└── seimas_members_assignment.md       # Narių išdėstymas salėje
```

## API Requirements

- **OpenAI API raktas** su GPT-5-nano prieiga
- Raktas saugomas lokaliai naršyklėje  
- Kaina: **$0.05/1M input tokenų, $0.40/1M output tokenų**
- ~16000 tokenų per užklausą su optimizuotu reasoning
- JSON formato atsakymai su struktūrizuotais duomenimis

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
- Visi duomenys saugomi lokaliui
- Stenogramos generuojamos real-time su OpenAI

## Licencija

Sukurta mokymosi ir demonstracijos tikslais. Naudoja tikrus Lietuvos Seimo narių vardus edukaciniais tikslais.