
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function Dashboard({
  Brand,
  user,
  logout,
  firstName,
  formatDate,
  todayString,
  error,
  message,
  readings,
  averageValue,
  report,
  loading,
  readingForm,
  handleReadingSubmit,
  handleReadingChange,
  period,
  setCurrentPage,
  setPeriod,
  selectedDate,
  setSelectedDate,
  chartData,
  displayReadings,
  totalReadings,
  currentPage,
  totalPages,
  refreshDashboard,
  startEditing,
  deleteReading,
  editingId,
  cancelEditing,
  savingEdit,
  editError,
  editForm,
  handleEditSubmit,
  handleEditChange,
  SLOTS,
}) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <Brand />

        <div className="profile-area">
          <div className="avatar">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>

          <div className="profile-name">
            <strong>{user?.name || "Welcome"}</strong>
            <span>{user?.email || ""}</span>
          </div>

          <button className="logout-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <section className="welcome-section">
        <div>
          <p className="eyebrow">YOUR PERSONAL HEALTH SPACE</p>

          <h1>
            Hello, {firstName}! <span>Welcome back.</span>
          </h1>

          <p className="welcome-subtitle">
            Here's your health overview. Keep your daily readings organized
            and stay informed about your progress.
          </p>
        </div>

        <div className="date-chip">
          <span>◷</span> {formatDate(todayString())}
        </div>
      </section>

      {(error || message) && (
        <div className="dashboard-alerts">
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
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card stat-card-primary">
          <div className="stat-topline">
            <span>Selected date readings</span>
            <span className="stat-icon">⌁</span>
          </div>

          <strong>
            {readings.length}<small> / 4</small>
          </strong>

          <span className="stat-note">Daily slots recorded</span>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Selected date average</span>
            <span className="stat-icon">◉</span>
          </div>

          <strong>{averageValue}</strong>
          <span className="stat-note">mg/dL</span>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Highest in report</span>
            <span className="stat-icon stat-icon-orange">↗</span>
          </div>

          <strong>{report.highest ?? "—"}</strong>
          <span className="stat-note">mg/dL</span>
        </article>

        <article className="stat-card">
          <div className="stat-topline">
            <span>Lowest in report</span>
            <span className="stat-icon stat-icon-blue">↘</span>
          </div>

          <strong>{report.lowest ?? "—"}</strong>
          <span className="stat-note">mg/dL</span>
        </article>
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">DAILY LOG</p>
              <h2>Add a reading</h2>
              <p className="section-description">
                Record a new glucose reading.
              </p>
            </div>

            <span className="panel-icon">＋</span>
          </div>

          <form onSubmit={handleReadingSubmit} className="form-stack">
            <label>
              Reading date
              <input
                type="date"
                name="reading_date"
                value={readingForm.reading_date}
                max={todayString()}
                onChange={handleReadingChange}
                required
              />
            </label>

            <label>
              Reading slot
              <select
                name="slot"
                value={readingForm.slot}
                onChange={handleReadingChange}
              >
                {SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Blood glucose value (mg/dL)
              <input
                type="number"
                name="glucose_value"
                value={readingForm.glucose_value}
                onChange={handleReadingChange}
                placeholder="e.g. 110"
                min="40"
                max="600"
                step="1"
                required
              />
            </label>

            <p className="helper-text">
              Enter a whole number between 40–600 mg/dL. One reading per slot
              per day.
            </p>

            <button
              className="primary-button form-submit"
              disabled={loading}
            >
              {loading ? "Saving..." : "Add reading"} <span>→</span>
            </button>
          </form>
        </section>

        <section className="panel report-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR ACTIVITY</p>
              <h2>Reports</h2>
              <p className="section-description">
                Explore your recorded readings.
              </p>
            </div>

            <span className="panel-icon">▤</span>
          </div>

          <label>
            Report period
            <select
              value={period}
              onChange={(event) => {
                setCurrentPage(1);
                setPeriod(event.target.value);
              }}
            >
              <option value="daily">Daily</option>
              <option value="month-to-date">Month-to-date</option>
              <option value="previous-month">
                Monthly (previous month)
              </option>
            </select>
          </label>

          <label>
            Select reference date
            <input
              type="date"
              value={selectedDate}
              max={todayString()}
              onChange={(event) => setSelectedDate(event.target.value)}
            />
          </label>

          <div className="report-summary">
            <div>
              <span>Readings</span>
              <strong>{report.count}</strong>
            </div>

            <div>
              <span>Average</span>
              <strong>{report.average ?? "—"}</strong>
            </div>

            <div>
              <span>Highest</span>
              <strong>{report.highest ?? "—"}</strong>
            </div>

            <div>
              <span>Lowest</span>
              <strong>{report.lowest ?? "—"}</strong>
            </div>
          </div>

          <p className="helper-text report-disclaimer">
            Values are shown in mg/dL. Sweety is a tracking tool and does not
            provide a medical diagnosis.
          </p>
        </section>
      </div>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">YOUR PATTERNS</p>
            <h2>Glucose trend</h2>
            <p className="section-description">
              A visual view of your readings for the selected report period.
            </p>
          </div>

          <span className="panel-icon">⌁</span>
        </div>

        {chartData.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌁</div>
            <h3>No chart data available</h3>
            <p>
              Add readings for this report period to see your glucose trend.
            </p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={310}>
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 22, left: 5, bottom: 65 }}
              >
                <CartesianGrid
                  strokeDasharray="4 5"
                  stroke="#edf1ed"
                />

                <XAxis
                  dataKey="label"
                  angle={-32}
                  textAnchor="end"
                  interval="preserveStartEnd"
                  height={82}
                  tick={{ fontSize: 11, fill: "#78857c" }}
                  axisLine={{ stroke: "#e6ece7" }}
                  tickLine={false}
                />

                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 12, fill: "#78857c" }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "mg/dL",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#78857c",
                  }}
                />

                <Tooltip
                  labelFormatter={(label) => label}
                  formatter={(value) => [`${value} mg/dL`, "Glucose"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e7eee8",
                    boxShadow: "0 10px 30px rgba(30, 60, 40, .08)",
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="value"
                  name="Glucose"
                  stroke="#28764f"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#28764f",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 7,
                    fill: "#28764f",
                    stroke: "#fff",
                    strokeWidth: 3,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="panel readings-panel">
        <div className="panel-heading readings-heading">
          <div>
            <p className="eyebrow">YOUR RECORDS</p>

            <h2>
              {period === "daily"
                ? "Daily readings"
                : period === "month-to-date"
                  ? "Month-to-date readings"
                  : "Previous month readings"}
            </h2>

            <p className="section-description">
              {period === "daily"
                ? `Entries for ${formatDate(selectedDate)}`
                : period === "month-to-date"
                  ? `From the first day of the month through ${formatDate(selectedDate)}`
                  : `Previous calendar month relative to ${formatDate(selectedDate)}`}
            </p>
          </div>

          <button
            className="secondary-button refresh-button"
            onClick={refreshDashboard}
            disabled={loading}
          >
            {loading ? "Loading..." : "↻ Refresh"}
          </button>
        </div>

        {displayReadings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <h3>No readings yet</h3>
            <p>
              No readings found for this report period. Add a glucose reading
              to see your history and report statistics.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time slot</th>
                  <th>Glucose value</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {displayReadings.map((reading) => (
                  <tr key={reading.id}>
                    <td>{formatDate(reading.reading_date)}</td>

                    <td>
                      <span className="slot-pill">{reading.slot}</span>
                    </td>

                    <td>
                      <strong className="reading-value">
                        {reading.glucose_value} <small>mg/dL</small>
                      </strong>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="edit-button"
                          onClick={() => startEditing(reading)}
                          type="button"
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => deleteReading(reading.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {period === "daily" && totalReadings > 0 && (
          <div className="pagination">
            <p>
              Showing {readings.length} of {totalReadings} readings
            </p>

            <div className="pagination-buttons">
              <button
                className="secondary-button"
                type="button"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((page) => page - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                className="secondary-button"
                type="button"
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((page) => page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {editingId !== null && (
        <div className="modal-overlay" onClick={cancelEditing}>
          <section
            className="edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">UPDATE ENTRY</p>
                <h2 id="edit-modal-title">Edit reading</h2>
                <p className="section-description">
                  Update your date, slot, or glucose value.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={cancelEditing}
                aria-label="Close"
                disabled={savingEdit}
              >
                ×
              </button>
            </div>

            {editError && (
              <div className="alert error" role="alert">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="form-stack">
              <label>
                Reading date
                <input
                  type="date"
                  name="reading_date"
                  value={editForm.reading_date}
                  max={todayString()}
                  onChange={handleEditChange}
                  required
                />
              </label>

              <label>
                Reading slot
                <select
                  name="slot"
                  value={editForm.slot}
                  onChange={handleEditChange}
                  required
                >
                  {SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Blood glucose value (mg/dL)
                <input
                  type="number"
                  name="glucose_value"
                  value={editForm.glucose_value}
                  onChange={handleEditChange}
                  min="40"
                  max="600"
                  step="1"
                  required
                />
              </label>

              <p className="helper-text">
                Allowed range: 40–600 mg/dL. Future dates are not allowed.
              </p>

              <div className="modal-actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={cancelEditing}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <footer className="app-footer">
        <Brand />
        <span>Keep recording. Stay informed.</span>
      </footer>
    </main>
  );
}

export default Dashboard;
