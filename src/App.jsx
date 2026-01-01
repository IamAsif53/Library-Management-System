// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./FrontEnd/Navbar";
import HomePage from "./FrontEnd/HomePage";
import Books from "./FrontEnd/Books";
import ContactUs from "./FrontEnd/ContactUs";
import BookHistory from "./FrontEnd/BookHistory";
import AdminDashboard from "./FrontEnd/AdminDashboard";
import LibraryCard from "./FrontEnd/LibraryCard";
import LibraryCardPending from "./FrontEnd/LibraryCardPending";
import Chatbot from "./FrontEnd/Chatbot";
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

  useEffect(() => {
    const update = () => setIsLoggedIn(!!localStorage.getItem("token"));

    const onStorage = (e) => {
      if (e.key === "token") update();
    };
    const onAuthChange = () => update();

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChange", onAuthChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChange", onAuthChange);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Navbar shown only after successful login */}
      {isLoggedIn && <Navbar />}

      {/* adjust top padding depending on navbar presence */}
      <div className={isLoggedIn ? "pt-28" : "pt-8"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<Books />} />
          <Route path="/bookhistory" element={<BookHistory />} />


          <Route path="/contact" element={<ContactUs />} />
          <Route path="*" element={<div className="p-8">Page not found</div>} />
          <Route
            path="/admin"
            element={(() => {
              const user = JSON.parse(localStorage.getItem("user"));
              return user?.role === "admin" ? (
                <AdminDashboard />
              ) : (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
                  Admin access only
                </div>
              );
            })()}
          />

          <Route path="/library-card" element={<LibraryCard />} />

          <Route
            path="/library-card-pending"
            element={(() => {
              const user = JSON.parse(localStorage.getItem("user"));
              return user?.role === "admin" ? (
                <LibraryCardPending />
              ) : (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
                  Admin access only
                </div>
              );
            })()}
          />

        </Routes>
      </div>

        {/* 🤖 CHATBOT — GLOBAL & LOGGED-IN ONLY */}
    {isLoggedIn && <Chatbot />}
    </BrowserRouter>
  );
}
