import { useEffect, useState } from "react";

export default function BookHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const res = await fetch("http://localhost:5000/api/borrows/my", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch book history");
      }

      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // ✅ RETURN BOOK HANDLER
  // ============================
  async function handleReturn(borrowId) {
    try {
      const res = await fetch(
        `http://localhost:5000/api/borrows/return/${borrowId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Return failed");
      }

      // ✅ Update UI instantly
      setHistory((prev) =>
        prev.map((item) =>
          item._id === borrowId
            ? { ...item, returnedAt: new Date().toISOString() }
            : item
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <p className="text-xl font-bold text-cyan-400 animate-pulse">
          📚 Loading your book history...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900">
        <p className="text-red-400 font-semibold bg-black/40 px-6 py-3 rounded-xl">
          {error}
        </p>
      </div>
    );
  }

  // ============================
  // 💰 FINE CALCULATION
  // ============================
  const overdueCount = history.filter(
    (item) =>
      !item.returnedAt &&
      item.dueAt &&
      new Date(item.dueAt) < new Date()
  ).length;

  const totalFine = overdueCount * 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <h2 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          📚 Your Book History
        </h2>

        {/* 💰 FINE SUMMARY */}
        {totalFine > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-center">
            <p className="text-lg font-bold text-red-300">
              ⚠️ Overdue Books: {overdueCount}
            </p>
            <p className="text-xl font-extrabold text-red-400 mt-1">
              Total Fine: {totalFine} TK
            </p>
            <p className="text-xs text-red-200 mt-1">
              (10 TK per overdue book)
            </p>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 ? (
          <p className="text-center text-indigo-200 text-lg italic">
            You haven’t borrowed any books yet.
          </p>
        ) : (
          <div className="space-y-6">
            {history.map((item) => {
              // ============================
              // ✅ OVERDUE LOGIC
              // ============================
              const isOverdue =
                !item.returnedAt &&
                item.dueAt &&
                new Date(item.dueAt) < new Date();

              return (
                <div
                  key={item._id}
                  className={`relative bg-slate-900/80 border rounded-2xl p-6 shadow-lg hover:shadow-2xl transition ${
                    isOverdue
                      ? "border-red-500/60"
                      : "border-indigo-500/30"
                  }`}
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {item.book.title}
                  </h3>

                  <p className="text-indigo-300">
                    <span className="font-semibold">Author:</span>{" "}
                    {item.book.author}
                  </p>

                  <p className="text-indigo-300 text-sm">
                    <span className="font-semibold">ISBN:</span>{" "}
                    {item.book.isbn}
                  </p>

                  <p className="mt-3 text-sm text-gray-400">
                    Borrowed on:{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>

                  {/* ✅ DUE DATE */}
                  {item.dueAt && (
                    <p className="text-sm text-gray-300">
                      Due on:{" "}
                      {new Date(item.dueAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* ⚠️ OVERDUE WARNING */}
                  {isOverdue && (
                    <p className="mt-2 text-sm font-bold text-red-400">
                      ⚠️ Overdue
                    </p>
                  )}

                  {/* ============================
                      RETURN STATUS / BUTTON
                     ============================ */}
                  {item.returnedAt ? (
                    <p className="mt-3 text-sm text-green-400 font-semibold">
                      ✅ Returned on{" "}
                      {new Date(item.returnedAt).toLocaleDateString()}
                    </p>
                  ) : (
                    <button
                      onClick={() => handleReturn(item._id)}
                      className="mt-4 px-4 py-2 rounded-lg bg-emerald-400 text-black font-bold hover:bg-emerald-500"
                    >
                      Return Book
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
