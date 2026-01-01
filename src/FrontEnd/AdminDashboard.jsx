import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [borrowedBooks, setBorrowedBooks] = useState([]);

  // 🔍 search state
  const [searchQuery, setSearchQuery] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
    fetchBorrowedBooks();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch("http://localhost:5000/api/books/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      setStats(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBorrowedBooks() {
    try {
      const res = await fetch("http://localhost:5000/api/borrows", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      setBorrowedBooks(await res.json());
    } catch (err) {
      console.error("Failed to fetch borrowed books:", err);
    }
  }

  // ============================
  // 🔍 FILTER LOGIC
  // ============================
  const filteredBorrowedBooks = borrowedBooks.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.book?.title?.toLowerCase().includes(q) ||
      item.user?.email?.toLowerCase().includes(q) ||
      item.user?.regNo?.toLowerCase().includes(q)
    );
  });

  // ============================
  // ✨ TEXT HIGHLIGHT FUNCTION
  // ============================
  function highlight(text) {
    if (!searchQuery) return text;
    const regex = new RegExp(`(${searchQuery})`, "gi");
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? (
        <span
          key={i}
          className="bg-yellow-300 text-black px-1 rounded"
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-cyan-400">
        Loading admin dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 p-10">
      {/* HEADER */}
      <h1 className="text-4xl font-extrabold text-white mb-10 text-center">
        📊 Admin Dashboard
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto mb-16">
        <StatCard label="Total Books" value={stats.totalBooks} />
        <StatCard label="Total Users" value={stats.totalUsers} />
        <StatCard label="Total Borrows" value={stats.totalBorrows} />
        <StatCard label="Overdue Borrows" value={stats.overdueBorrows} />
        <StatCard label="Total Fine (TK)" value={stats.totalFine} highlight />
      </div>

      {/* ============================
          BORROWED BOOKS LIST
      ============================ */}
      <div className="max-w-6xl mx-auto">
        {/* CENTERED HEADING */}
        <h2 className="text-2xl font-extrabold text-white mb-6 text-center flex justify-center items-center gap-2">
          📚 Borrowed Books List
        </h2>

        {/* CENTERED SEARCH */}
        <div className="flex justify-center mb-6">
          <input
            type="text"
            placeholder="🔍 Search by book name or student ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-lg px-4 py-2 rounded-xl bg-white/90 border border-white/40 shadow-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="space-y-4">
          {filteredBorrowedBooks.length === 0 ? (
            <p className="text-gray-300 text-center">
              {searchQuery
                ? "No matching borrowed books found."
                : "No books have been borrowed yet."}
            </p>
          ) : (
            filteredBorrowedBooks.map((item) => {
              const isMatch = searchQuery !== "";

              return (
                <div
                  key={item._id}
                  className={`p-4 rounded-xl bg-white/95 shadow-md border transition ${
                    isMatch
                      ? "border-indigo-400 shadow-indigo-400/40"
                      : "border-white/40"
                  }`}
                >
                  <p className="text-base font-semibold text-gray-900">
                    {highlight(item.book?.title || "Unknown Book")}
                  </p>

                  <p className="text-xs text-gray-600">
                    Borrowed by:{" "}
                    {highlight(item.user?.email || "Unknown User")}
                  </p>

                  <p className="text-xs text-gray-500">
                    Borrowed on:{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>

                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${
                      item.returnedAt
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    Status: {item.returnedAt ? "Returned" : "Borrowed"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// 📦 STAT CARD COMPONENT
// ============================
function StatCard({ label, value, highlight }) {
  return (
    <div
      className={`p-6 rounded-2xl shadow-lg text-center border ${
        highlight
          ? "bg-red-500/20 border-red-400/40 text-red-300"
          : "bg-white/10 border-white/20 text-white"
      }`}
    >
      <p className="text-sm uppercase tracking-wide mb-2">{label}</p>
      <p className="text-4xl font-extrabold">{value}</p>
    </div>
  );
}
