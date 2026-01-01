// src/FrontEnd/ContactUs.jsx
import React from "react";

const contactList = [
  {
    id: "l1",
    initials: "AR",
    name: "Dr. Anisur Rahman",
    role: "Chief Librarian",
    phone: "+8801711223344",
    email: "anisur@cuet.ac.bd",
    office: "CUET Central Library",
    whatsapp: "8801711223344",
  },
  {
    id: "l2",
    initials: "FC",
    name: "Ms. Farhana Chowdhury",
    role: "Assistant Librarian",
    phone: "+8801819556677",
    email: "farhana@cuet.ac.bd",
    office: "CUET Central Library",
    whatsapp: "8801819556677",
  },
];

export default function ContactUs() {
  // copy phone to clipboard (small helper)
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // quick visual feedback — use alert so no extra state is needed
      // (you can replace with a toast or inline feedback later)
      alert("Copied: " + text);
    } catch {
      alert("Could not copy to clipboard. Please copy manually: " + text);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <h2 className="text-3xl font-bold text-indigo-700 mb-4 text-center">
          Contact Our Librarians
        </h2>
        <p className="text-center text-gray-600 mb-8">
          Need help finding books or facing portal issues? Reach out — we're happy to help.
        </p>

        {/* Librarian Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {contactList.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl shadow-md p-6 border border-indigo-100 hover:shadow-lg transition"
              role="region"
              aria-labelledby={`lib-${c.id}-name`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 bg-indigo-200 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-700"
                  aria-hidden
                >
                  {c.initials}
                </div>

                <div>
                  <h3 id={`lib-${c.id}-name`} className="text-xl font-semibold text-gray-800">
                    {c.name}
                  </h3>
                  <p className="text-sm text-gray-500">{c.role}</p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Phone</div>
                    <a
                      href={`tel:${c.phone}`}
                      className="font-medium block hover:underline"
                      aria-label={`Call ${c.name}`}
                    >
                      {c.phone}
                    </a>
                    <div className="text-xs text-gray-400">Office: {c.office}</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyToClipboard(c.phone)}
                      className="px-3 py-1 rounded bg-indigo-50 text-indigo-700 border hover:bg-indigo-100 text-xs"
                      aria-label={`Copy phone number for ${c.name}`}
                    >
                      Copy
                    </button>

                    <a
                      href={`https://wa.me/${c.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded bg-green-50 text-green-700 border hover:bg-green-100 text-xs text-center"
                      aria-label={`Chat on WhatsApp with ${c.name}`}
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Email</div>
                    <a
                      href={`mailto:${c.email}`}
                      className="text-gray-700 hover:underline"
                      aria-label={`Email ${c.name}`}
                    >
                      {c.email}
                    </a>
                  </div>

                  <div className="text-right text-xs text-gray-500">
                    <div>Available: Mon–Fri</div>
                    <div>9:00 AM — 5:00 PM</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* small footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          For emergencies or lost items, please visit the central circulation desk inside the library.
        </div>
      </div>
    </div>
  );
}
