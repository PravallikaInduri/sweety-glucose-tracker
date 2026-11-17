
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const PAGE_LIMIT = 20;

const SLOTS = [
  "Morning (fasting)",
  "After breakfast",
  "After lunch",
  "After dinner",
];

const SLOT_ORDER = {
  "Morning (fasting)": 1,
  "After breakfast": 2,
  "After lunch": 3,
  "After dinner": 4,
};

async function apiRequest(path, options = {}, token = "") {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }

  return data;
}

function todayString() {
  const today = new Date();

  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(date) {
  if (!date) return "—";

  const [year, month, day] = String(date)
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Brand({ light = false }) {
  return (
    <div className={`brand ${light ? "brand-light" : ""}`}>
      <div className="brand-mark">S</div>
      <div className="brand-copy">
        <strong>Sweety</strong>
        <span>GLUCOSE TRACKER</span>
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <span className="arrow-icon" aria-hidden="true">
      ↗
    </span>
  );
}

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("sweety_token") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sweety_user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [readings, setReadings] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReadings, setTotalReadings] = useState(0);

  const [report, setReport] = useState({
    count: 0,
    highest: null,
    lowest: null,
    average: null,
    readings: [],
  });

  const [period, setPeriod] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayString());

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const [readingForm, setReadingForm] = useState({
    reading_date: todayString(),
    slot: SLOTS[0],
    glucose_value: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    reading_date: "",
    slot: SLOTS[0],
    glucose_value: "",
  });

  const isLoggedIn = Boolean(token);

  const averageValue = useMemo(() => {
    const values = readings.map((item) => Number(item.glucose_value));

    if (!values.length) return "—";

    return (
      values.reduce((sum, value) => sum + value, 0) / values.length
    ).toFixed(1);
  }, [readings]);

  const chartData = useMemo(() => {
    return [...report.readings]
      .sort((a, b) => {
        const dateComparison = String(a.reading_date).localeCompare(
          String(b.reading_date)
        );

        if (dateComparison !== 0) return dateComparison;

        return (SLOT_ORDER[a.slot] || 0) - (SLOT_ORDER[b.slot] || 0);
      })
      .map((reading) => ({
        date: String(reading.reading_date).slice(0, 10),
        label: `${formatDate(reading.reading_date)} · ${reading.slot}`,
        slot: reading.slot,
        value: Number(reading.glucose_value),
      }));
  }, [report.readings]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function openLogin() {
    clearMessages();
    setAuthMode("login");
    setShowAuth(true);
  }

  function openRegister() {
    clearMessages();
    setAuthMode("register");
    setShowAuth(true);
  }

  function backToLanding() {
    clearMessages();
    setShowAuth(false);
  }

  function handleAuthChange(event) {
    setAuthForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    clearMessages();
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "/auth/register" : "/auth/login";

      const payload =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const data = await apiRequest(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (authMode === "register") {
        setMessage("Account created successfully. Please log in.");
        setAuthMode("login");
        setAuthForm({
          name: "",
          email: authForm.email,
          password: "",
        });
      } else {
        if (!data.token) {
          throw new Error(
            "Login response did not include an authentication token."
          );
        }

        const loggedInUser = data.user || null;

        localStorage.setItem("sweety_token", data.token);
        localStorage.setItem("sweety_user", JSON.stringify(loggedInUser));

        setToken(data.token);
        setUser(loggedInUser);
        setShowAuth(false);
        clearMessages();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("sweety_token");
    localStorage.removeItem("sweety_user");

    setToken("");
    setUser(null);
    setReadings([]);
    setCurrentPage(1);
    setTotalPages(1);
    setTotalReadings(0);

    setReport({
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      readings: [],
    });

    setEditingId(null);
    setEditError("");
    setShowAuth(false);
    setAuthMode("login");
    clearMessages();
  }

  async function loadReadings() {
    if (!token) return;

    try {
      const query =
        `/readings?date=${encodeURIComponent(selectedDate)}` +
        `&page=${currentPage}&limit=${PAGE_LIMIT}`;

      const data = await apiRequest(query, {}, token);

      setReadings(Array.isArray(data.readings) ? data.readings : []);
      setTotalPages(data.totalPages || 1);
      setTotalReadings(data.total || 0);
    } catch (err) {
      setError(err.message);

      if (
        err.message.toLowerCase().includes("token") ||
        err.message.toLowerCase().includes("authentication")
      ) {
        logout();
      }
    }
  }

  async function loadReport() {
    if (!token) return;

    try {
      const query =
        `/reports?period=${encodeURIComponent(period)}` +
        `&date=${encodeURIComponent(selectedDate)}`;

      const data = await apiRequest(query, {}, token);

      setReport({
        count: Number(data.count || 0),
        highest: data.highest ?? null,
        lowest: data.lowest ?? null,
        average: data.average ?? null,
        readings: Array.isArray(data.readings) ? data.readings : [],
      });
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshDashboard() {
    if (!token) return;

    setLoading(true);

    try {
      await Promise.all([loadReadings(), loadReport()]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  useEffect(() => {
    if (token) refreshDashboard();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDate, period, currentPage]);

  function handleReadingChange(event) {
    setReadingForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleReadingSubmit(event) {
    event.preventDefault();
    clearMessages();

    const valueString = String(readingForm.glucose_value);

    if (!/^\d+$/.test(valueString)) {
      setError("Please enter a whole-number glucose value.");
      return;
    }

    const value = Number(valueString);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setError("Value must be between 40 and 600 mg/dL.");
      return;
    }

    if (readingForm.reading_date > todayString()) {
      setError("Date cannot be in the future.");
      return;
    }

    try {
      await apiRequest(
        "/readings",
        {
          method: "POST",
          body: JSON.stringify({
            reading_date: readingForm.reading_date,
            slot: readingForm.slot,
            glucose_value: value,
          }),
        },
        token
      );

      setMessage("Reading added successfully.");

      const addedDate = readingForm.reading_date;

      setReadingForm({
        reading_date: addedDate,
        slot: SLOTS[0],
        glucose_value: "",
      });

      if (selectedDate === addedDate && period === "daily") {
        setCurrentPage(1);
        await refreshDashboard();
      } else {
        setCurrentPage(1);
        setSelectedDate(addedDate);
        setPeriod("daily");
      }
    } catch (err) {
      setError(err.message);
    }
  }

  function startEditing(reading) {
    clearMessages();
    setEditError("");
    setEditingId(reading.id);

    setEditForm({
      reading_date: String(reading.reading_date).slice(0, 10),
      slot: reading.slot,
      glucose_value: String(reading.glucose_value),
    });
  }

  function handleEditChange(event) {
    setEditForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  function cancelEditing() {
    if (savingEdit) return;

    setEditingId(null);
    setEditError("");

    setEditForm({
      reading_date: "",
      slot: SLOTS[0],
      glucose_value: "",
    });
  }

  async function handleEditSubmit(event) {
    event.preventDefault();
    setEditError("");

    const valueString = String(editForm.glucose_value);

    if (!/^\d+$/.test(valueString)) {
      setEditError("Please enter a whole-number glucose value.");
      return;
    }

    const value = Number(valueString);

    if (!Number.isInteger(value) || value < 40 || value > 600) {
      setEditError("Value must be between 40 and 600 mg/dL.");
      return;
    }

    if (!editForm.reading_date || editForm.reading_date > todayString()) {
      setEditError("Please select a valid date. Future dates are not allowed.");
      return;
    }

    if (!SLOTS.includes(editForm.slot)) {
      setEditError("Please select a valid reading slot.");
      return;
    }

    try {
      setSavingEdit(true);

      await apiRequest(
        `/readings/${editingId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            reading_date: editForm.reading_date,
            slot: editForm.slot,
            glucose_value: value,
          }),
        },
        token
      );

      const updatedDate = editForm.reading_date;

      setEditingId(null);
      setEditError("");
      setMessage("Reading updated successfully.");

      setEditForm({
        reading_date: "",
        slot: SLOTS[0],
        glucose_value: "",
      });

      if (selectedDate === updatedDate && period === "daily") {
        await refreshDashboard();
      } else {
        setCurrentPage(1);
        setSelectedDate(updatedDate);
        setPeriod("daily");
      }
    } catch (err) {
      setEditError(err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function deleteReading(id) {
    if (!window.confirm("Are you sure you want to delete this reading?")) {
      return;
    }

    clearMessages();

    try {
      await apiRequest(`/readings/${id}`, { method: "DELETE" }, token);

      setMessage("Reading deleted successfully.");
      await refreshDashboard();
    } catch (err) {
      setError(err.message);
    }
  }

  const displayReadings = period === "daily" ? readings : report.readings;
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || "there";

  if (!isLoggedIn && !showAuth) {
    return <LandingPage onLogin={openLogin} onRegister={openRegister} />;
  }

  if (!isLoggedIn && showAuth) {
    return (
      <AuthPage
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        handleAuthChange={handleAuthChange}
        handleAuthSubmit={handleAuthSubmit}
        authLoading={authLoading}
        error={error}
        message={message}
        clearMessages={clearMessages}
        backToLanding={backToLanding}
        Brand={Brand}
        ArrowIcon={ArrowIcon}
      />
    );
  }

  return (
    <Dashboard
      Brand={Brand}
      user={user}
      logout={logout}
      firstName={firstName}
      formatDate={formatDate}
      todayString={todayString}
      error={error}
      message={message}
      readings={readings}
      averageValue={averageValue}
      report={report}
      loading={loading}
      readingForm={readingForm}
      handleReadingSubmit={handleReadingSubmit}
      handleReadingChange={handleReadingChange}
      period={period}
      setCurrentPage={setCurrentPage}
      setPeriod={setPeriod}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      chartData={chartData}
      displayReadings={displayReadings}
      totalReadings={totalReadings}
      currentPage={currentPage}
      totalPages={totalPages}
      refreshDashboard={refreshDashboard}
      startEditing={startEditing}
      deleteReading={deleteReading}
      editingId={editingId}
      cancelEditing={cancelEditing}
      savingEdit={savingEdit}
      editError={editError}
      editForm={editForm}
      handleEditSubmit={handleEditSubmit}
      handleEditChange={handleEditChange}
      SLOTS={SLOTS}
    />
  );
}

export default App;
