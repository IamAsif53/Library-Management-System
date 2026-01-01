import { useEffect, useRef, useState } from "react";

export default function Chatbot() {
  const [open, setOpen] = useState(false);

  const initialMessage = {
    role: "bot",
    text:
      "Hi 👋 I’m your library assistant.",
  };

  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  if (!token) return null;

  const suggestions = [
    "What is my library card status?",
    "How many books can I borrow?",
    "How many books are available?",
    "What is the fine policy?",
    "When should I return books?",
  ];

  // ✅ FIXED AUTO SCROLL
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  async function sendMessage(textOverride) {
    const msg = textOverride ?? input;
    if (!msg.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            data.reply ||
            "I can help with library rules, borrowing limits, books, and fines.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Failed to connect to chatbot." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([initialMessage]);
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 bg-indigo-500 hover:bg-indigo-600 text-white p-4 rounded-full shadow-xl z-50"
      >
        💬
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-[620px] bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl shadow-2xl border border-white/20 z-50 flex flex-col">
          {/* HEADER */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <span className="text-white font-bold">📚 Library Assistant</span>
            <button
              onClick={clearChat}
              className="text-xs text-red-300 hover:text-red-400"
            >
              Clear
            </button>
          </div>

          {/* CHAT AREA (ONLY THIS SCROLLS) */}
          <div
            className="flex-2 p-3 space-y-3 overflow-y-auto text-sm"
            style={{ scrollBehavior: "smooth" }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-xl px-3 py-2 max-w-[85%] ${
                    m.role === "user"
                      ? "bg-indigo-500 text-white"
                      : "bg-white/10 text-gray-200"
                  }`}
                >
                  {m.role === "bot" && (
                    <div className="text-[10px] uppercase text-gray-400 mb-1">
                      Bot
                    </div>
                  )}
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="text-xs text-gray-400">Bot is typing...</div>
            )}

            {/* 🔽 SCROLL TARGET */}
            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTIONS */}
          <div className="px-3 py-2 border-t border-white/10">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide">
              Suggested questions
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-white/10 hover:bg-indigo-500 text-gray-200 px-3 py-1 rounded-full transition"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* INPUT */}
          <div className="p-3 border-t border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Type your question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              className="flex-1 rounded-lg px-3 py-2 bg-slate-800 text-white text-sm outline-none"
            />
            <button
              onClick={() => sendMessage()}
              className="bg-emerald-400 hover:bg-emerald-500 text-black px-3 rounded-lg font-bold"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
