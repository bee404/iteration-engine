import { useEffect, useRef, useState } from "react";
import { CaretLeft, Check, ImageSquare, UploadSimple } from "@phosphor-icons/react";

const MAX_ROUND_NAME = 20;
const MIN_ROUND_NAME = 3;
const SOURCE_STORAGE_KEY = "coqui.round.source";
const SOURCE_NAME_STORAGE_KEY = "coqui.round.sourceName";
const DEFAULT_SOURCE = {
  src: "/assets/nexaflow-source.png",
  name: "Nexaflow onboarding",
  meta: "1440 × 1035",
};

const getRoundSource = () => {
  if (typeof window === "undefined") return DEFAULT_SOURCE;
  try {
    const src = window.sessionStorage.getItem(SOURCE_STORAGE_KEY);
    const name = window.sessionStorage.getItem(SOURCE_NAME_STORAGE_KEY);
    return src ? { src, name: name || "Uploaded screenshot", meta: "Uploaded image" } : DEFAULT_SOURCE;
  } catch {
    return DEFAULT_SOURCE;
  }
};

const sanitizeRoundName = (value) =>
  value
    .normalize("NFKC")
    .replace(/[^\p{L}\p{M}\p{N} &'’.\-]/gu, "")
    .replace(/\s{2,}/g, " ")
    .slice(0, MAX_ROUND_NAME);

const navigateToStep = (step, { review = false } = {}) => {
  const nextUrl = step ? `?step=${step}${review ? "&review=1" : ""}` : window.location.pathname;
  const commit = () => {
    window.history.pushState({}, "", nextUrl);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  if (document.startViewTransition) {
    document.startViewTransition(commit);
    return;
  }

  const source = step === 3 ? document.querySelector(".reference-frame") : null;
  if (!source) {
    commit();
    return;
  }

  const start = source.getBoundingClientRect();
  const flight = source.cloneNode(true);
  flight.className = "source-flight";
  Object.assign(flight.style, {
    top: `${start.top}px`,
    left: `${start.left}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
  });
  document.body.appendChild(flight);
  commit();

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const target = document.querySelector(".source-thumbnail");
      if (!target) {
        flight.remove();
        return;
      }
      const end = target.getBoundingClientRect();
      target.style.opacity = "0";
      Object.assign(flight.style, {
        top: `${end.top}px`,
        left: `${end.left}px`,
        width: `${end.width}px`,
        height: `${end.height}px`,
        opacity: ".82",
        borderRadius: "3px",
      });
      window.setTimeout(() => {
        target.style.opacity = "";
        flight.remove();
      }, 580);
    });
  });
};

const demoInputs = {
  goal: "Help a brand-new workspace admin understand the next onboarding action and complete setup without needing support.",
  feedback:
    "The page makes the next step unclear. Invite teammates is the only card that looks active, but the other setup steps are muted and it is hard to tell whether Connect to your data warehouse is complete, disabled, or waiting for an action. The help card on the right competes with the main checklist. I also think the page should feel warmer, more polished, and more premium.",
  reviewer: "Product designer reviewing the first-run onboarding experience with activation in mind.",
  constraints:
    "Preserve the three-step checklist, the support card, and Hightouch’s existing visual language. Do not invent new onboarding destinations.",
};

const demoCritique = {
  summary:
    "The onboarding page’s biggest problem is that the next action isn’t legible: the only visually active card isn’t the first real step, and step status is ambiguous. Those are concrete hierarchy and state problems worth fixing before any stylistic pass. The request to feel ‘warmer, more polished, more premium’ is real but is a taste preference, not a usability defect — and ‘premium’ is too vague to act on without an example.",
  signal: [
    "Invite teammates is the only card that reads as active, so the eye lands there instead of on the actual first step.",
    "Connect to your data warehouse has no status affordance — it is impossible to tell whether it is complete, disabled, or waiting on the user.",
    "The support card competes visually with the primary checklist, splitting attention away from the setup path.",
  ],
  preference:
    "Warmer, more polished, more premium is a stylistic preference about overall feel, not a specific usability problem to solve.",
  ambiguity:
    "More premium is not specific enough to act on. A reference screen or one concrete attribute would make it actionable rather than guessed at.",
};

const directions = [
  {
    id: "next-action",
    title: "Make the next action unmistakable",
    rationale:
      "Directly answers the signal items: give the first real step (Connect to your data warehouse) a primary, bordered treatment so it reads as the obvious next action, add an explicit status ring to every step, demote Invite teammates to a secondary underline action, and lock or dim steps that are not available yet. Preserves the three-step checklist and support card per the constraints.",
    rationaleDetail:
      "The underlying move is to make state, not card styling, carry the hierarchy. One step becomes unmistakably available now; completed, available, and locked states each receive a distinct visual treatment; and secondary collaboration or support actions remain accessible without competing with the setup path.",
    tieBack: [
      { label: "Goal", text: "Help a new workspace admin understand the next onboarding action without needing support." },
      { label: "Signal", text: "Invite teammates currently reads as active before the real first step." },
      { label: "Constraint", text: "Preserve the three-step checklist and the support card." },
    ],
    tradeoffs:
      "Leans on a single strong emphasis; if more steps are added later the ‘one obvious next action’ framing needs revisiting.",
    suggestedChanges: [
      "Give the active first step a 1px near-black border so it reads as primary; keep the others on the hairline border.",
      "Add a status ring per step (filled = done, outline = available, dimmed = locked) to remove the complete, disabled, or waiting ambiguity.",
      "Demote Invite teammates to a secondary underline action so it stops out-competing the first step.",
      "Dim and lock the destinations step until its prerequisite is met.",
    ],
    pattern: {
      name: "Hero section",
      url: "https://21st.dev/@prebuiltui/components/hero-section",
      description: "A comparable entry pattern organized around one dominant message and action.",
    },
    hasCapturedCode: true,
  },
  {
    id: "separate-guidance",
    title: "Separate guidance from the task",
    rationale:
      "Targets the competing-help-card signal: pull the support card out of the main column into a quieter secondary position so the checklist owns the primary reading path, without removing the support affordance the constraints require keeping.",
    rationaleDetail:
      "This is primarily a spatial hierarchy decision. Setup remains the dominant reading path, while assistance moves to a stable but subordinate location that users can find when they need it. Nothing is removed; the relationship between doing the work and getting help becomes more deliberate.",
    tieBack: [
      { label: "Goal", text: "Help a new workspace admin complete setup without needing support." },
      { label: "Signal", text: "The support card competes visually with the primary checklist." },
      { label: "Constraint", text: "Keep the support affordance available in the experience." },
    ],
    tradeoffs:
      "Moving help further from the task can make it slightly less discoverable for users who do get stuck.",
    suggestedChanges: [
      "Move the support card below or to a de-emphasized rail so it no longer competes with the checklist.",
      "Reduce the support card’s visual weight with a lighter surface and smaller heading.",
      "Keep a persistent but quiet ‘Need help?’ entry so the affordance is preserved.",
    ],
    pattern: {
      name: "Feature sections",
      url: "https://21st.dev/@prebuiltui/components/feature-sections",
      description: "A weighted grid pattern that keeps supporting guidance distinct from the primary task.",
    },
    hasCapturedCode: false,
  },
  {
    id: "progress-framing",
    title: "Add momentum with progress framing",
    rationale:
      "Addresses the ‘warmer, more premium, more energy’ preference through structure rather than decoration: a step counter and progress framing give a sense of momentum and polish while staying inside the existing visual language.",
    rationaleDetail:
      "The core move is temporal rather than ornamental: show where the user is, what has been completed, and what comes next. That added sense of progression can make the experience feel more intentional without treating a vague request for ‘premium’ as permission to invent a new visual language.",
    tieBack: [
      { label: "Goal", text: "Make setup legible and easier to complete for a first-time admin." },
      { label: "Preference", text: "The page should feel warmer, more polished, and more premium." },
      { label: "Constraint", text: "Stay within the existing visual language and ordered checklist." },
    ],
    tradeoffs:
      "Progress framing implies a fixed, ordered path; it fits worse if steps become optional or reorderable.",
    suggestedChanges: [
      "Add a ‘1 of 3’ style step counter and a slim progress indicator above the checklist.",
      "Introduce a brief encouraging subhead that reinforces forward momentum.",
      "Use restrained motion on step completion to add polish without introducing a new color system.",
    ],
    pattern: {
      name: "Bento grid",
      url: "https://21st.dev/@designali-in/components/bento-grid",
      description: "A modular layout pattern that creates progression through clear focal points and weighted units.",
    },
    hasCapturedCode: false,
  },
];

function GeneratedIteration() {
  return (
    <div className="generated-app" aria-label="Captured demo iteration">
      <aside className="generated-sidebar">
        <strong>hightouch</strong>
        <span className="generated-workspace">Obsidian53</span>
        <nav>
          <span className="is-active">Get started</span>
          <span>Agents</span>
          <span>Activation</span>
          <span>AI Decisioning</span>
          <span>Integrations</span>
        </nav>
      </aside>
      <div className="generated-main">
        <header>
          <h3>Get started with Hightouch</h3>
          <p>A few quick steps and your workspace will be ready to go.</p>
        </header>
        <div className="generated-steps">
          <article className="is-primary">
            <span className="generated-ring" />
            <div>
              <h4>Connect to your data warehouse</h4>
              <p>Link your data source to start syncing customer information.</p>
              <button type="button">Connect warehouse</button>
              <a href="#preview">Skip for now</a>
            </div>
          </article>
          <article>
            <span className="generated-ring" />
            <div>
              <h4>Invite teammates</h4>
              <p>Collaborate with your team to complete setup faster.</p>
              <a href="#preview">Invite teammates</a>
            </div>
          </article>
          <article className="is-locked">
            <span className="generated-ring" />
            <div>
              <h4>Add destinations</h4>
              <p>Connect tools where you want to send your customer data.</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}

function RoundHeader({ step, stepLabel, hasSource = true, initialName = "Nexaflow onboarding", backTo = null, status = "Awaiting input" }) {
  const [sourceOpen, setSourceOpen] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [roundName, setRoundName] = useState(initialName);
  const [roundNameDraft, setRoundNameDraft] = useState(initialName);
  const source = getRoundSource();
  const remaining = MAX_ROUND_NAME - roundNameDraft.length;
  const nameIsValid = roundNameDraft.trim().length >= MIN_ROUND_NAME;

  const saveRoundName = (event) => {
    event.preventDefault();
    const nextName = sanitizeRoundName(roundNameDraft).trim();
    if (nextName.length < MIN_ROUND_NAME) return;
    setRoundName(nextName);
    setRoundNameDraft(nextName);
    setNameEditing(false);
  };

  return (
    <header className="app-header flow-header">
      <a className="wordmark-mount" href="?step=1" aria-label="Coquí home">
        <img className="wordmark" src="/assets/coqui-wordmark-solid-light.svg" alt="Coquí" />
      </a>

      <div className="round-identity">
        {backTo && (
          <button className="session-back" type="button" onClick={() => navigateToStep(backTo, { review: true })} aria-label={`Back to step ${backTo}`}>
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
          </button>
        )}
        {nameEditing ? (
          <form className="round-name-editor" onSubmit={saveRoundName}>
            <label htmlFor={`round-name-${step}`}>Round name</label>
            <div className={`round-name-field ${nameIsValid ? "" : "is-invalid"}`}>
              <input
                id={`round-name-${step}`}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck="false"
                autoFocus
                value={roundNameDraft}
                minLength={MIN_ROUND_NAME}
                maxLength={MAX_ROUND_NAME}
                aria-describedby={`round-name-validation-${step}`}
                aria-invalid={!nameIsValid}
                onChange={(event) => setRoundNameDraft(sanitizeRoundName(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setRoundNameDraft(roundName);
                    setNameEditing(false);
                  }
                }}
              />
              <span>{roundNameDraft.length}/{MAX_ROUND_NAME}</span>
              <button className="round-name-save" type="submit" disabled={!nameIsValid} aria-label="Save round name">
                <Check size={14} weight="bold" aria-hidden="true" />
              </button>
            </div>
            <small id={`round-name-validation-${step}`} aria-live="polite">
              {nameIsValid ? `${remaining} characters remaining` : `Use at least ${MIN_ROUND_NAME} characters`}
            </small>
          </form>
        ) : (
          <button
            className="round-name"
            type="button"
            onClick={() => {
              setRoundNameDraft(roundName);
              setNameEditing(true);
            }}
            aria-label={`Rename round: ${roundName}`}
          >
            <span>{roundName}</span>
          </button>
        )}
        {!nameEditing && <span className="round-name-tooltip" role="tooltip">Click to change the round name.</span>}

        <div className="step-marker-wrap">
          <button className="step-marker" type="button" aria-describedby={`step-tooltip-${step}`}>STP0{step}</button>
          <span className="step-tooltip" id={`step-tooltip-${step}`} role="tooltip">Step {step} · {stepLabel}</span>
        </div>
      </div>

      {hasSource ? (
        <div className="source-disclosure">
          <button
            className="source-toggle"
            type="button"
            aria-expanded={sourceOpen}
            onClick={() => setSourceOpen((open) => !open)}
          >
            <span className="source-thumbnail source-transition-object" aria-hidden="true">
              <img src={source.src} alt="" />
            </span>
            <span className="source-toggle-copy">
              <strong>Original input</strong>
              <small>{source.meta}</small>
            </span>
          </button>
          {sourceOpen && (
            <div className="source-popover">
              <div className="source-preview flow-source-preview">
                <img src={source.src} alt={`Original ${source.name} screenshot`} />
              </div>
              <div className="source-meta">
                <span>Original round input</span>
                <span>{source.meta}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flow-header-status"><span /> {status}</div>
      )}
    </header>
  );
}

function UploadFlowView() {
  const review = new URLSearchParams(window.location.search).get("review") === "1";
  const inputRef = useRef(null);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const next = () => navigateToStep(2);

  const acceptFile = (file) => {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) {
      setUploadError("Choose a PNG, JPG, WEBP, or GIF image.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("That image is larger than 3 MB. Choose a smaller file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        window.sessionStorage.setItem(SOURCE_STORAGE_KEY, String(reader.result));
        window.sessionStorage.setItem(SOURCE_NAME_STORAGE_KEY, file.name.replace(/\.[^.]+$/, "") || "Uploaded screenshot");
      } catch {
        setUploadError("This browser could not hold the image for the demo round.");
        return;
      }
      setUploadError("");
      next();
    };
    reader.onerror = () => setUploadError("That image could not be read. Try another file.");
    reader.readAsDataURL(file);
  };

  return (
    <main className="app-shell flow-shell">
      <RoundHeader step={1} stepLabel="Add the visual source" hasSource={false} initialName="New round" />
      <section className="flow-hero upload-hero">
        <div className="flow-kicker"><span>01</span> Visual source</div>
        <h1>Begin with the screen.</h1>
        <p>Coquí starts from the thing you are actually trying to improve. Add one screenshot and keep its original composition intact.</p>
      </section>
      <section className="upload-workspace">
        <button
          className={`upload-drop-field ${review ? "is-readonly" : ""} ${dragActive ? "is-dragging" : ""}`}
          type="button"
          onClick={review ? undefined : () => inputRef.current?.click()}
          onDragEnter={review ? undefined : (event) => { event.preventDefault(); setDragActive(true); }}
          onDragOver={review ? undefined : (event) => event.preventDefault()}
          onDragLeave={review ? undefined : () => setDragActive(false)}
          onDrop={review ? undefined : (event) => { event.preventDefault(); setDragActive(false); acceptFile(event.dataTransfer.files?.[0]); }}
          disabled={review}
        >
          <input ref={inputRef} className="upload-file-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" tabIndex={-1} onClick={(event) => event.stopPropagation()} onChange={(event) => acceptFile(event.target.files?.[0])} />
          <UploadSimple size={30} weight="thin" aria-hidden="true" />
          <strong>{review ? "Visual source captured" : "Select an image to upload"}</strong>
          <span>{review ? "This input is read-only for the completed round." : "Drop an image here or paste from your clipboard"}</span>
          <small>PNG, JPG, WEBP, or GIF · 3 MB maximum</small>
          {uploadError && <em className="upload-error" role="alert">{uploadError}</em>}
        </button>
        <div className="upload-rail" aria-label="What happens next">
          <span>What happens next</span>
          <p>The screenshot stays unchanged as the visual source for the entire round.</p>
          <p>After upload, add the goal, feedback, reviewer context, and constraints that give the critique meaning.</p>
          {!review && <button className="primary-action flow-advance" type="button" onClick={next}>Use demo input</button>}
        </div>
      </section>
    </main>
  );
}

function FeedbackFlowView({ review = false }) {
  const [inputs, setInputs] = useState(demoInputs);
  const source = getRoundSource();
  const updateInput = (key, value) => setInputs((current) => ({ ...current, [key]: value }));
  const next = () => navigateToStep(3);
  return (
    <main className="app-shell flow-shell">
      <RoundHeader step={2} stepLabel="Add feedback context" hasSource={false} backTo={1} status={review ? "Read-only history" : "Context in progress"} />
      <section className="flow-hero compact-flow-hero">
        <div>
          <div className="flow-kicker"><span>02</span> Feedback context</div>
          <h1>Give the feedback a frame.</h1>
        </div>
        <p>The screen is the working object here. The context beside it tells Coquí what the feedback is trying to accomplish and what cannot move.</p>
      </section>
      <section className="feedback-flow">
        <figure className="reference-column">
          <div className="reference-frame source-transition-object">
            <img src={source.src} alt={`Original ${source.name} screenshot`} />
          </div>
          <figcaption>
            <span><ImageSquare size={14} aria-hidden="true" /> Original input</span>
            <span>{source.meta}</span>
          </figcaption>
        </figure>

        <form className="brief-form" onSubmit={(event) => { event.preventDefault(); next(); }}>
          <label className="brief-field">
            <span className="brief-field-head"><b>Goal</b><small>Required</small></span>
            <textarea rows="3" value={inputs.goal} readOnly={review} onChange={(event) => updateInput("goal", event.target.value)} />
          </label>
          <label className="brief-field is-emphasis">
            <span className="brief-field-head"><b>Feedback</b><small>Required</small></span>
            <textarea rows="7" value={inputs.feedback} readOnly={review} onChange={(event) => updateInput("feedback", event.target.value)} />
          </label>
          <label className="brief-field">
            <span className="brief-field-head"><b>Reviewer context</b><small>Optional</small></span>
            <textarea rows="3" value={inputs.reviewer} readOnly={review} onChange={(event) => updateInput("reviewer", event.target.value)} />
          </label>
          <label className="brief-field">
            <span className="brief-field-head"><b>Constraints</b><small>Optional</small></span>
            <textarea rows="4" value={inputs.constraints} readOnly={review} onChange={(event) => updateInput("constraints", event.target.value)} />
          </label>
          <div className="form-commit-row">
            <span>{review ? "Completed step · read-only" : "All required context is present."}</span>
            {!review && <button className="primary-action flow-advance" type="submit">Synthesize feedback</button>}
          </div>
        </form>
      </section>
    </main>
  );
}

function SynthesizedFlowView() {
  const next = () => navigateToStep(4);
  return (
    <main className="app-shell flow-shell">
      <RoundHeader step={3} stepLabel="Review the synthesized brief" backTo={2} />
      <section className="synthesis-layout">
        <aside className="synthesis-context">
          <div className="flow-kicker"><span>03</span> Synthesized brief</div>
          <p>Coquí has separated actionable signal from preference and identified what still needs definition.</p>
          <dl>
            <div><dt>Goal</dt><dd>{demoInputs.goal}</dd></div>
            <div><dt>Constraint</dt><dd>{demoInputs.constraints}</dd></div>
          </dl>
        </aside>

        <article className="synthesis-document">
          <div className="synthesis-document-scroll">
            <header className="synthesis-document-header">
              <div>
                <span>Distillation complete</span>
                <h1>What the feedback is really saying.</h1>
              </div>
              <span className="ready-indicator"><i /> Ready for directions</span>
            </header>

            <p className="synthesis-summary">{demoCritique.summary}</p>

            <div className="synthesis-columns">
              <section className="synthesis-list">
                <header><span>Signal</span><b>03</b></header>
                <ol>
                  {demoCritique.signal.map((item) => <li key={item}>{item}</li>)}
                </ol>
              </section>
              <div className="synthesis-secondary">
                <section>
                  <header><span>Preference</span><b>01</b></header>
                  <p>{demoCritique.preference}</p>
                </section>
                <section className="synthesis-ambiguity">
                  <header><span>Flagged ambiguity</span><b>01</b></header>
                  <p>{demoCritique.ambiguity}</p>
                </section>
              </div>
            </div>
          </div>

          <footer className="synthesis-footer">
            <p>The brief is now specific enough to produce distinct, rationale-backed paths.</p>
            <button className="primary-action flow-advance" type="button" onClick={next}>View directions</button>
          </footer>
        </article>
      </section>
    </main>
  );
}

function DirectionApp() {
  const [previewId, setPreviewId] = useState(directions[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [roundName, setRoundName] = useState("Nexaflow onboarding");
  const [roundNameDraft, setRoundNameDraft] = useState("Nexaflow onboarding");
  const [codeOpen, setCodeOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState("iteration");
  const source = getRoundSource();
  const direction = directions.find((item) => item.id === previewId);
  const directionIndex = directions.findIndex((item) => item.id === previewId);
  const remaining = MAX_ROUND_NAME - roundNameDraft.length;
  const nameIsValid = roundNameDraft.trim().length >= MIN_ROUND_NAME;

  useEffect(() => {
    if (!codeOpen && sourceOpen !== "full") return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setCodeOpen(false);
      if (sourceOpen === "full") setSourceOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [codeOpen, sourceOpen]);

  const openCode = () => {
    setComparisonMode("iteration");
    setCodeOpen(true);
  };

  const beginNameEdit = () => {
    setRoundNameDraft(roundName);
    setNameEditing(true);
  };

  const saveRoundName = (event) => {
    event.preventDefault();
    const nextName = sanitizeRoundName(roundNameDraft).trim();
    if (nextName.length < MIN_ROUND_NAME) return;
    setRoundName(nextName);
    setRoundNameDraft(nextName);
    setNameEditing(false);
  };

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="wordmark-mount" href="#workspace" aria-label="Coquí home">
          <img className="wordmark" src="/assets/coqui-wordmark-solid-light.svg" alt="Coquí" />
        </a>

        <div className="round-identity">
          <button className="session-back" type="button" onClick={() => navigateToStep(3, { review: true })} aria-label="Back to step 3">
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
          </button>
          {nameEditing ? (
            <form className="round-name-editor" onSubmit={saveRoundName}>
              <label htmlFor="round-name">Round name</label>
              <div className={`round-name-field ${nameIsValid ? "" : "is-invalid"}`}>
                <input
                  id="round-name"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  spellCheck="false"
                  autoFocus
                  value={roundNameDraft}
                  minLength={MIN_ROUND_NAME}
                  maxLength={MAX_ROUND_NAME}
                  aria-describedby="round-name-validation"
                  aria-invalid={!nameIsValid}
                  onChange={(event) => setRoundNameDraft(sanitizeRoundName(event.target.value))}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setRoundNameDraft(roundName);
                      setNameEditing(false);
                    }
                  }}
                />
                <span>{roundNameDraft.length}/{MAX_ROUND_NAME}</span>
                <button className="round-name-save" type="submit" disabled={!nameIsValid} aria-label="Save round name">
                  <Check size={14} weight="bold" aria-hidden="true" />
                </button>
              </div>
              <small id="round-name-validation" aria-live="polite">
                {nameIsValid ? `${remaining} characters remaining` : `Use at least ${MIN_ROUND_NAME} characters`}
              </small>
            </form>
          ) : (
            <button className="round-name" type="button" onClick={beginNameEdit} aria-label={`Rename round: ${roundName}`}>
              <span>{roundName}</span>
            </button>
          )}
          {!nameEditing && <span className="round-name-tooltip" role="tooltip">Click to change the round name.</span>}

          <div className="step-marker-wrap">
            <button className="step-marker" type="button" aria-describedby="step-tooltip">STP04</button>
            <span className="step-tooltip" id="step-tooltip" role="tooltip">Step 4 · Choose a direction</span>
          </div>
        </div>

        <div className="source-disclosure">
          <button
            className="source-toggle"
            type="button"
            aria-expanded={Boolean(sourceOpen)}
            onClick={() => setSourceOpen((open) => !open)}
          >
            <span className="source-thumbnail" aria-hidden="true">
              <img src={source.src} alt="" />
            </span>
            <span className="source-toggle-copy">
              <strong>Original input</strong>
            <small>{source.meta}</small>
            </span>
          </button>

          {sourceOpen === true && (
            <div className="source-popover">
              <button className="source-preview" type="button" onClick={() => setSourceOpen("full")}>
                <img src={source.src} alt={`Original ${source.name} screenshot`} />
              </button>
              <div className="source-meta">
                <span>Original round input</span>
                <button type="button" onClick={() => setSourceOpen("full")}>View full size</button>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="context-bar">
        <div className="context-copy">
          <h1>Choose a direction</h1>
          <p>Three viable paths from the same synthesized brief.</p>
        </div>
      </section>

      <section className="direction-workspace" id="workspace">
        <nav className="direction-index" aria-label="Directions">
          <div className="index-header">
            <span>Directions</span>
          </div>
          {directions.map((item, index) => (
            <button
              type="button"
              key={item.id}
              className={`direction-choice ${previewId === item.id ? "is-previewing" : ""}`}
              aria-current={previewId === item.id ? "true" : undefined}
              onClick={() => setPreviewId(item.id)}
            >
              <span className="direction-number">0{index + 1}</span>
              <span className="direction-choice-copy">
                <strong>{item.title}</strong>
              </span>
              <span className="direction-state">{previewId === item.id ? "Viewing" : "View"}</span>
            </button>
          ))}
        </nav>

        <article className="direction-detail" key={direction.id} aria-label={`Direction ${directionIndex + 1}: ${direction.title}`}>
          <div className="direction-detail-scroll">
            <div className="preview-status">
              <span className="active-direction-key"><b>0{directionIndex + 1}</b> Active direction</span>
              <span>{selectedId === direction.id ? "Export ready" : "Exploring"}</span>
            </div>

            <h2>{direction.title}</h2>
            <div className="rationale">
              <p>{direction.rationale}</p>
              <p>{direction.rationaleDetail}</p>
            </div>

            <section className="input-tieback" aria-label="How this direction connects to the round inputs">
              <div className="input-tieback__heading">
                <span>From this round</span>
                <p>The inputs this direction is responding to.</p>
              </div>
              <div className="input-tieback__items">
                {direction.tieBack.map((item) => (
                  <div className="input-tieback__item" key={item.label}>
                    <span>{item.label}</span>
                    <p>{item.text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="detail-section changes">
              <h3>Suggested changes</h3>
              <ol>
                {direction.suggestedChanges.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ol>
            </section>

            <section className="detail-section tradeoffs">
              <h3>Trade-offs</h3>
              <p>{direction.tradeoffs}</p>
            </section>

            <section className="detail-section grounding">
              <h3>Pattern grounding</h3>
              <a href={direction.pattern.url} target="_blank" rel="noreferrer">
                <span><b>21st.dev</b> · {direction.pattern.name}</span>
                <small>{direction.pattern.description}</small>
              </a>
            </section>
          </div>

          <footer className="direction-actions">
            <button className="secondary-action" type="button" onClick={openCode}>Generate code</button>
            <button className="primary-action" type="button" onClick={() => setSelectedId(direction.id)}>
              {selectedId === direction.id ? "Export prepared" : "Export this direction"}
            </button>
          </footer>
        </article>
      </section>

      {sourceOpen === "full" && (
        <div className="source-overlay" role="dialog" aria-modal="true" aria-label="Original source screenshot" onClick={() => setSourceOpen(false)}>
          <button className="overlay-close" type="button" onClick={() => setSourceOpen(false)}>Close</button>
                <img src={source.src} alt={`Original ${source.name} screenshot at full size`} onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {codeOpen && (
        <div className="code-sheet-scrim" onClick={() => setCodeOpen(false)}>
          <section className="code-sheet" role="dialog" aria-modal="true" aria-label={`Generated code for ${direction.title}`} onClick={(event) => event.stopPropagation()}>
            <header className="code-sheet-header">
              <div>
                <span>Generated code · Direction 0{directionIndex + 1}</span>
                <h3>{direction.title}</h3>
              </div>
              <button type="button" onClick={() => setCodeOpen(false)}>Close</button>
            </header>

            {direction.hasCapturedCode ? (
              <div className="comparison-shell">
                <div className="comparison-controls" aria-label="Comparison view">
                  <button type="button" className={comparisonMode === "source" ? "is-active" : ""} onClick={() => setComparisonMode("source")}>Source</button>
                  <button type="button" className={comparisonMode === "iteration" ? "is-active" : ""} onClick={() => setComparisonMode("iteration")}>Iteration</button>
                  <span>Fixed viewport · 1440 × 1035</span>
                </div>
                <div className="comparison-viewport" id="preview">
                  <div className="comparison-frame">
                    {comparisonMode === "source" ? (
                      <img src={source.src} alt="Original input in the fixed comparison viewport" />
                    ) : (
                      <GeneratedIteration />
                    )}
                  </div>
                </div>
                <p className="capture-note">Captured demo output. The iteration and its direct source remain registered in the same viewport box.</p>
              </div>
            ) : (
              <div className="no-capture" role="status">
                <span>Demo replay</span>
                <h4>No captured code exists for this direction.</h4>
                <p>The saved demo has a real generated result for Direction 01 only. In the product, this state returns a typed generation error and remains retryable rather than showing invented output.</p>
                <button type="button" onClick={() => setCodeOpen(false)}>Return to directions</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

export function App() {
  const [locationKey, setLocationKey] = useState(() => `${window.location.pathname}${window.location.search}`);
  useEffect(() => {
    const syncLocation = () => setLocationKey(`${window.location.pathname}${window.location.search}`);
    window.addEventListener("popstate", syncLocation);
    return () => window.removeEventListener("popstate", syncLocation);
  }, []);
  const params = new URLSearchParams(window.location.search);
  const step = params.get("step");
  const review = params.get("review") === "1";
  useEffect(() => {
    const titles = { "1": "Add a visual source", "2": "Add feedback context", "3": "Review the synthesized brief" };
    document.title = `Coquí · ${titles[step] || (step ? "Choose a direction" : "Add a visual source")}`;
  }, [step]);
  void locationKey;
  if (!step || step === "1") return <UploadFlowView />;
  if (step === "2") return <FeedbackFlowView review={review} />;
  if (step === "3") return <SynthesizedFlowView />;
  if (step === "4") return <DirectionApp />;
  return <UploadFlowView />;
}
