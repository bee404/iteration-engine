import Image from "next/image";
import Link from "next/link";

const directionRows = [
  { label: "Clearer path", detail: "Reduce hesitation", accent: "light" },
  { label: "Stronger focus", detail: "Make the next move obvious", accent: "warm" },
  { label: "More context", detail: "Keep the system legible", accent: "cool" },
];

function MockScreenshot() {
  return (
    <div className="workflow-mock-window" aria-label="Example uploaded product screenshot">
      <div className="workflow-mock-toolbar">
        <span className="workflow-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="workflow-window-url">app.example.com / setup</span>
        <span className="workflow-window-lock" aria-hidden="true">⌁</span>
      </div>
      <div className="workflow-mock-app">
        <aside className="workflow-mock-sidebar">
          <div className="workflow-mock-logo"><span /> Orbit</div>
          <span className="workflow-mock-nav active">Get started</span>
          <span className="workflow-mock-nav">Workspace</span>
          <span className="workflow-mock-nav">Settings</span>
          <div className="workflow-mock-sidebar-rule" />
          <span className="workflow-mock-nav muted">Resources</span>
        </aside>
        <div className="workflow-mock-content">
          <div className="workflow-mock-breadcrumb">Workspace / Setup</div>
          <h3>Get your workspace ready</h3>
          <p>A few focused steps and you are ready to go.</p>
          <div className="workflow-mock-task is-next">
            <span className="workflow-mock-check" />
            <span><b>Connect your data</b><small>Start with your primary source</small></span>
            <em>Open</em>
          </div>
          <div className="workflow-mock-task">
            <span className="workflow-mock-check" />
            <span><b>Invite your team</b><small>Bring the right people in</small></span>
            <em>Next</em>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <main className="workflow-page">
      <header className="workflow-header">
        <Link className="workflow-wordmark" href="/" aria-label="Back to Coquí workspace">
          <Image src="/brand/coqui-wordmark.svg" alt="Coquí" width={56} height={26} priority />
        </Link>
        <button className="workflow-sound-button" type="button" aria-label="Play coquí call" disabled>
          <Image src="/brand/icon-volume-cross.svg" alt="" width={20} height={20} />
        </button>
      </header>

      <section className="workflow-intro" aria-labelledby="workflow-title">
        <div>
          <p className="workflow-kicker">One round, end to end</p>
          <h1 id="workflow-title">Start with the screen.<br /><em>Leave with a sharper one.</em></h1>
        </div>
        <p className="workflow-intro-copy">
          Coquí turns a screenshot and the feedback around it into a clearer next move.
          You stay in charge of what earns another round.
        </p>
      </section>

      <section className="workflow-reference" aria-labelledby="reference-title">
        <div className="workflow-reference-stage">
          <div className="workflow-stage-label"><span>01</span> Reference</div>
          <MockScreenshot />
          <div className="workflow-screenshot-caption">
            <span>setup-screen.png</span>
            <span>1280 × 832 · viewport captured</span>
          </div>
        </div>
        <div className="workflow-brief">
          <div className="workflow-brief-topline"><span>Start here</span><span>Required</span></div>
          <h2 id="reference-title">Give the round its point of view.</h2>
          <p className="workflow-brief-copy">The image is the object. The brief tells Coquí what to look for.</p>
          <div className="workflow-brief-field">
            <span>Goal</span>
            <strong>Make the next step feel obvious.</strong>
          </div>
          <div className="workflow-brief-field workflow-brief-field-tall">
            <span>Feedback, as received</span>
            <strong>It feels a little dense. I want people to know where to start.</strong>
          </div>
          <div className="workflow-brief-foot">
            <span>Reviewer context · Product design</span>
            <span>Constraints · Keep the existing structure</span>
          </div>
          <a className="workflow-quiet-action" href="#critique">See what happens next <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="workflow-flow" aria-label="Happy path workflow stages">
        <div className="workflow-flow-heading">
          <div>
            <p className="workflow-kicker">The loop</p>
            <h2>From input to committed iteration.</h2>
          </div>
          <span className="workflow-flow-count">04 stages after the reference</span>
        </div>

        <article className="workflow-stage workflow-stage-critique" id="critique">
          <div className="workflow-stage-index">02</div>
          <div className="workflow-stage-main">
            <div className="workflow-stage-copy">
              <p className="workflow-stage-eyebrow">Interpret</p>
              <h3>Separate the problem from the taste.</h3>
              <p>Sonnet reads the screen against the goal and the feedback, then makes the useful tension visible.</p>
            </div>
            <div className="workflow-critique-result">
              <div className="workflow-result-column signal">
                <span className="workflow-result-label"><i /> Real problems</span>
                <p>The first action competes with the page introduction.</p>
              </div>
              <div className="workflow-result-column preference">
                <span className="workflow-result-label"><i /> Taste</span>
                <p>The page could feel lighter, but that is a direction to test.</p>
              </div>
            </div>
          </div>
        </article>

        <article className="workflow-stage workflow-stage-directions">
          <div className="workflow-stage-index">03</div>
          <div className="workflow-stage-main">
            <div className="workflow-stage-copy">
              <p className="workflow-stage-eyebrow">Explore</p>
              <h3>See a few real ways forward.</h3>
              <p>Each direction names the decision, the tradeoff, and the change it would make.</p>
            </div>
            <div className="workflow-direction-list" aria-label="Example iteration directions">
              {directionRows.map((direction, index) => (
                <div className={`workflow-direction-row ${direction.accent}`} key={direction.label}>
                  <span className="workflow-direction-number">0{index + 1}</span>
                  <strong>{direction.label}</strong>
                  <span>{direction.detail}</span>
                  <span className="workflow-direction-arrow" aria-hidden="true">→</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="workflow-stage workflow-stage-code">
          <div className="workflow-stage-index">04</div>
          <div className="workflow-stage-main">
            <div className="workflow-stage-copy">
              <p className="workflow-stage-eyebrow">Make it tangible <span>Optional</span></p>
              <h3>Generate code when a direction earns it.</h3>
              <p>Sonnet streams a self-contained prototype. Coquí keeps the raw source visible while the live preview mounts.</p>
            </div>
            <div className="workflow-code-demo">
              <div className="workflow-code-pane" aria-label="Generated code preview">
                <div className="workflow-pane-bar"><span>generated.tsx</span><span className="workflow-streaming"><i /> streaming</span></div>
                <div className="workflow-code-lines" aria-hidden="true">
                  <span><b>01</b> <i>export default function</i> Setup() &#123;</span>
                  <span><b>02</b> &nbsp;return (</span>
                  <span><b>03</b> &nbsp;&nbsp;&lt;main className=<em>&quot;setup&quot;</em>&gt;</span>
                  <span><b>04</b> &nbsp;&nbsp;&nbsp;&nbsp;&lt;h1&gt;Get started&lt;/h1&gt;</span>
                  <span><b>05</b> &nbsp;&nbsp;);</span>
                </div>
              </div>
              <div className="workflow-live-pane">
                <div className="workflow-pane-bar"><span>Live preview</span><span className="workflow-live-dot">Live</span></div>
                <div className="workflow-live-preview">
                  <div className="workflow-preview-heading"><span /><span /><span /></div>
                  <strong>Make the next step obvious</strong>
                  <div className="workflow-preview-action" />
                  <div className="workflow-preview-row"><span /><span /><i /></div>
                  <div className="workflow-preview-row short"><span /><span /><i /></div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="workflow-stage workflow-stage-commit">
          <div className="workflow-stage-index">05</div>
          <div className="workflow-stage-main workflow-commit-main">
            <div className="workflow-stage-copy">
              <p className="workflow-stage-eyebrow">Commit</p>
              <h3>Keep the useful one.</h3>
              <p>Approve the direction you want to carry forward. The round is saved to your chain.</p>
            </div>
            <div className="workflow-commit-action">
              <div className="workflow-chain" aria-label="Round saved to the iteration chain">
                <span className="workflow-chain-node done" />
                <span className="workflow-chain-line" />
                <span className="workflow-chain-node done" />
                <span className="workflow-chain-line" />
                <span className="workflow-chain-node current" />
              </div>
              <div className="workflow-commit-label"><span>Round 03</span><strong>Saved to the chain</strong></div>
              <button className="workflow-primary-action" type="button">Save &amp; export <span aria-hidden="true">↗</span></button>
              <small>Save is live. Export is the next handoff.</small>
            </div>
          </div>
        </article>
      </section>

      <footer className="workflow-footer">
        <span>One screen. One decision. One clearer next round.</span>
        <Link href="/">Back to Coquí <span aria-hidden="true">↗</span></Link>
      </footer>
    </main>
  );
}
