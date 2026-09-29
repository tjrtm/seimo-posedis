import { useEffect } from 'react';
import './App.css';
import ChatGPTSignIn from './chatgpt_signin.jsx';

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

function Icon({ name }) {
  const paths = {
    settings: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" /></>,
    sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14Z" /><path d="m5 2 .7 1.8L7.5 4.5l-1.8.7L5 7l-.7-1.8-1.8-.7 1.8-.7L5 2Z" /></>,
    upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></>,
    download: <><path d="M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5" /><path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></>,
    file: <><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10Z" /><path d="M13 3v7h7M8 15l2 2-2 2m8-4-2 2 2 2" /></>,
    folder: <><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 10h18" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></>,
    activity: <><path d="M3 12h4l3-8 4 16 3-8h4" /></>,
    ballot: <><path d="M7 3h10a2 2 0 0 1 2 2v16H5V5a2 2 0 0 1 2-2Z" /><path d="M8 8h8m-8 4h2m4 0h2m-8 4h8" /></>,
    chart: <><path d="M4 19V5m0 14h17" /><path d="m7 15 4-4 3 2 6-7" /><path d="M16 6h4v4" /></>
  };

  return (
    <svg className="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
}

function App() {
  useEffect(() => {
    if (window.initializeSeimasLiveStream) {
      window.initializeSeimasLiveStream();
    } else {
      console.warn('Seimas controller nerastas. Įsitikinkite, kad legacy skriptai įtraukti per index.html.');
    }
    // Wire the optional real-agenda importer now that its panel is mounted.
    if (window.initializeSeimasRealAgenda) {
      window.initializeSeimasRealAgenda();
    }

    const header = document.querySelector('.header');
    const updateHeaderDensity = () => {
      header?.classList.toggle('is-condensed', window.scrollY > 32 && window.innerWidth > 720);
    };
    window.addEventListener('scroll', updateHeaderDensity, { passive: true });
    window.addEventListener('resize', updateHeaderDensity);
    updateHeaderDensity();

    return () => {
      window.removeEventListener('scroll', updateHeaderDensity);
      window.removeEventListener('resize', updateHeaderDensity);
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-inner">
          <div className="header-brand">
            <div className="brand-lockup">
              <div className="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
              <div>
                <p className="brand-eyebrow">Plenarinio posėdžio simuliacija</p>
                <h1>Seimas AI <span>Generator</span></h1>
              </div>
            </div>
            <p className="header-description">
              Valdykite diskusijas, balsavimus ir generavimo režimus vienoje darbo erdvėje.
            </p>
          </div>
          <div className="header-actions">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>STUDIJA</span>
            </div>
            <div className="header-buttons">
              <div className="header-action-group header-action-group--primary">
                <button className="icon-btn" id="settingsModalOpenBtn" title="Nustatymai (modelis, balsai, raktai)" aria-label="Nustatymai">
                  <Icon name="settings" />
                </button>
                <button className="generate-btn" id="toggleSetupBtn"><Icon name="sparkles" />Generuoti posėdį</button>
              </div>
              <div className="header-action-group">
                <button className="ghost-btn" id="importBundleBtn" title="Įkelti sesijos JSON ir garso failus">
                  <Icon name="upload" />Importuoti
                </button>
                <button className="ghost-btn" id="exportSessionBtn" title="Eksportuoti visą posėdį su audio" disabled>
                  <Icon name="download" />Eksportuoti
                </button>
              </div>
              <div className="header-action-group header-action-group--compact">
                <button className="ghost-btn" id="loadSessionBtn" title="Atidaryti JSON sesiją"><Icon name="file" />JSON</button>
                <button className="ghost-btn" id="loadSessionFolderBtn" title="Atidaryti sesijos aplanką"><Icon name="folder" />Aplankas</button>
              </div>
              <button className="members-btn" id="membersBtn"><Icon name="users" />Nariai <span className="members-count">141</span></button>
            </div>
          </div>
        </div>
      </header>

      <input type="file" id="loadSessionInput" accept="application/json" style={{ display: 'none' }} />
      <input type="file" id="importBundleInput" accept=".json,.zip,audio/*" multiple style={{ display: 'none' }} />

      <div className="content-shell">
        <div className="content-inner">
          <div className="main-grid" id="mainGrid">
            <div className="left-stack">
              <section className="card live-stage">
                <div className="parliament-chamber">
                  <div className="broadcast-topline" aria-hidden="true">
                    <span>SEIMO POSĖDŽIO SIMULIACIJA</span>
                    <span className="broadcast-topline__simulation"><i></i> SIMULIACIJA</span>
                  </div>
                  <div className="chambers-view" id="chambersView"></div>
                  <div className="chamber-overlay">
                    <div className="stage-pill" id="stageRepresentationLabel" title="Stilizuotas dirbtinis personažas; neatvaizduoja tikro žmogaus. / Stylized synthetic avatar; does not depict a real person." hidden>Sintetinis avataras</div>
                    <div className="speaker-info" id="speakerInfo">
                      <div className="speaker-name" id="speakerName">Seimo posėdis prasidės netrukus</div>
                      <div className="speaker-title" id="speakerTitle"></div>
                      <div className="speaker-party" id="speakerParty"></div>
                    </div>
                    <div className="current-speech" id="currentSpeech">
                      Sukurkite posėdį pasirinkę „Generuoti posėdį“ arba įkelkite jau paruoštą sesiją.
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
                    <button className="control-btn sidebar-toggle" id="toggleSidebarBtn" title="Paslėpti šoninį skydelį ir žiūrėti platų vaizdo srautą">⛶ Platus vaizdas</button>
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
                  <button className="tab-btn active" data-tab-btn="live"><Icon name="activity" />Būsena</button>
                  <button className="tab-btn" data-tab-btn="results"><Icon name="ballot" />Rezultatai <span className="tab-count"></span></button>
                  <button className="tab-btn" data-tab-btn="stats"><Icon name="chart" />Statistika</button>
                </div>

                {/* LIVE TAB */}
                <div className="tab-panel active" data-tab-panel="live">
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
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* SETTINGS MODAL — opened from the ⚙️ icon in the top panel */}
      <div id="settingsModal" className="settings-modal">
        <div className="settings-modal__dialog" role="dialog" aria-modal="true" aria-label="Nustatymai">
          <div className="settings-modal__header">
            <div>
              <p className="settings-modal__eyebrow">Konfigūracija</p>
              <h2>Nustatymai ir posėdžio generavimas</h2>
            </div>
            <button className="settings-modal__close" id="settingsModalCloseBtn" title="Uždaryti">&times;</button>
          </div>

          <div className="settings-modal__body">
            <div className="setup-panel active" id="setupPanel">
              <div className="setup-form">

                <div className="settings-section">
                  <button type="button" className="section-head" data-accordion>
                    <span>Tema ir kalba</span><span className="chevron">▾</span>
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

                <div className="settings-section collapsed" id="realAgendaPanel">
                  <button type="button" className="section-head" data-accordion>
                    <span>Reali Seimo darbotvarkė</span><span className="chevron">▾</span>
                  </button>
                  <div className="section-body">
                    <p className="section-hint">
                      Pasirinkite realų Seimo plenarinio posėdžio darbotvarkės klausimą kaip temą.
                      Tai neprivaloma — temą galite redaguoti arba įvesti savo. Duomenys imami tiesiogiai
                      iš Seimo atvirų duomenų; programa nieko negeneruoja iš šio šaltinio automatiškai.
                    </p>
                    <div className="form-field">
                      <label htmlFor="realAgendaSessionSelect">Sesija</label>
                      <select id="realAgendaSessionSelect"></select>
                    </div>
                    <div className="form-field">
                      <label htmlFor="realAgendaSittingSelect">Posėdis</label>
                      <select id="realAgendaSittingSelect"></select>
                    </div>
                    <div className="real-agenda-toolbar">
                      <button type="button" className="ghost-btn" id="realAgendaRefreshBtn" title="Atnaujinti iš Seimo">↻ Atnaujinti</button>
                    </div>
                    <div className="real-agenda-list" id="realAgendaList"></div>
                    <small className="real-agenda-status" id="realAgendaStatus"></small>
                  </div>
                </div>

                <div className="settings-section">
                  <button type="button" className="section-head" data-accordion>
                    <span>Generavimo tiekėjas</span><span className="chevron">▾</span>
                  </button>
                  <div className="section-body">
                    <p className="section-hint">Pasirinkite, kuris tiekėjas generuos stenogramą ir balsus. Kiekvienas režimas turi savo nustatymus žemiau.</p>
                    <div className="mode-toggle" id="generationModeToggle">
                      <button className="mode-option active" data-mode="local">
                        <div>🔒 Lokalus</div>
                        <p>Ollama + Speaches jūsų kompiuteryje.</p>
                      </button>
                      <button className="mode-option" data-mode="remote">
                        <div>☁️ OpenAI</div>
                        <p>OpenAI Responses + TTS modeliai.</p>
                      </button>
                      <button className="mode-option" data-mode="chatgpt">
                        <div>ChatGPT</div><p>ChatGPT planas / Plan usage</p>
                      </button>
                      <button className="mode-option" data-mode="xai">
                        <div>🚀 xAI (Grok)</div>
                        <p>Grok chat + Grok teksto į kalbą.</p>
                      </button>
                    </div>

                    <div className="config-panels">
                      <ChatGPTSignIn />
                      <div className="config-panel" id="localConfigPanel">
                        <div className="panel-title">Lokalus generavimas</div>
                        <div className="provider-guidance">
                          <strong>Rekomenduojama / Recommended</strong>
                          <span>Ilgoms stenogramoms: <code>qwen3:30b</code> (modelio failas apie 19 GB); mažesniam kompiuteriui rinkitės <code>qwen3:8b</code>.</span>
                          <span lang="en">For long transcripts: <code>qwen3:30b</code> (about 19 GB model download); use <code>qwen3:8b</code> on smaller machines. Pull the model with <code>ollama pull</code> first.</span>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="localOllamaBaseUrlInput">Ollama API URL</label>
                            <input type="text" id="localOllamaBaseUrlInput" placeholder="http://localhost:11434" />
                            <small>Įsitikinkite, kad Ollama veikia ir modelis atsisiųstas.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="localOllamaModelInput">Ollama modelio pavadinimas</label>
                            <input type="text" id="localOllamaModelInput" placeholder="qwen3:30b" />
                            <small>Rekomenduojamas modelis ilgoms stenogramoms. Jis turi būti įdiegtas su <code>ollama pull qwen3:30b</code>.</small>
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
                            <small>Programa prideda <code>/audio/speech</code>. Paleiskite Speaches: <code>cd speaches &amp;&amp; docker compose -f compose.cpu.yaml up speaches</code>.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="speachesModelInput">Speaches modelio ID / alias</label>
                            <input type="text" id="speachesModelInput" placeholder="speaches-ai/Kokoro-82M-v1.0-ONNX" />
                            <small>Numatytasis Kokoro modelis; Speaches turi veikti, kitaip stenograma bus be garso.</small>
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
                        <div className="provider-guidance">
                          <strong>Rekomenduojama / Recommended</strong>
                          <span>Stenogramai: <code>gpt-5.6-luna</code>. Balsams: <code>gpt-4o-mini-tts</code>.</span>
                          <span lang="en">Transcript: <code>gpt-5.6-luna</code>. Speech: <code>gpt-4o-mini-tts</code>.</span>
                          <span>Abiejų API bazinis adresas: <code>https://api.openai.com/v1</code>; programa prideda <code>/responses</code> arba <code>/audio/speech</code>.</span>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="apiKeyInput">OpenAI API raktas</label>
                            <input type="password" id="apiKeyInput" placeholder="sk-... arba suderinamo endpoint tokenas" />
                            <small>Raktas saugomas tik jūsų naršyklėje ir siunčiamas kaip Bearer tokenas.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="openAIBaseUrlInput">Responses bazinis URL</label>
                            <input type="text" id="openAIBaseUrlInput" placeholder="https://api.openai.com/v1" />
                            <small>Palikite bazinį adresą be <code>/responses</code>; programa šį kelią prideda automatiškai.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="openAITranscriptModelInput">Stenogramos modelis</label>
                            <input type="text" id="openAITranscriptModelInput" placeholder="gpt-5.6-luna" />
                            <small><code>gpt-5.6-luna</code> rekomenduojamas ilgoms ir dažnai generuojamoms stenogramoms.</small>
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
                            <small>Bazinis URL <code>https://api.openai.com/v1</code>; programa prideda <code>/audio/speech</code>.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="openAITTSModelInput">TTS modelis</label>
                            <input type="text" id="openAITTSModelInput" placeholder="gpt-4o-mini-tts" />
                            <small>Rekomenduojamas modelis: <code>gpt-4o-mini-tts</code>. Endpointas: <code>/v1/audio/speech</code>.</small>
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

                      <div className="config-panel hidden" id="xaiConfigPanel">
                        <div className="panel-title">xAI (Grok) generavimas</div>
                        <div className="provider-guidance">
                          <strong>Rekomenduojama / Recommended</strong>
                          <span>Stenogramai: <code>grok-4.7</code>. TTS bazinis adresas: <code>https://api.x.ai/v1</code>.</span>
                          <span lang="en">Transcript: <code>grok-4.7</code>. TTS base URL: <code>https://api.x.ai/v1</code>; the app appends <code>/tts</code>.</span>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="xaiApiKeyInput">xAI API raktas</label>
                            <input type="password" id="xaiApiKeyInput" placeholder="xai-..." />
                            <small>Gaukite raktą iš <code>console.x.ai</code>. Saugomas tik jūsų naršyklėje.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="xaiBaseUrlInput">xAI bazinis URL</label>
                            <input type="text" id="xaiBaseUrlInput" placeholder="https://api.x.ai/v1" />
                            <small>OpenAI suderinamas <code>/chat/completions</code> endpointas.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="xaiTranscriptModelInput">Grok modelis</label>
                            <input type="text" id="xaiTranscriptModelInput" placeholder="grok-4.7" />
                            <small>Rekomenduojamas dabartinis modelis: <code>grok-4.7</code>.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="xaiMaxOutputTokensInput">Max tokens</label>
                            <input type="number" id="xaiMaxOutputTokensInput" min="1000" step="1000" placeholder="100000" />
                            <small>Siunčiama kaip <code>max_tokens</code>.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="xaiTemperatureInput">Temperatūra</label>
                            <input type="number" id="xaiTemperatureInput" min="0" max="2" step="0.05" placeholder="0.4" />
                            <small>Mažesnė – stabilesnis JSON, didesnė – kūrybiškesnės kalbos.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="xaiRequestOptionsInput">Papildomi Chat JSON</label>
                            <textarea id="xaiRequestOptionsInput" className="compact-textarea" placeholder='{"top_p":0.9}'></textarea>
                            <small>Sujungiami į <code>/chat/completions</code> užklausą.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="xaiTTSBaseUrlInput">xAI TTS bazinis URL</label>
                            <input type="text" id="xaiTTSBaseUrlInput" placeholder="https://api.x.ai/v1" />
                            <small>Naudojama <code>/tts</code> Grok balsų užklausoms.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="xaiTTSLanguageInput">TTS kalba</label>
                            <input type="text" id="xaiTTSLanguageInput" placeholder="auto" />
                            <small>BCP-47 kodas (pvz. <code>lt</code>, <code>en</code>) arba <code>auto</code>.</small>
                          </div>
                        </div>
                        <div className="dual-grid">
                          <div className="form-field">
                            <label htmlFor="xaiTTSFormatSelect">xAI audio formatas</label>
                            <select id="xaiTTSFormatSelect" defaultValue="mp3">
                              <option value="mp3">MP3 (numatytasis)</option>
                              <option value="wav">WAV</option>
                              <option value="pcm">PCM</option>
                            </select>
                            <small>Siunčiama kaip <code>output_format.codec</code>. Balsai (Eve, Ara, Leo, Rex, Sal) priskiriami automatiškai.</small>
                          </div>
                          <div className="form-field">
                            <label htmlFor="xaiTTSOptionsInput">Papildomi xAI TTS JSON</label>
                            <textarea id="xaiTTSOptionsInput" className="compact-textarea" placeholder='{"output_format":{"sample_rate":24000}}'></textarea>
                            <small>Sujungiami į <code>/tts</code> užklausą.</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-section">
                  <button type="button" className="section-head" data-accordion>
                    <span>Įgarsinimas</span><span className="chevron">▾</span>
                  </button>
                  <div className="section-body">
                    <div className="form-field form-field--full">
                      <label className="checkbox-label" htmlFor="textToSpeechCheckbox">
                        <input type="checkbox" id="textToSpeechCheckbox" />
                        <span>Įjungti teksto į kalbą (Speaches, OpenAI arba xAI Grok TTS pagal tiekėją).</span>
                      </label>
                      <div className="tts-status" id="textToSpeechStatus">
                        🔇 Teksto į kalbą funkcija išjungta. Įjunkite ją, kad generuotumėte balsus.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="settings-save-row">
                  <button type="button" className="settings-save-button" id="saveSettingsBtn">
                    <span aria-hidden="true">✓</span> Išsaugoti nustatymus / Save settings
                  </button>
                  <span className="settings-save-status" id="settingsSaveStatus" role="status" aria-live="polite"></span>
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
        </div>
      </div>

      <div id="membersModal" className="members-modal">
        <div className="modal-content" role="dialog" aria-modal="true" aria-label="Seimo nariai">
          <div className="modal-left">
            <div className="modal-header">
              <h2>Lietuvos Respublikos Seimo nariai (2024-2028)</h2>
              <button className="close" id="closeModal" type="button" aria-label="Uždaryti">&times;</button>
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
