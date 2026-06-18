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
              Simuliuokite parlamentarų diskusijas, valdykite balsus ir generavimo režimus vienoje konsolėje.
            </p>
          </div>
          <div className="header-actions">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>GYVAI</span>
            </div>
            <div className="header-buttons">
              <button className="generate-btn" id="toggleSetupBtn">⚙️ Generuoti posėdį</button>
              <button className="ghost-btn" id="importBundleBtn" title="Įkelti sesijos JSON + audio (kelis failus arba .zip)">📥 Importuoti</button>
              <button className="ghost-btn" id="exportSessionBtn" title="Eksportuoti visą posėdį su audio" disabled>📦 Eksportuoti</button>
              <button className="ghost-btn" id="loadSessionBtn">📂 JSON</button>
              <button className="ghost-btn" id="loadSessionFolderBtn">📁 Aplankas</button>
              <button className="members-btn" id="membersBtn">👥 Nariai (141)</button>
            </div>
          </div>
        </div>
      </header>

      <input type="file" id="loadSessionInput" accept="application/json" style={{ display: 'none' }} />
      <input type="file" id="importBundleInput" accept=".json,.zip,audio/*" multiple style={{ display: 'none' }} />

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
                      Sukurkite naują posėdį spustelėję „⚙️ Generuoti posėdį", arba „📥 Importuoti", kad įkeltumėte jau sugeneruotą sesiją su audio.
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
                  <div className="session-head-main">
                    <p className="agenda-title">Dabartinis posėdis</p>
                    <div className="session-title" id="sessionTitle">Laukiama naujo posėdžio</div>
                  </div>
                  <div className="session-meta">
                    <span className="session-time" id="currentTime">-</span>
                    <span className="session-topic" id="sessionTopic">Sukurkite arba importuokite posėdį</span>
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
              <section className="card panel-card">
                <div className="panel-tabs" id="panelTabs">
                  <button className="tab-btn active" data-tab-btn="settings">⚙️ Nustatymai</button>
                  <button className="tab-btn" data-tab-btn="results">📊 Rezultatai <span className="tab-count"></span></button>
                  <button className="tab-btn" data-tab-btn="stats">📈 Statistika</button>
                  <button className="tab-btn" data-tab-btn="live">📡 Būsena</button>
                </div>

                {/* SETTINGS TAB */}
                <div className="tab-panel active" data-tab-panel="settings">
                  <div className="setup-panel active" id="setupPanel">
                    <div className="setup-form">

                      <div className="settings-section">
                        <button type="button" className="section-head" data-accordion>
                          <span>📝 Tema ir kalba</span><span className="chevron">▾</span>
                        </button>
                        <div className="section-body">
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
                            <small>Valdo, kuria kalba generuojami pasisakymai, santraukos ir rezoliucijos.</small>
                          </div>
                        </div>
                      </div>

                      <div className="settings-section">
                        <button type="button" className="section-head" data-accordion>
                          <span>🧠 Generavimo režimas</span><span className="chevron">▾</span>
                        </button>
                        <div className="section-body">
                          <div className="mode-toggle" id="generationModeToggle">
                            <button className="mode-option active" data-mode="local">
                              <div>🔒 Lokalus</div>
                              <p>Ollama + Speaches jūsų kompiuteryje.</p>
                            </button>
                            <button className="mode-option" data-mode="remote">
                              <div>☁️ OpenAI</div>
                              <p>OpenAI Responses + TTS modeliai.</p>
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
                                  <small>Tas pats pavadinimas, kurį naudojate su <code>ollama run</code>.</small>
                                </div>
                              </div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="localOllamaTemperatureInput">Temperatūra</label>
                                  <input type="number" id="localOllamaTemperatureInput" min="0" max="2" step="0.05" placeholder="0.35" />
                                  <small>Mažesnė – stabilesnis JSON, didesnė – kūrybiškesnės kalbos.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="localOllamaNumPredictInput">num_predict</label>
                                  <input type="number" id="localOllamaNumPredictInput" min="-1" step="1" placeholder="-1" />
                                  <small>-1 arba tuščia – neriboti atsakymo.</small>
                                </div>
                              </div>
                              <div className="form-field">
                                <label htmlFor="localOllamaOptionsInput">Papildomi Ollama options JSON</label>
                                <textarea id="localOllamaOptionsInput" className="compact-textarea" placeholder='{"top_p":0.9,"repeat_penalty":1.1}'></textarea>
                                <small>Sujungiami į <code>/api/chat</code> lauką <code>options</code>.</small>
                              </div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="speachesBaseUrlInput">Speaches TTS adresas</label>
                                  <input type="text" id="speachesBaseUrlInput" placeholder="http://localhost:8000/v1" />
                                  <small>Paleiskite Speaches docker compose ir nurodykite bazinį URL.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="speachesModelInput">Speaches modelio ID / alias</label>
                                  <input type="text" id="speachesModelInput" placeholder="speaches-ai/Kokoro-82M-v1.0-ONNX" />
                                  <small>Galima naudoti alias (pvz. <code>tts-1</code>).</small>
                                </div>
                              </div>
                              <div className="form-field">
                                <label htmlFor="speachesFormatSelect">Audio formatas</label>
                                <select id="speachesFormatSelect" defaultValue="mp3">
                                  <option value="mp3">MP3 (numatytasis)</option>
                                  <option value="wav">WAV</option>
                                  <option value="ogg">OGG Vorbis</option>
                                </select>
                              </div>
                            </div>

                            <div className="config-panel hidden" id="remoteConfigPanel">
                              <div className="panel-title">OpenAI generavimas</div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="apiKeyInput">OpenAI API raktas</label>
                                  <input type="password" id="apiKeyInput" placeholder="sk-... arba suderinamo endpoint tokenas" />
                                  <small>Raktas saugomas tik jūsų naršyklėje ir siunčiamas kaip Bearer tokenas.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="openAIBaseUrlInput">Responses bazinis URL</label>
                                  <input type="text" id="openAIBaseUrlInput" placeholder="https://api.openai.com/v1" />
                                  <small>Galima nurodyti OpenAI suderinamą proxy ar savą endpointą.</small>
                                </div>
                              </div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="openAITranscriptModelInput">Stenogramos modelis</label>
                                  <input type="text" id="openAITranscriptModelInput" placeholder="gpt-5-mini" />
                                  <small>Modelis posėdžio JSON stenogramai generuoti.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="openAIMaxOutputTokensInput">Max output tokens</label>
                                  <input type="number" id="openAIMaxOutputTokensInput" min="1000" step="1000" placeholder="100000" />
                                  <small>Didelė reikšmė reikalinga ilgoms stenogramoms.</small>
                                </div>
                              </div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="openAIReasoningEffortSelect">Reasoning effort</label>
                                  <select id="openAIReasoningEffortSelect" defaultValue="medium">
                                    <option value="minimal">Minimal</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                  </select>
                                  <small>Taikoma reasoning parametrus palaikantiems modeliams.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="openAITTSBaseUrlInput">OpenAI TTS bazinis URL</label>
                                  <input type="text" id="openAITTSBaseUrlInput" placeholder="https://api.openai.com/v1" />
                                  <small>Naudojama <code>/audio/speech</code> užklausoms.</small>
                                </div>
                              </div>
                              <div className="dual-grid">
                                <div className="form-field">
                                  <label htmlFor="openAITTSModelInput">TTS modelis</label>
                                  <input type="text" id="openAITTSModelInput" placeholder="gpt-4o-mini-tts" />
                                  <small>Modelis OpenAI balsams generuoti.</small>
                                </div>
                                <div className="form-field">
                                  <label htmlFor="openAITTSFormatSelect">OpenAI audio formatas</label>
                                  <select id="openAITTSFormatSelect" defaultValue="mp3">
                                    <option value="mp3">MP3</option>
                                    <option value="wav">WAV</option>
                                    <option value="opus">Opus</option>
                                    <option value="aac">AAC</option>
                                    <option value="flac">FLAC</option>
                                    <option value="pcm">PCM</option>
                                  </select>
                                  <small>Siunčiama kaip <code>response_format</code>.</small>
                                </div>
                              </div>
                              <div className="form-field">
                                <label htmlFor="openAIRequestOptionsInput">Papildomi Responses JSON</label>
                                <textarea id="openAIRequestOptionsInput" className="compact-textarea" placeholder='{"temperature":0.2,"metadata":{"source":"seimas-ai"}}'></textarea>
                                <small>Sujungiami į stenogramos generavimo užklausą.</small>
                              </div>
                              <div className="form-field">
                                <label htmlFor="openAITTSOptionsInput">Papildomi OpenAI TTS JSON</label>
                                <textarea id="openAITTSOptionsInput" className="compact-textarea" placeholder='{"speed":1}'></textarea>
                                <small>Sujungiami į audio generavimo užklausą.</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="settings-section">
                        <button type="button" className="section-head" data-accordion>
                          <span>🔊 Įgarsinimas</span><span className="chevron">▾</span>
                        </button>
                        <div className="section-body">
                          <div className="form-field form-field--full">
                            <label className="checkbox-label" htmlFor="textToSpeechCheckbox">
                              <input type="checkbox" id="textToSpeechCheckbox" />
                              <span>Įjungti teksto į kalbą (Speaches arba OpenAI TTS pagal režimą).</span>
                            </label>
                            <div className="tts-status" id="textToSpeechStatus">
                              🔇 Teksto į kalbą funkcija išjungta. Įjunkite ją, kad generuotumėte balsus.
                            </div>
                          </div>
                        </div>
                      </div>

                      <button className="generate-transcript-btn" id="generateTranscriptBtn">
                        🚀 Generuoti Seimo posėdį
                      </button>
                      <div className="loading-indicator" id="loadingIndicator">
                        <div>🚀 Generuojama detali stenograma...</div>
                        <div className="loading-sub">Tai gali užtrukti iki kelių minučių priklausomai nuo režimo.</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RESULTS TAB */}
                <div className="tab-panel" data-tab-panel="results">
                  <div className="panel-intro">
                    <h3>Balsavimų rezultatai</h3>
                    <p>Suvestiniai ir frakcijų balsai, automatiškai išrinkti iš posėdžio stenogramos.</p>
                  </div>
                  <div className="analytics-container" id="resultsContainer">
                    <div className="an-empty">Balsavimų rezultatai atsiras, kai sugeneruosite arba importuosite posėdį.</div>
                  </div>
                </div>

                {/* STATS TAB */}
                <div className="tab-panel" data-tab-panel="stats">
                  <div className="panel-intro">
                    <h3>Posėdžio statistika</h3>
                    <p>Kalbėtojai, frakcijų aktyvumas, žodžių apimtis ir įvykių tipai.</p>
                  </div>
                  <div className="analytics-container" id="statsContainer">
                    <div className="an-empty">Statistika atsiras, kai sugeneruosite arba importuosite posėdį.</div>
                  </div>
                </div>

                {/* LIVE TAB */}
                <div className="tab-panel" data-tab-panel="live">
                  <div className="panel-intro">
                    <h3>Gyva būsena</h3>
                    <p>Paskutiniai posėdžio atnaujinimai realiu laiku.</p>
                  </div>
                  <div className="updates-stream" id="updatesContainer">
                    <div className="update-item">
                      <div className="update-time">-</div>
                      <div className="update-text">Laukiama naujo posėdžio generavimo</div>
                    </div>
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
