import { useEffect, useState } from "react";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [hasFine, setHasFine] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [message, setMessage] = useState("");

  // Borrow
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Admin
  const [showAddBook, setShowAddBook] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteBookId, setDeleteBookId] = useState(null);

  //libraryCard
  const [hasApprovedCard, setHasApprovedCard] = useState(false);
  //borrowLimit4
  const [activeBorrowCount, setActiveBorrowCount] = useState(0);

  const emptyBook = {
    title: "",
    author: "",
    isbn: "",
    category: "",
    quantity: 1,
    available: 1,
  };

  const [newBook, setNewBook] = useState(emptyBook);

  const token = localStorage.getItem("token");

  // User
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    function syncUser() {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    }
    window.addEventListener("authChange", syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener("authChange", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  useEffect(() => {
    fetchBooks();
    checkUserFine();
    checkLibraryCardStatus();
    fetchActiveBorrowsCount();
  }, []);

  async function fetchBooks() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/books`);

      if (!res.ok) throw new Error("Failed to fetch books");
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ============================
  // 💰 CHECK IF USER HAS FINE
  // ============================
  async function checkUserFine() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/my`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) return;

      const data = await res.json();

      const hasOverdue = data.some(
        (item) =>
          !item.returnedAt && item.dueAt && new Date(item.dueAt) < new Date()
      );

      setHasFine(hasOverdue);
    } catch (err) {
      console.error("Failed to check fine:", err);
    }
  }

  // ============================
  // 📚 UNIQUE CATEGORIES
  // ============================
  const categories = [
    "all",
    ...new Set(
      books.map((b) => b.category).filter((c) => c && c.trim() !== "")
    ),
  ];

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || b.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // ============================
  // BORROW
  // ============================
  async function handleBorrow(book) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/${book._id}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      // update UI
      setBooks((prev) =>
        prev.map((b) =>
          b._id === book._id ? { ...b, available: b.available - 1 } : b
        )
      );
        // ✅ IMMEDIATE UI UPDATE
    setActiveBorrowCount((prev) => prev + 1);

      setMessage("✅ You have borrowed the book successfully");
    } catch (err) {
      setMessage(err.message || "❌ Borrow failed");
    } finally {
      setShowConfirm(false);
      setSelectedBook(null);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleAddBook() {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/books`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newBook),
        }
      );

      if (!res.ok) {
        let message = "Add book failed";
        try {
          const errData = await res.json();
          message = errData.message || message;
        } catch {
          // backend didn't return JSON
        }
        throw new Error(message);
      }

      const data = await res.json();

      setBooks((prev) => [...prev, data]);
      setShowAddBook(false);
      setNewBook({
        title: "",
        author: "",
        isbn: "",
        category: "",
        quantity: 1,
        available: 1,
      });
    } catch (err) {
      alert(err.message);
    }
  }

  // ============================
  // ADMIN: DELETE BOOK
  // ============================
  async function handleDeleteBook() {
    try {
      await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/books/${deleteBookId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBooks((prev) => prev.filter((b) => b._id !== deleteBookId));
    } catch {
      alert("Delete failed");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteBookId(null);
    }
  }
  //Library Card Status
  async function checkLibraryCardStatus() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/library-card/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      setHasApprovedCard(data.cardStatus === "approved");
    } catch {
      setHasApprovedCard(false);
    }
  }

  //borrow limit 4

  async function fetchActiveBorrowsCount() {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/borrows/my/count`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) return;

      const data = await res.json();
      setActiveBorrowCount(data.count);
    } catch (err) {
      console.error("Failed to fetch active borrow count", err);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* SEARCH + CATEGORY FILTER */}
        <div className="mb-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:max-w-md rounded-full bg-slate-800 px-6 py-3 text-white"
          />

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-60 rounded-full bg-slate-800 px-4 py-3 text-white"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "all" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>

        {/* 📊 BORROW LIMIT INDICATOR (USER ONLY) */}
        {!isAdmin && (
          <div className="mb-8 flex justify-center">
            <div
              className={`px-6 py-3 rounded-full font-bold border ${
                activeBorrowCount >= 4
                  ? "bg-red-500/20 border-red-400/40 text-red-300"
                  : "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
              }`}
            >
              📚 {activeBorrowCount} / 4 books borrowed
            </div>
          </div>
        )}

        {/* ADMIN ADD */}
        {isAdmin && (
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => setShowAddBook(true)}
              className="bg-gradient-to-r from-emerald-400 to-cyan-500 text-black px-8 py-3 rounded-full font-bold"
            >
              ➕ Add Book
            </button>
          </div>
        )}

        {/* ⚠️ FINE WARNING */}
        {hasFine && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/20 border border-red-400/40 text-center">
            <p className="text-lg font-bold text-red-300">
              ⚠️ You have overdue books
            </p>
            <p className="text-sm text-red-200 mt-1">
              Please return overdue books and clear fines to borrow new books.
            </p>
          </div>
        )}

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredBooks.map((book) => (
            <div
              key={book._id}
              className="relative bg-slate-900 p-6 rounded-3xl shadow-xl"
            >
              {isAdmin && (
                <button
                  onClick={() => {
                    setDeleteBookId(book._id);
                    setShowDeleteConfirm(true);
                  }}
                  className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1 rounded-full text-xs"
                >
                  Delete
                </button>
              )}

              <h3 className="text-xl font-bold text-white">{book.title}</h3>
              <p className="text-indigo-300 mb-3">{book.author}</p>

              <span
                className={`inline-block mb-4 px-3 py-1 rounded-full text-xs font-bold ${
                  book.available > 0
                    ? "bg-emerald-400/20 text-emerald-300"
                    : "bg-rose-400/20 text-rose-300"
                }`}
              >
                {book.available > 0
                  ? `${book.available} Available`
                  : "Not Available"}
              </span>

              {!isAdmin && (
                <button
                  disabled={
                    book.available === 0 ||
                    hasFine ||
                    !hasApprovedCard ||
                    activeBorrowCount >= 4
                  }
                  onClick={() => {
                    if (hasFine || activeBorrowCount >= 4) return;
                    setSelectedBook(book);
                    setShowConfirm(true);
                  }}
                  className={`w-full py-2 rounded-lg font-bold ${
                    book.available === 0 || hasFine || activeBorrowCount >= 4
                      ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                      : "bg-cyan-500 text-black"
                  }`}
                >
                  {!hasApprovedCard
                    ? "Library Card Required"
                    : hasFine
                      ? "Clear Fine to Borrow"
                      : activeBorrowCount >= 4
                        ? "Borrow Limit Reached"
                        : "Borrow"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ADD BOOK MODAL */}
      {showAddBook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-[360px] space-y-3">
            <h3 className="text-xl font-bold text-white">Add New Book</h3>

            {["title", "author", "isbn", "category"].map((f) => (
              <input
                key={f}
                placeholder={f}
                value={newBook[f]}
                onChange={(e) =>
                  setNewBook({ ...newBook, [f]: e.target.value })
                }
                className="w-full px-4 py-2 rounded bg-slate-800 text-white"
              />
            ))}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddBook(false);
                  setNewBook(emptyBook);
                }}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </button>

              <button
                onClick={handleAddBook}
                className="px-4 py-2 rounded-lg bg-emerald-400 text-black font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-[300px]">
            <p className="text-white mb-6">Delete this book?</p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-red-500 px-4 py-2 rounded text-white"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteBookId(null);
                }}
              >
                No
              </button>
              <button
                onClick={handleDeleteBook}
                className="bg-red-500 px-4 py-2 rounded text-white"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BORROW CONFIRM */}
      {showConfirm && selectedBook && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-900 p-6 rounded-xl w-[300px]">
            <p className="text-white mb-6">
              Borrow <strong>{selectedBook.title}</strong>?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-white text-black px-4 py-2 rounded font-bold"
                onClick={() => {
                  setShowConfirm(false);
                  setSelectedBook(null);
                }}
              >
                No
              </button>
              <button
                onClick={() => handleBorrow(selectedBook)}
                className="bg-emerald-400 text-black px-4 py-2 rounded font-bold"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MESSAGE */}
      {message && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-xl">
          {message}
        </div>
      )}
    </div>
  );
}
