import { useState } from "react";

export default function LibraryCard() {
  const [form, setForm] = useState({
    name: "",
    department: "",
    level: "",
    term: "",
    paymentMethod: "bkash",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { name, department, level, term } = form;

    if (!name || !department || !level || !term) {
      setError("All fields are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/library-card/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Application failed");
      }

      setSuccess(
        "Library card application submitted successfully. Please wait for admin approval."
      );

      setForm({
        name: "",
        department: "",
        level: "",
        term: "",
        paymentMethod: "bkash",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">
        <h1 className="text-4xl font-extrabold text-center text-white mb-2">
          🎓 Library Card Application
        </h1>

        <p className="text-center text-gray-300 mb-8 text-sm">
          Complete the form below to apply for your library card
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
              className="w-full rounded-xl bg-slate-800 text-white px-4 py-2 outline-none focus:ring-2 ring-indigo-400"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Department
            </label>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. CSE, EEE"
              className="w-full rounded-xl bg-slate-800 text-white px-4 py-2 outline-none focus:ring-2 ring-indigo-400"
            />
          </div>

          {/* Level & Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-200 mb-1">Level</label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-800 text-white px-4 py-2 outline-none focus:ring-2 ring-indigo-400"
              >
                <option value="">Select Level</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-200 mb-1">Term</label>
              <select
                name="term"
                value={form.term}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-800 text-white px-4 py-2 outline-none focus:ring-2 ring-indigo-400"
              >
                <option value="">Select Term</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
              </select>
            </div>
          </div>

          {/* Payment */}
          <div>
            <label className="block text-sm text-gray-200 mb-1">
              Payment Method (Demo)
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="w-full rounded-xl bg-slate-800 text-white px-4 py-2 outline-none focus:ring-2 ring-indigo-400"
            >
              <option value="bkash">bKash (Demo)</option>
              <option value="nagad">Nagad (Demo)</option>
              <option value="card">Card (Demo)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              * This is a demo payment for project purposes
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          {success && (
            <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-black transition ${
              loading
                ? "bg-gray-400 cursor-wait"
                : "bg-indigo-400 hover:bg-indigo-500"
            }`}
          >
            {loading ? "Submitting..." : "Apply for Library Card"}
          </button>
        </form>
      </div>
    </div>
  );
}
