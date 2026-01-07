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
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error("Failed to fetch book history");

      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // 💳 PAY FINE HANDLER
  // ============================
  async function handlePayFine(borrowId) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/pay-fine/${borrowId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // ✅ update UI instantly
      setHistory((prev) =>
        prev.map((item) =>
          item._id === borrowId
            ? { ...item, finePaid: true, fineAmount: 0 }
            : item
        )
      );
    } catch (err) {
      alert(err.message);
    }
  }

  // ============================
  // ✅ RETURN BOOK HANDLER
  // ============================
  async function handleReturn(borrowId) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/return/${borrowId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Return failed");

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

  // ============================
  // 🔁 REQUEST RETURN (NEW)
  // ============================
  async function handleReturnRequest(borrowId) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/request-return/${borrowId}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setHistory((prev) =>
        prev.map((item) =>
          item._id === borrowId
            ? {
                ...item,
                status: "return_requested",
                returnToken: data.returnToken,
              }
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
  // 💰 FINE SUMMARY
  // ============================
  const unpaidOverdues = history.filter(
    (item) => item.fineAmount > 0 && !item.finePaid
  );

  const totalFine = unpaidOverdues.length * 10;

  function getStatusLabel(item) {
    switch (item.status) {
      case "borrow_requested":
        return {
          text: "Pending Approval",
          color: "text-yellow-400",
        };

      case "borrow_approved":
        return {
          text: "Borrowed",
          color: "text-emerald-400",
        };

      case "return_requested":
        return {
          text: "Return Pending",
          color: "text-orange-400",
        };

      case "returned":
        return {
          text: "Returned",
          color: "text-green-400",
        };

      default:
        return {
          text: "Unknown",
          color: "text-gray-400",
        };
    }
  }

  const hasUnpaidFine = item.fineAmount > 0 && !item.finePaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-5xl font-extrabold text-center mb-6 bg-gradient-to-r from-cyan-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
          📚 Your Book History
        </h2>

        {totalFine > 0 && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-center">
            <p className="text-lg font-bold text-red-300">
              ⚠️ Overdue Books: {unpaidOverdues.length}
            </p>
            <p className="text-xl font-extrabold text-red-400 mt-1">
              Total Fine: {totalFine} TK
            </p>
            <p className="text-xs text-red-200 mt-1">
              (10 TK per overdue book)
            </p>
          </div>
        )}

        {history.length === 0 ? (
          <p className="text-center text-indigo-200 text-lg italic">
            You haven’t borrowed any books yet.
          </p>
        ) : (
          <div className="space-y-6">
            {history.map((item) => {
              const hasUnpaidFine = item.fineAmount > 0 && !item.finePaid;

              return (
                <div
                  key={item._id}
                  className={`bg-slate-900/80 border rounded-2xl p-6 shadow-lg ${
                    hasUnpaidFine ? "border-red-500/60" : "border-indigo-500/30"
                  }`}
                >
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {item.book.title}
                  </h3>

                  <p className="text-indigo-300">Author: {item.book.author}</p>

                  <p className="text-indigo-300 text-sm">
                    ISBN: {item.book.isbn}
                  </p>

                  {/* Dates */}
                  {item.borrowedAt && (
                    <p className="mt-3 text-sm text-gray-400">
                      Borrowed on:{" "}
                      {new Date(item.borrowedAt).toLocaleDateString()}
                    </p>
                  )}

                  {item.dueAt && (
                    <p className="text-sm text-gray-300">
                      Due on: {new Date(item.dueAt).toLocaleDateString()}
                    </p>
                  )}

                  {/* STATUS */}
                  {(() => {
                    const status = getStatusLabel(item);
                    return (
                      <p className={`mt-2 font-bold ${status.color}`}>
                        Status: {status.text}
                      </p>
                    );
                  })()}

                  {/* OVERDUE + FINE */}
                  {hasUnpaidFine && (
                    <p className="mt-2 text-sm font-bold text-red-400">
                      ⚠️ Overdue — Fine: {item.fineAmount} TK
                    </p>
                  )}

                  {/* TOKENS */}
                  {item.status === "borrow_requested" && (
                    <p className="mt-1 text-sm text-yellow-300">
                      Borrow Token: <strong>{item.borrowToken}</strong>
                    </p>
                  )}

                  {item.status === "return_requested" && (
                    <p className="mt-1 text-sm text-orange-300">
                      Return Token: <strong>{item.returnToken}</strong>
                    </p>
                  )}

                  {/* ACTIONS */}
                  {hasUnpaidFine && (
                    <button
                      onClick={() => handlePayFine(item._id)}
                      className="mt-4 px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600"
                    >
                      Pay Fine (10 TK)
                    </button>
                  )}

                  {item.status === "borrow_approved" && !hasUnpaidFine && (
                    <button
                      onClick={() => handleReturnRequest(item._id)}
                      className="mt-4 px-4 py-2 rounded-lg bg-amber-400 text-black font-bold hover:bg-amber-500"
                    >
                      Request Return
                    </button>
                  )}

                  {item.status === "borrow_requested" && (
                    <p className="mt-4 text-sm text-yellow-300 italic">
                      Waiting for admin approval
                    </p>
                  )}

                  {item.status === "return_requested" && (
                    <p className="mt-4 text-sm text-orange-300 italic">
                      Waiting for return confirmation
                    </p>
                  )}

                  {item.status === "returned" && (
                    <p className="mt-4 text-sm text-green-400 font-semibold">
                      ✅ Returned successfully
                    </p>
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
