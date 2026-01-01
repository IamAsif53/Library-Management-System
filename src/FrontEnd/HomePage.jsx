// src/FrontEnd/HomePage.jsx
import React, { useEffect, useState } from "react";
import Login from "./Login";
import Signup from "./Signup";

/**
 * HomePage - shows login OR welcome (no logout button in welcome UI).
 * Listens for "authChange" and "storage" events to re-check login state.
 */

export default function HomePage() {
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  //  USER DASHBOARD STATES
  const [borrowHistory, setBorrowHistory] = useState([]);
  const [cardStatus, setCardStatus] = useState("none"); // none | pending | approved
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // fetch /me and set user if token valid
  async function fetchMe() {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      localStorage.removeItem("user"); // 🔥 keep storage clean
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/users/me`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);


      if (res.status === 401) {
        // invalid / expired token
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("authChange"));
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const u = data?.user || data;

      // 🔥 CRITICAL FIX: sync backend user → localStorage
      if (u) {
        localStorage.setItem("user", JSON.stringify(u));
      }

      setUser(u || null);
    } catch (err) {
      console.error("Failed to fetch /me:", err);
      setError("Unable to verify login (network error).");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBorrowHistory() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];

     const res = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/borrows/my`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);

      if (!res.ok) return [];

      const data = await res.json();
      setBorrowHistory(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch borrow history:", err);
      return [];
    }
  }

  async function fetchLibraryCardStatus() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

     const res = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/api/library-card/my`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }
);


      if (!res.ok) return;

      const data = await res.json();
      setCardStatus(data.cardStatus || "none");
    } catch (err) {
      console.error("Failed to fetch library card status:", err);
    }
  }

  // initial fetch + subscribe to auth change events
  useEffect(() => {
    let mounted = true;
    fetchMe();

    function onAuthChange() {
      if (!mounted) return;
      fetchMe();
    }
    function onStorage(e) {
      if (e.key === "token") {
        if (!mounted) return;
        fetchMe();
      }
    }

    window.addEventListener("authChange", onAuthChange);
    window.addEventListener("storage", onStorage);

    return () => {
      mounted = false;
      window.removeEventListener("authChange", onAuthChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [showSignup]); // re-check when signup modal closes

  // ============================
  // 📊 USER DASHBOARD DATA LOADER
  // ============================
  useEffect(() => {
    if (!user) return;

    async function loadDashboardData() {
      setDashboardLoading(true);

      await Promise.all([fetchBorrowHistory(), fetchLibraryCardStatus()]);

      setDashboardLoading(false);
    }

    loadDashboardData();
  }, [user]);

  // ============================
  // 📊 USER DASHBOARD METRICS
  // ============================

  // Active borrowed books (not returned)
  const activeBorrows = borrowHistory.filter((b) => !b.returnedAt);

  // Overdue books
  const overdueBorrows = activeBorrows.filter(
    (b) => b.dueAt && new Date(b.dueAt) < new Date()
  );

  // Total fine (10 TK per overdue book)
  const totalFine = overdueBorrows.length * 10;

  // Next due date (earliest dueAt)
  let nextDueDate = null;
  if (activeBorrows.length > 0) {
    const sortedByDue = activeBorrows
      .filter((b) => b.dueAt)
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    if (sortedByDue.length > 0) {
      nextDueDate = sortedByDue[0].dueAt;
    }
  }

  // Borrowing access status
  const canBorrow = cardStatus === "approved" && totalFine === 0;

  // loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-600">Checking login…</div>
      </div>
    );
  }

  // not logged in -> show login + signup
  if (!user) {
    return (
      <div
        className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col pt-16"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop')",
        }}
      >
        <div className="flex flex-col items-center justify-start flex-1 px-4">
          <div className="w-full max-w-3xl text-center mt-1 mb-8 px-6 py-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-green-100 tracking-wide">
              WELCOME TO CUET LIBRARY
            </h1>
            <p className="mt-3 text-base md:text-lg text-[#F2E8C9]">
              Please log in to continue. If you don't have an account, click
              Signup.
            </p>
          </div>

          {!showSignup && (
            <div className="w-full max-w-md">
              <Login
                setShowSignup={setShowSignup}
                onLogin={(u) => {
                  setUser(u || null);
                }}
              />
            </div>
          )}
        </div>

        {showSignup && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md">
              <Signup setShowSignup={setShowSignup} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // logged-in welcome screen
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center bg-no-repeat flex flex-col pt-20"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop')",
      }}
    >
      <main className="flex-1 px-4 py-16">
        {/* ============================
        🌫️ MAIN GLASS CONTAINER
    ============================ */}
        <div className="max-w-7xl mx-auto rounded-[2.5rem] bg-black/45 backdrop-blur-2xl border border-white/20 shadow-2xl p-10 text-white">
          {/* ============================
          👤 USER PROFILE SECTION
      ============================ */}
          <h1 className="text-4xl font-extrabold mb-3">
            Welcome back,
            <span className="ml-2 bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
              {user.name || "User"}
            </span>
            <span className="text-indigo-300">!</span>
          </h1>

          <p className="text-lg text-gray-300 mb-8 flex items-center gap-3 flex-wrap">
            <span>
              Logged in as{" "}
              <strong className="text-gray-100">{user.email}</strong>
            </span>

            {user.role === "admin" && (
              <span className="px-3 py-1 text-xs tracking-wider bg-gradient-to-r from-yellow-400 to-amber-400 text-black rounded-full font-bold">
                ADMIN
              </span>
            )}
          </p>

          {/* Info boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="rounded-xl p-4 bg-white/10 border border-white/20 max-w-sm">
              <div className="text-xs uppercase tracking-widest text-gray-300 mb-1">
                Registration No
              </div>
              <div className="text-xl font-bold text-white">
                {user.regNo || "—"}
              </div>
            </div>

            <div className="rounded-xl p-4 bg-white/10 border border-white/20 max-w-sm">
              <div className="text-xs uppercase tracking-widest text-gray-300 mb-1">
                Department
              </div>
              <div className="text-xl font-bold text-white">
                {user.department || "—"}
              </div>
            </div>
          </div>

         


            {user?.role !== "admin" && (
            <>
          {/* ============================
    📜 LIBRARY RULES
============================ */}
          <div className="mt-12 max-w-4xl mx-auto mb-10">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <h2 className="text-2xl font-extrabold text-white mb-6 flex items-center gap-2">
                📜 Library Rules
              </h2>

              <ul className="space-y-4 text-gray-200 text-sm leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <span>
                    You must{" "}
                    <strong className="text-white">
                      create and get approval for your library card
                    </strong>{" "}
                    before borrowing any books.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <span>
                    A user can borrow{" "}
                    <strong className="text-white">
                      at most 4 books at a time
                    </strong>
                    .
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-bold">✔</span>
                  <span>
                    Borrowed books must be returned within{" "}
                    <strong className="text-white">30 days (1 month)</strong>.
                  </span>
                </li>

                <li className="flex items-start gap-3">
                  <span className="text-red-400 font-bold">⚠</span>
                  <span>
                    If books are not returned on time, a fine of
                    <strong className="text-white"> 10 TK per book</strong> will
                    be charged for overdue.
                  </span>
                </li>
              </ul>
            </div>
          </div>
          </>
          )}

          {user?.role !== "admin" && (
            <>
              {/* ============================
          📊 DASHBOARD SECTION
      ============================ */}
              <h2 className="text-center text-4xl font-extrabold mb-12">
                <span className="bg-gradient-to-r from-gray-200 via-gray-100 to-gray-300 bg-clip-text text-transparent drop-shadow">
                  ■ Your Library Dashboard
                </span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <DashboardCard
                  title="Borrowed Books"
                  value={activeBorrows.length}
                  subtitle="Currently borrowed"
                  color="indigo"
                />

                <DashboardCard
                  title="Overdue Books"
                  value={overdueBorrows.length}
                  subtitle="Need immediate return"
                  color="red"
                />

                <DashboardCard
                  title="Total Fine"
                  value={`${totalFine} TK`}
                  subtitle="Overdue penalty"
                  color="amber"
                />

                <DashboardCard
                  title="Library Card"
                  value={
                    cardStatus === "approved"
                      ? "Approved"
                      : cardStatus === "pending"
                        ? "Pending"
                        : "Not Applied"
                  }
                  subtitle="Card status"
                  color={
                    cardStatus === "approved"
                      ? "green"
                      : cardStatus === "pending"
                        ? "yellow"
                        : "gray"
                  }
                />

                <DashboardCard
                  title="Next Due Date"
                  value={
                    nextDueDate
                      ? new Date(nextDueDate).toLocaleDateString()
                      : "N/A"
                  }
                  subtitle="Closest deadline"
                  color="cyan"
                />

                <DashboardCard
                  title="Borrow Access"
                  value={canBorrow ? "Allowed" : "Blocked"}
                  subtitle={
                    canBorrow
                      ? "You can borrow books"
                      : "Resolve fine / card issue"
                  }
                  color={canBorrow ? "green" : "red"}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ title, value, subtitle, color }) {
  const accents = {
    indigo: "from-indigo-400/30 to-indigo-600/30",
    red: "from-red-400/30 to-red-600/30",
    amber: "from-amber-400/30 to-amber-600/30",
    green: "from-emerald-400/30 to-emerald-600/30",
    yellow: "from-yellow-400/30 to-yellow-600/30",
    gray: "from-gray-400/30 to-gray-600/30",
    cyan: "from-cyan-400/30 to-cyan-600/30",
  };

  return (
    <div className="relative rounded-2xl p-[1px] bg-gradient-to-br shadow-lg">
      {/* Accent border */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
          accents[color] || accents.gray
        }`}
      />

      {/* Card content */}
      <div className="relative h-full rounded-2xl bg-black/40 backdrop-blur-xl p-6">
        <p className="text-xs uppercase tracking-widest text-gray-300 mb-2">
          {title}
        </p>

        <p className="text-3xl font-extrabold text-white mb-1">{value}</p>

        <p className="text-sm text-gray-300">{subtitle}</p>
      </div>
    </div>
  );
}
