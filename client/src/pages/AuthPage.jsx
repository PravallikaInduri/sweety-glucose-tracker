
function AuthPage({
  authMode,
  setAuthMode,
  authForm,
  handleAuthChange,
  handleAuthSubmit,
  authLoading,
  error,
  message,
  clearMessages,
  backToLanding,
  Brand,
  ArrowIcon,
}) {
  return (
    <main className="auth-page">
      <div className="auth-background-shape auth-shape-one" />
      <div className="auth-background-shape auth-shape-two" />

      <button
        type="button"
        className="back-home-button"
        onClick={backToLanding}
      >
        ← Back to home
      </button>

      <section className="auth-card">
        <Brand />

        <p className="eyebrow auth-eyebrow">
          YOUR PERSONAL HEALTH SPACE
        </p>

        <h1>
          {authMode === "register"
            ? "Create your account"
            : "Welcome back"}
        </h1>

        <p className="auth-subtitle">
          {authMode === "register"
            ? "Start keeping your readings organized."
            : "Log in to continue your health tracking."}
        </p>

        <div className="auth-tabs">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => {
              clearMessages();
              setAuthMode("login");
            }}
            type="button"
          >
            Log in
          </button>

          <button
            className={authMode === "register" ? "active" : ""}
            onClick={() => {
              clearMessages();
              setAuthMode("register");
            }}
            type="button"
          >
            Sign up
          </button>
        </div>

        {error && (
          <div className="alert error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="alert success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleAuthSubmit} className="form-stack">
          {authMode === "register" && (
            <label>
              Full name
              <input
                name="name"
                value={authForm.name}
                onChange={handleAuthChange}
                placeholder="Enter your full name"
                maxLength="100"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={handleAuthChange}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={handleAuthChange}
              placeholder="Enter your password"
              minLength="6"
              maxLength="72"
              required
            />
          </label>

          <button
            className="primary-button full-button"
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "register"
                ? "Create account"
                : "Log in to dashboard"}

            <ArrowIcon />
          </button>
        </form>

        <p className="auth-footer">
          Your readings are private and linked to your account.
        </p>
      </section>
    </main>
  );
}

export default AuthPage;
