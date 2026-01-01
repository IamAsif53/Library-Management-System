import { useEffect, useState } from "react";

export default function LibraryCardPending() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPendingCards();
  }, []);

  async function fetchPendingCards() {
    try {
      const res = await fetch(
        "${import.meta.env.VITE_API_BASE_URL}
/api/library-card/pending",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch pending library cards");
      }

      const data = await res.json();
      setCards(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveCard(cardId) {
    if (!window.confirm("Approve this library card?")) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}
/api/library-card/approve/${cardId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Approval failed");
      }

      // remove approved card from list
      setCards((prev) => prev.filter((c) => c._id !== cardId));
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-cyan-400">
        Loading pending library cards...
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 px-6 py-12">
      <h1 className="text-4xl font-extrabold text-center text-white mb-10">
        🧾 Library Card Pending List
      </h1>

      {cards.length === 0 ? (
        <p className="text-center text-indigo-200 text-lg">
          No pending library card applications 🎉
        </p>
      ) : (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((card) => (
            <div
              key={card._id}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
            >
              <h2 className="text-xl font-bold text-white mb-2">
                {card.name}
              </h2>

              <p className="text-sm text-gray-300">
                <span className="font-semibold">Email:</span>{" "}
                {card.user?.email}
              </p>

              <p className="text-sm text-gray-300">
                <span className="font-semibold">Reg No:</span>{" "}
                {card.user?.regNo || "—"}
              </p>

              <p className="text-sm text-gray-300">
                <span className="font-semibold">Department:</span>{" "}
                {card.department}
              </p>

              <p className="text-sm text-gray-300">
                <span className="font-semibold">Level:</span> {card.level}
              </p>

              <p className="text-sm text-gray-300">
                <span className="font-semibold">Term:</span> {card.term}
              </p>

              <p className="text-sm text-yellow-400 mt-2 font-semibold">
                Status: Pending
              </p>

              <button
                onClick={() => approveCard(card._id)}
                className="mt-4 w-full py-2 rounded-xl bg-emerald-400 text-black font-bold hover:bg-emerald-500 transition"
              >
                Approve Library Card
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
