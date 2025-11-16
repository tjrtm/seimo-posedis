import { useEffect } from 'react';
import './App.css';

const agenda = [
  { time: '10:00', label: 'Posėdžio atidarymas' },
  { time: '10:05', label: 'Darbotvarkės pristatymas' },
  { time: '10:15', label: 'Pagrindinis pranešimas' },
  { time: '10:45', label: 'Frakcijų kalbos' },
  { time: '11:45', label: 'Pertrauka' },
  { time: '12:00', label: 'Diskusijos' },
  { time: '12:45', label: 'Balsavimas' },
  { time: '13:00', label: 'Uždarymas' }
];

function App() {
  useEffect(() => {
    if (window.initializeSeimasLiveStream) {
      window.initializeSeimasLiveStream();
    } else {
      console.warn('Seimas controller nerastas. Įsitikinkite, kad legacy skriptai įtraukti per index.html.');
    }
  }, []);

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <p className="brand-eyebrow">LR Seimo posėdis gyvai</p>
            <h1>Seimas AI Generator</h1>
            <p className="header-description">
              Simuliuokite parlamentarų diskusijas, valdykite TTS ir generavimo režimus vienoje valdymo konsolėje.
            </p>
          </div>
          <div className="header-actions">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>GYVAI</span>
            </div>
            <div className="header-buttons">
              <button className="generate-btn" id="toggleSetupBtn">⚙️ Generuoti naują posėdį (~ 5 min.)</button>
              <button className="load-btn" id="loadSessionBtn">📂 Įkelti išsaugotą sesiją</button>
              <button className="load-btn" id="loadSessionFolderBtn">📁 Atverti sesijos aplanką</button>
              <button className="members-btn" id="membersBtn">👥 Seimo nariai (141)</button>
            </div>
          </div>
        </div>
      </header>

      <input type="file" id="loadSessionInput" accept="application/json" style={{ display: 'none' }} />

      <div className="content-shell">
        <div className="content-inner">
          <div className="main-grid">
            <div className="left-stack">
              <section className="card live-stage">
                <div className="parliament-chamber">
                  <div className="chambers-view" id="chambersView"></div>
                  <div className="chamber-overlay">
                    <div className="stage-pill">Dabartinis kalbėtojas</div>
                    <div className="speaker-info" id="speakerInfo">
                      <div className="speaker-name" id="speakerName">Seimo posėdis prasidės netrukus</div>
                      <div className="speaker-title" id="speakerTitle"></div>
                      <div className="speaker-party" id="speakerParty"></div>
                    </div>
                    <div className="current-speech" id="currentSpeech">
                      Sukurkite naują posėdį spustelėję "⚙️ Generuoti naują posėdį". Pasirinkite režimą (lokalų arba OpenAI), sukonfigūruokite atitinkamus serverius ir pradėkite simuliaciją.
                    </div>
                  </div>
                </div>
                <div className="stage-controls">
                  <div className="controls-row">
                    <button className="control-btn" id="playPauseBtn" disabled>▶️ Paleisti</button>
                    <button className="control-btn" id="restartBtn" disabled>⏮️ Iš pradžių</button>
                    <button className="control-btn" id="skipNextBtn" disabled>⏭️ Kitas</button>
                    <div className="speed-control">
                      Greitis
                      <select className="speed-selector" id="speedSelector" defaultValue="1">
                        <option value="0.25">0.25x</option>
                        <option value="0.5">0.5x</option>
                        <option value="1">1x</option>
                        <option value="2">2x</option>
                        <option value="5">5x</option>
                        <option value="10">10x</option>
                      </select>
                    </div>
                  </div>
                  <div className="stage-timeline">
                    <div className="timeline-track" id="timelineTrack">
                      <div className="timeline-progress" id="timelineProgress"></div>
                    </div>
                    <div className="time-display" id="timeDisplay">00:00 / 00:00</div>
                  </div>
                </div>
              </section>

              <section className="card session-card">
                <div className="session-head">
                  <div>
                    <p className="agenda-title">Dabartinis posėdis</p>
                    <div className="session-title" id="sessionTitle">Laukiama naujo posėdžio</div>
                  </div>
                  <div className="session-meta">
                    <span className="session-time" id="currentTime">-</span>
                    <span className="session-topic" id="sessionTopic">Sukurkite naują posėdį aukščiau</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" id="progressFill"></div>
                </div>
                <div className="agenda">
                  <div className="agenda-title">Darbotvarkė</div>
                  <div className="agenda-list">
                    {agenda.map((item, index) => (
                      <div
                        key={`${item.time}-${item.label}`}
                        className={`agenda-item ${index === 0 ? 'active' : ''}`}
                        data-time={item.time}
                      >
                        <span>{item.time}</span>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="right-stack">
              <section className="card setup-panel active" id="setupPanel">
                <div className="setup-header">
                  <div>
                    <p className="agenda-title">Posėdžio paruošimas</p>
                    <h2>Generavimo nustatymai</h2>
                    <p>Pasirinkite temą, kalbą ir tiekėją, kad simuliacija būtų tiksli tiek lokaliai, tiek debesyje.</p>
                  </div>
                </div>
                <div className="setup-form">
                  <div className="form-field form-field--full">
                    <label htmlFor="questionInput">Posėdžio tema / klausimas</label>
                    <textarea
                      id="questionInput"
                      placeholder="Pvz.: Ar Lietuva turėtų įvesti 4 dienų darbo savaitę iki 2027 metų?"
                      defaultValue="Ar Lietuva turėtų įvesti 4 dienų darbo savaitę iki 2027 metų?"
                    ></textarea>
                  </div>
                  <div className="form-field">
                    <label htmlFor="sessionLanguageSelect">Posėdžio kalba</label>
                    <select id="sessionLanguageSelect" defaultValue="lt">
                      <option value="lt">Lietuvių (numatytasis)</option>
                      <option value="en">English</option>
                    </select>
                    <small>
                      Šis pasirinkimas valdo, kuria kalba bus generuojami pasisakymai, santraukos ir rezoliucijos.
                    </small>
                  </div>

                  <div className="panel-title form-field--full">Generavimo režimas</div>
                  <div className="mode-toggle" id="generationModeToggle">
                    <button className="mode-option active" data-mode="local">
                      <div>🔒 Lokalus (Ollama + Speaches)</div>
                      <p>Viskas generuojama jūsų kompiuteryje per Ollama ir Speaches API.</p>
                    </button>
                    <button className="mode-option" data-mode="remote">
                      <div>☁️ OpenAI Debesis</div>
                      <p>Transkriptai ir balsai generuojami naudojant OpenAI Responses ir TTS modelius.</p>
                    </button>
                  </div>

                  <div className="config-panels">
                    <div className="config-panel" id="localConfigPanel">
                      <div className="panel-title">Lokalus generavimas</div>
                      <div className="dual-grid">
                        <div className="form-field">
                          <label htmlFor="localOllamaBaseUrlInput">Ollama API URL</label>
                          <input type="text" id="localOllamaBaseUrlInput" placeholder="http://localhost:11434" />
                          <small>Įsitikinkite, kad Ollama veikia ir modelis atsisiųstas.</small>
                        </div>
                        <div className="form-field">
                          <label htmlFor="localOllamaModelInput">Ollama modelio pavadinimas</label>
                          <input type="text" id="localOllamaModelInput" placeholder="llama3.1:70b" />
                          <small>
                            Nurodykite tą patį pavadinimą, kurį naudojate paleisdami <code>ollama run</code>.
                          </small>
                        </div>
                      </div>
                      <div className="dual-grid">
                        <div className="form-field">
                          <label htmlFor="speachesBaseUrlInput">Speaches TTS serverio adresas</label>
                          <input type="text" id="speachesBaseUrlInput" placeholder="http://localhost:8000/v1" />
                          <small>Paleiskite Speaches docker compose CPU režimu ir nurodykite bazinį URL.</small>
                        </div>
                        <div className="form-field">
                          <label htmlFor="speachesModelInput">Speaches modelio ID arba alias</label>
                          <input type="text" id="speachesModelInput" placeholder="speaches-ai/Kokoro-82M-v1.0-ONNX" />
                          <small>
                            Galite naudoti alias (pvz. <code>tts-1</code>) iš <code>model_aliases.json</code>.
                          </small>
                        </div>
                      </div>
                      <div className="form-field">
                        <label htmlFor="speachesFormatSelect">Audio formato pasirinkimas</label>
                        <select id="speachesFormatSelect" defaultValue="mp3">
                          <option value="mp3">MP3 (numatytasis)</option>
                          <option value="wav">WAV</option>
                          <option value="ogg">OGG Vorbis</option>
                        </select>
                      </div>
                    </div>

                    <div className="config-panel hidden" id="remoteConfigPanel">
                      <div className="panel-title">OpenAI generavimas</div>
                      <div className="form-field">
                        <label htmlFor="apiKeyInput">OpenAI API raktas</label>
                        <input type="password" id="apiKeyInput" placeholder="sk-..." />
                        <small>
                          Raktas naudojamas GPT-5-mini stenogramoms ir gpt-4o-mini-tts balsams. Saugomas tik jūsų naršyklėje.
                        </small>
                      </div>
                      <div className="form-field">
                        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                          Režimas naudoja <strong>GPT-5-mini</strong> ilgiems transkriptams ir <strong>gpt-4o-mini-tts</strong> balsams.
                          Užtikrinkite, kad raktas turi reikalingą prieigą ir laikykitės OpenAI naudojimo politikos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="form-field form-field--full">
                    <label className="checkbox-label" htmlFor="textToSpeechCheckbox">
                      <input type="checkbox" id="textToSpeechCheckbox" />
                      <span>Įjungti teksto į kalbą. Vartojamas Speaches arba OpenAI TTS pagal pasirinktą režimą.</span>
                    </label>
                    <div className="tts-status" id="textToSpeechStatus">
                      🔇 Teksto į kalbą funkcija išjungta. Įjunkite ją, kad generuotumėte balsus kartu su transkriptu.
                    </div>
                  </div>

                  <button className="generate-transcript-btn" id="generateTranscriptBtn">
                    🚀 Generuoti Seimo posėdį
                  </button>
                </div>
                <div className="loading-indicator" id="loadingIndicator">
                  <div>🚀 Generuojama detalus stenograma...</div>
                  <div style={{ marginTop: '6px', fontSize: '0.9rem' }}>
                    Tai gali užtrukti iki kelių minučių priklausomai nuo pasirinkto režimo.
                  </div>
                </div>
              </section>

              <section className="card live-updates">
                <div className="updates-header">
                  <div>
                    <p className="agenda-title">Gyva būsena</p>
                    <h3 style={{ margin: '6px 0 0' }}>Paskutiniai atnaujinimai</h3>
                  </div>
                </div>
                <div className="updates-stream" id="updatesContainer">
                  <div className="update-item">
                    <div className="update-time">-</div>
                    <div className="update-text">Laukiama naujo posėdžio generavimo</div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <div id="membersModal" className="members-modal">
        <div className="modal-content">
          <div className="modal-left">
            <div className="modal-header">
              <h2>Lietuvos Respublikos Seimo nariai (2024-2028)</h2>
              <span className="close" id="closeModal">&times;</span>
            </div>
            <div className="members-grid" id="membersGrid"></div>
          </div>
          <div className="modal-right">
            <div className="member-profile" id="memberProfile">
              Pasirinkite narį kairėje, kad peržiūrėtumėte detalesnį profilį.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
