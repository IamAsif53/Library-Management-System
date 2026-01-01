// src/FrontEnd/Login.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";

const Login = ({ setShowSignup, onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fetchingMe, setFetchingMe] = useState(false);

  function onChange(e) {
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        console.error("Failed to parse login response:", parseErr);
        setError("Server returned an invalid response.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(
          data?.error ||
            data?.message ||
            "Login failed. Please check credentials."
        );
        setLoading(false);
        return;
      }

      // Save token and notify same-tab listeners
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.dispatchEvent(new Event("authChange"));
      }

      // ===============================
      // 🔥 FIX 1: STORE USER (if returned)
      // ===============================
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));

        if (onLogin) onLogin(data.user);
      } else if (data.token) {
        // ===============================
        // 🔥 FIX 2: FETCH /me AND STORE USER
        // ===============================
        setFetchingMe(true);
        try {
          const meRes = await fetch("http://localhost:5000/api/users/me", {
            headers: {
              Authorization: `Bearer ${data.token}`,
              "Content-Type": "application/json",
            },
          });

          const meData = await meRes.json();
          const u = meData?.user || meData;

          if (u) {
            localStorage.setItem("user", JSON.stringify(u));
          }

          if (onLogin) onLogin(u || null);
        } catch (err) {
          console.error("Failed to fetch /me after login:", err);
          setError("Logged in but failed to fetch profile.");
        } finally {
          setFetchingMe(false);
        }
      }

      // clear form
      setForm({ email: "", password: "" });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Network error — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 justify-center items-center px-4 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="
          w-full
          max-w-[300px]
          sm:max-w-[350px]
          md:max-w-[420px]
          lg:max-w-[480px]
          bg-white/20
          backdrop-blur-2xl
          p-8
          pb-12
          rounded-3xl
          shadow-2xl
          border border-white/20
        "
        role="region"
        aria-label="Login form"
      >
        <h2
          className="text-4xl font-extrabold text-center text-green-200 mb-6 tracking-wider uppercase"
          style={{ textShadow: "2px 2px 8px rgba(0, 0, 0, 0.7)" }}
        >
          LOGIN
        </h2>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            required
            className="w-full px-4 py-2 rounded-xl bg-white/80 focus:ring-2 ring-green-400 outline-none shadow-md"
          />

          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
            required
            className="w-full px-4 py-2 rounded-xl bg-white/80 focus:ring-2 ring-green-400 outline-none shadow-md"
          />

          {error && <div className="text-sm text-red-500">{error}</div>}

          <button
            type="submit"
            disabled={loading || fetchingMe}
            className={`w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold shadow-lg ${
              loading || fetchingMe ? "opacity-80 cursor-wait" : ""
            }`}
          >
            {loading || fetchingMe ? "Logging in..." : "Login"}
          </button>

          <div className="flex justify-between items-center mt-6 text-sm text-gray-200">
            <p>Don’t have an account?</p>
            <button
              onClick={() => setShowSignup(true)}
              type="button"
              className="px-4 py-1.5 rounded-xl bg-white/20 text-white border border-white/30 hover:bg-white/30 transition"
            >
              Signup
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
