// src/FrontEnd/Navbar.jsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import cuetLogo from "../assets/images/CUETLOGO.png";

const Navbar = () => {
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(
    () => !!localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    function syncAuth() {
      setIsLoggedIn(!!localStorage.getItem("token"));
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    }

    function onStorage(e) {
      if (e.key === "token" || e.key === "user") {
        syncAuth();
      }
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener("authChange", syncAuth);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  function handleNavbarLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // notify app in same tab and other listeners
    window.dispatchEvent(new Event("authChange"));

    navigate("/", { replace: true });
  }

  const linkClass = ({ isActive }) =>
    `hover:text-gray-300 transition-all ${
      isActive ? "text-indigo-300 underline" : "text-white"
    }`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-12 py-6 bg-black/50 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-10 font-semibold text-lg">
        {/* Logout / Home */}
        {isLoggedIn ? (
          <button
            onClick={handleNavbarLogout}
            className="text-white hover:text-gray-300 transition-all px-2 py-1 rounded"
          >
            Logout
          </button>
        ) : (
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>
        )}

        <NavLink to="/" className={linkClass}>
          Home
        </NavLink>

         

        {isLoggedIn && user?.role !== "admin" && (
          <NavLink to="/library-card" className={linkClass}>
            Make Library Card
          </NavLink>
        )}

        <NavLink to="/books" className={linkClass}>
          Books
        </NavLink>

        <NavLink to="/bookhistory" className={linkClass}>
          Borrow History
        </NavLink>

        {/* ✅ ADMIN DASHBOARD LINK */}
        {user?.role === "admin" && (
          <NavLink to="/admin" className={linkClass}>
            Admin Dashboard
          </NavLink>
        )}
        {user?.role === "admin" && (
          <NavLink to="/library-card-pending" className={linkClass}>
            Library Card Pending List
          </NavLink>
        )}

        <NavLink to="/contact" className={linkClass}>
          ContactUs
        </NavLink>
      </div>

      {/* Right Title + Logo */}
      <div className="flex items-center gap-4">
        <h1 className="text-4xl font-extrabold tracking-wider text-white drop-shadow-lg">
          CUET LIBRARY
        </h1>

        <img
          src={cuetLogo}
          alt="CUET Logo"
          className="h-12 w-auto object-contain drop-shadow-lg"
        />
      </div>
    </nav>
  );
};

export default Navbar;
