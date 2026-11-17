
function LandingPage({ onLogin, onRegister }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a className="brand-link" href="#home" aria-label="Sweety home">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div className="brand-copy">
              <strong>Sweety</strong>
              <span>GLUCOSE TRACKER</span>
            </div>
          </div>
        </a>

        <div className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>

        <div className="landing-nav-actions">
          <button className="nav-login" onClick={onLogin}>Log in</button>
          <button className="primary-button nav-cta" onClick={onRegister}>
            Get started <span className="arrow-icon" aria-hidden="true">↗</span>
          </button>
        </div>
      </nav>

      <section className="landing-hero" id="home">
        <div className="hero-copy">
          <div className="hero-badge">
            <span className="badge-pulse" />
            A CLEARER WAY TO TRACK YOUR HEALTH
          </div>

          <h1>
            Your health journey,
            <br />
            <span>made easier.</span>
          </h1>

          <p className="hero-description">
            Take control of your daily glucose tracking. Record your readings,
            discover your patterns, and keep your health information organized
            — all in one simple place.
          </p>

          <div className="hero-actions">
            <button className="primary-button hero-primary" onClick={onRegister}>
              Start tracking for free <span className="arrow-icon" aria-hidden="true">↗</span>
            </button>
            <button className="hero-secondary" onClick={onLogin}>
              I already have an account <span>→</span>
            </button>
          </div>

          <div className="hero-assurance">
            <span><i>✓</i> Personal tracking</span>
            <span><i>✓</i> Clear reports</span>
            <span><i>✓</i> Simple to use</span>
          </div>
        </div>

        <div className="hero-product">
          <div className="hero-glow" />

          <div className="product-window">
            <div className="product-window-top">
              <div className="window-dots"><i /><i /><i /></div>
              <span>YOUR HEALTH DASHBOARD</span>
              <div className="window-avatar">S</div>
            </div>

            <div className="product-welcome">
              <div>
                <span className="preview-kicker">MONITOR YOUR PROGRESS</span>
                <h3>Your daily overview</h3>
                <p>A snapshot of your recorded readings.</p>
              </div>
              <span className="preview-date">This week</span>
            </div>

            <div className="preview-stat-grid">
              <div className="preview-stat">
                <span>Latest reading</span>
                <strong>112 <small>mg/dL</small></strong>
                <em><b /> Sample value</em>
              </div>
              <div className="preview-stat">
                <span>Readings logged</span>
                <strong>12</strong>
                <em>Across this week</em>
              </div>
            </div>

            <div className="preview-chart-card">
              <div className="preview-chart-title">
                <div>
                  <strong>Glucose trends</strong>
                  <span>Your readings over time</span>
                </div>
                <span className="chart-period">7 days⌄</span>
              </div>

              <div className="preview-chart">
                <div className="chart-y-labels">
                  <span>140</span>
                  <span>120</span>
                  <span>100</span>
                  <span>80</span>
                </div>
                <svg viewBox="0 0 430 150" preserveAspectRatio="none" role="img" aria-label="Illustrative glucose trend">
                  <defs>
                    <linearGradient id="previewArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#4b9b72" stopOpacity=".22" />
                      <stop offset="100%" stopColor="#4b9b72" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[22, 62, 102, 142].map((y) => (
                    <line key={y} x1="0" y1={y} x2="430" y2={y} stroke="#edf2ee" strokeDasharray="4 5" />
                  ))}
                  <path
                    d="M0 92 C28 87 38 48 76 59 S119 100 150 75 S195 35 224 54 S270 92 300 62 S340 28 366 45 S400 51 430 20 L430 150 L0 150Z"
                    fill="url(#previewArea)"
                  />
                  <path
                    d="M0 92 C28 87 38 48 76 59 S119 100 150 75 S195 35 224 54 S270 92 300 62 S340 28 366 45 S400 51 430 20"
                    fill="none"
                    stroke="#38845d"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx="300" cy="62" r="5" fill="#fff" stroke="#38845d" strokeWidth="3" />
                  <circle cx="430" cy="20" r="5" fill="#fff" stroke="#38845d" strokeWidth="3" />
                </svg>
              </div>
              <div className="chart-x-labels">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span>
                <span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
            </div>

            <div className="preview-insight">
              <div className="insight-icon">✦</div>
              <div>
                <strong>Consistency starts here</strong>
                <span>Keep your readings together in one place.</span>
              </div>
              <span className="insight-check">✓</span>
            </div>
          </div>

          <div className="floating-card floating-card-one">
            <span className="floating-symbol">⌁</span>
            <div><strong>Track with ease</strong><small>Your readings, organized</small></div>
          </div>

          <div className="floating-card floating-card-two">
            <span className="floating-symbol floating-symbol-soft">✓</span>
            <div><strong>Your data, in one place</strong><small>Simple. Clear. Personal.</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <p>EVERYDAY TRACKING, MADE SIMPLE</p>
        <div>
          <span><b>✳</b> Thoughtful design</span>
          <span><b>⌁</b> Easy record keeping</span>
          <span><b>◷</b> Helpful summaries</span>
          <span><b>♡</b> Your personal space</span>
        </div>
      </section>

      <section className="landing-features section-wrap" id="features">
        <div className="section-heading">
          <span className="eyebrow">A BETTER WAY TO STAY ORGANIZED</span>
          <h2>Everything you need.<br /><span>Nothing you don't.</span></h2>
          <p>
            Make daily glucose tracking feel less complicated with a simple
            experience designed around your routine.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <div className="feature-icon feature-icon-green">⌁</div>
            <span className="feature-number">01</span>
            <h3>Record every reading</h3>
            <p>
              Keep your morning, after-meal, and evening readings organized
              with date and time-slot tracking.
            </p>
            <span className="feature-link">Stay organized <b>↗</b></span>
          </article>

          <article className="feature-card feature-card-raised">
            <div className="feature-icon feature-icon-lilac">▥</div>
            <span className="feature-number">02</span>
            <h3>Understand your trends</h3>
            <p>
              See your recorded glucose values in a clear visual chart and
              explore how they change over time.
            </p>
            <span className="feature-link">Explore trends <b>↗</b></span>
          </article>

          <article className="feature-card">
            <div className="feature-icon feature-icon-peach">◷</div>
            <span className="feature-number">03</span>
            <h3>Review your reports</h3>
            <p>
              View daily and monthly summaries with average, highest,
              lowest, and total readings.
            </p>
            <span className="feature-link">Review progress <b>↗</b></span>
          </article>
        </div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="how-copy">
            <span className="eyebrow">A SIMPLE DAILY ROUTINE</span>
            <h2>Small steps.<br /><span>Clearer records.</span></h2>
            <p>
              Sweety makes it easy to build a consistent record of your
              glucose readings, one entry at a time.
            </p>
            <button className="primary-button" onClick={onRegister}>
              Create your account <span className="arrow-icon" aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="steps-list">
            <div className="step-item">
              <span className="step-number">01</span>
              <div><h3>Add a reading</h3><p>Enter your glucose value, date, and reading slot.</p></div>
              <span className="step-symbol">＋</span>
            </div>
            <div className="step-item">
              <span className="step-number">02</span>
              <div><h3>View your history</h3><p>Find your previous entries and update them when needed.</p></div>
              <span className="step-symbol">▤</span>
            </div>
            <div className="step-item">
              <span className="step-number">03</span>
              <div><h3>Explore your reports</h3><p>Review summaries and visual trends from your records.</p></div>
              <span className="step-symbol">↗</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-cta" id="about">
        <div className="cta-decoration cta-decoration-one" />
        <div className="cta-decoration cta-decoration-two" />
        <span className="eyebrow">MAKE TRACKING A LITTLE EASIER</span>
        <h2>Your health records,<br />all in one place.</h2>
        <p>Start building a simple, organized record of your daily readings.</p>
        <button className="cta-button" onClick={onRegister}>
          Get started with Sweety <span className="arrow-icon" aria-hidden="true">↗</span>
        </button>
        <span className="cta-note">Free to get started · Your personal tracking space</span>
      </section>

      <footer className="landing-footer">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div className="brand-copy">
            <strong>Sweety</strong>
            <span>GLUCOSE TRACKER</span>
          </div>
        </div>
        <span>© {new Date().getFullYear()} Sweety. Blood Glucose Tracker.</span>
        <span className="footer-note">Keep recording. Stay informed.</span>
      </footer>
    </main>
  );
}

export default LandingPage;
