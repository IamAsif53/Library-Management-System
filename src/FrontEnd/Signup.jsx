// src/FrontEnd/Signup.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const EMAIL_RE =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Signup = ({ setShowSignup }) => {
  const [form, setForm] = useState({
    regNo: "", // "Your ID"
    name: "",
    department: "",
    email: "",
    password: "", // kept locally for UX
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    console.log("handleSubmit called; form state:", form);

    // Basic client-side validation
    if (!form.name.trim() || !form.email.trim() || !form.regNo.trim()) {
      setError("Please fill Name, Email and ID (regNo).");
      return;
    }

    if (!EMAIL_RE.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.password || form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Prepare payload that matches backend User model
      const payload = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        department: form.department.trim(),
        regNo: form.regNo.trim(),
        password: form.password,
      };

      console.log("Submitting signup payload:", payload);

const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

      console.log("Raw response from server:", res.status, res.statusText);

      // attempt parse (safe)
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error("Failed to parse JSON response", e);
        setError("Server returned invalid response");
        setLoading(false);
        return;
      }

      console.log("Parsed response body:", data);

      if (!res.ok) {
        // Prefer helpful server messages if available (duplicate keys, validation, etc.)
        const serverMsg =
          data?.error ||
          data?.message ||
          (data?.details ? JSON.stringify(data.details) : null) ||
          "Failed to submit. Try again.";
        setError(serverMsg);
        setLoading(false);
        return;
      }

      setSuccess("Signup successful ✓");
      console.log("Signup saved, server returned:", data);

      // Clear the form AFTER success
      setForm({ regNo: "", name: "", department: "", email: "", password: "" });

      // close modal after short delay (optional)
      setTimeout(() => {
        setShowSignup(false);
      }, 900);
    } catch (err) {
      console.error("Network error while submitting signup:", err);
      setError("Network error — could not reach server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="w-full max-w-[420px] bg-white/20 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/20"
    >
      <h2 className="text-4xl font-extrabold text-center text-green-200 mb-6">
        SIGNUP
      </h2>

      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <input
          name="regNo"
          value={form.regNo}
          onChange={onChange}
          type="text"
          inputMode="numeric"
          placeholder="Your ID (Reg No)"
          autoComplete="username"
          className="w-full px-4 py-2 rounded-xl bg-white/80 focus:bg-white focus:ring-2 ring-green-400 outline-none shadow-md placeholder-gray-500 text-sm"
        />

        <input
          name="name"
          value={form.name}
          onChange={onChange}
          type="text"
          placeholder="Name"
          autoComplete="name"
          className="w-full px-4 py-2 rounded-xl bg-white/80 focus:bg-white focus:ring-2 ring-green-400 outline-none shadow-md placeholder-gray-500 text-sm"
        />

        <input
          name="department"
          value={form.department}
          onChange={onChange}
          type="text"
          placeholder="Department"
          autoComplete="organization"
          className="w-full px-4 py-2 rounded-xl bg-white/80 focus:bg-white focus:ring-2 ring-green-400 outline-none shadow-md placeholder-gray-500 text-sm"
        />

        <input
          name="email"
          value={form.email}
          onChange={onChange}
          type="email"
          placeholder="Email"
          autoComplete="email"
          className="w-full px-4 py-2 rounded-xl bg-white/80 focus:bg-white focus:ring-2 ring-green-400 outline-none shadow-md placeholder-gray-500 text-sm"
        />

        <input
          name="password"
          value={form.password}
          onChange={onChange}
          type="password"
          placeholder="Password (min 6 chars)"
          autoComplete="new-password"
          className="w-full px-4 py-2 rounded-xl bg-white/80 focus:bg-white focus:ring-2 ring-green-400 outline-none shadow-md placeholder-gray-500 text-sm"
        />

        {/* messages */}
        {error && <div className="text-sm text-red-500 mt-1">{error}</div>}
        {success && <div className="text-sm text-green-600 mt-1">{success}</div>}

        {/* Submit button aligned to bottom right */}
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-white shadow-md transition-all ${
              loading ? "bg-green-400 cursor-wait" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {loading ? "Submitting..." : "Sign up"}
          </button>
        </div>
      </form>

      {/* Optionally keep a small cancel/close control */}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => setShowSignup(false)}
          className="text-sm text-gray-200 underline"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
};

export default Signup;
