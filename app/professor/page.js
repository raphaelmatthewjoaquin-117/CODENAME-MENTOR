"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const SESSION_KEY = "teachersday_professor";
const NOTE_COLORS = [
  "bg-amber-200",
  "bg-rose-200",
  "bg-lime-200",
  "bg-sky-200",
  "bg-violet-200",
  "bg-orange-200",
  "bg-pink-200",
  "bg-emerald-200",
  "bg-purple-200",
  "bg-yellow-200",
];

const PUSHPIN_COLORS = ["#ef4444", "#3b82f6", "#eab308", "#8b5cf6", "#10b981"];

const FONT_CLASSES = [
  "font-caveat",
  "font-indie-flower", 
  "font-permanent-marker",
  "font-kalam",
  "font-shadows-into-light",
];

// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to get TRULY random values on each page load
function getRandomValue(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

// Helper function to get consistent random values based on note id (OLD - not used anymore)
function getRandomForNote(noteId, min, max) {
  const hash = noteId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return min + (Math.abs(hash) % (max - min + 1));
}

function Pushpin({ color, offsetX }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      className="absolute -top-4 left-1/2 -translate-x-1/2 drop-shadow-lg"
      style={{ transform: `translateX(calc(-50% + ${offsetX}px))` }}
    >
      <circle cx="12" cy="8" r="5" fill={color} opacity="0.95" />
      <path
        d="M12 8 L12 3"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="12" cy="2.5" r="2" fill="#1f2937" opacity="0.8" />
      <circle cx="12" cy="2.5" r="1" fill="#6b7280" opacity="0.6" />
    </svg>
  );
}

function TapeStrip({ rotation }) {
  return (
    <div
      className="absolute -top-4 left-1/2 h-8 w-24 -translate-x-1/2 bg-gradient-to-b from-amber-50/60 to-amber-100/50 shadow-md"
      style={{
        transform: `translateX(-50%) rotate(${rotation}deg)`,
        backdropFilter: "blur(2px)",
        border: "1px solid rgba(217, 119, 6, 0.1)",
      }}
    />
  );
}

export default function ProfessorPage() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [messages, setMessages] = useState([]);
  const [boardError, setBoardError] = useState("");
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [noteStyles, setNoteStyles] = useState({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    async function loadBoard() {
      if (!session || !isSupabaseConfigured) {
        return;
      }

      setLoadingBoard(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_name, message_content, created_at")
        .eq("professor_id", session.id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        setBoardError(error.message);
      } else {
        const messagesData = data || [];
        
        // Shuffle messages for random placement each time
        const shuffledMessages = shuffleArray(messagesData);
        setMessages(shuffledMessages);
        
        // Generate random styles for each note
        const styles = {};
        shuffledMessages.forEach((note) => {
          styles[note.id] = {
            rotation: getRandomValue(-10, 10),
            scale: getRandomFloat(0.92, 1.06),
            usePushpin: Math.random() > 0.33, // 2/3 use pushpins
            pushpinColor: PUSHPIN_COLORS[getRandomValue(0, PUSHPIN_COLORS.length - 1)],
            pushpinOffsetX: getRandomValue(-3, 3),
            tapeRotation: getRandomValue(-5, 5),
            fontClass: FONT_CLASSES[getRandomValue(0, FONT_CLASSES.length - 1)],
            hasCurl: Math.random() > 0.66, // 1/3 have curls
          };
        });
        setNoteStyles(styles);
      }
      setLoadingBoard(false);
    }

    loadBoard();
  }, [session]);

  async function handleLogin(event) {
    event.preventDefault();
    setLoginError("");

    if (!isSupabaseConfigured) {
      setLoginError("Supabase is not configured yet.");
      return;
    }

    const { data, error } = await supabase
      .from("professors")
      .select("id, username, display_name, password")
      .eq("username", username.trim())
      .maybeSingle();

    if (error || !data || data.password !== password) {
      setLoginError("Username or password did not match.");
      return;
    }

    const nextSession = {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }

  function handleLogout() {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
    setMessages([]);
    setUsername("");
    setPassword("");
  }

  const greeting = useMemo(() => {
    if (!session) {
      return "";
    }
    return `A board of notes for ${session.display_name}`;
  }, [session]);

  if (!ready) {
    return null;
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link href="/" className="text-sm font-medium text-amber-800 hover:underline">
          Back to home
        </Link>
        <section className="mt-16 rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-amber-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
            Professor Portal
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-amber-950">
            Welcome Professor
          </h1>
          <p className="mt-2 text-amber-900/70">
            Use the username and password created for you.
          </p>
          <form className="mt-8 space-y-4" onSubmit={handleLogin}>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Username"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 outline-none ring-amber-400 focus:ring-2"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 outline-none ring-amber-400 focus:ring-2"
              required
            />
            {loginError ? (
              <p className="text-sm text-rose-700">{loginError}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-2xl bg-amber-900 py-3 font-semibold text-amber-50 hover:bg-amber-800"
            >
              Open my corkboard
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-medium text-amber-900/70 hover:underline">
            Home
          </Link>
          <h1 className="mt-2 text-4xl font-semibold text-amber-950">{greeting}</h1>
          <p className="mt-2 text-amber-900/70">
            Only approved notes written for you appear here.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200 hover:bg-amber-50"
        >
          Log Out
        </button>
      </div>

      <section className="corkboard mt-8 min-h-[28rem] rounded-[2rem] p-6 shadow-inner ring-1 ring-amber-900/20">
        {boardError ? (
          <p className="rounded-2xl bg-white/80 p-4 text-rose-800">{boardError}</p>
        ) : null}
        {loadingBoard ? (
          <p className="p-4 text-amber-950/80">Pinning notes to the board...</p>
        ) : null}
        {!loadingBoard && messages.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-2xl bg-white/30 text-center text-amber-950/80">
            No approved notes yet. Check back after students send a few.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {messages.map((note, index) => {
              const style = noteStyles[note.id];
              if (!style) return null; // Wait for styles to load
              
              return (
                <article
                  key={note.id}
                  className={`sticky-note-dynamic group relative min-h-52 rounded-md p-6 pt-8 overflow-hidden ${NOTE_COLORS[index % NOTE_COLORS.length]} ${style.hasCurl ? "corner-curl" : ""}`}
                  style={{
                    transform: `rotate(${style.rotation}deg) scale(${style.scale})`,
                    animationDelay: `${index * 120}ms`,
                  }}
                >
                  {style.usePushpin ? (
                    <Pushpin color={style.pushpinColor} offsetX={style.pushpinOffsetX} />
                  ) : (
                    <TapeStrip rotation={style.tapeRotation} />
                  )}
                  
                  <p className="text-base font-bold uppercase tracking-wide text-amber-950/70">
                    {note.sender_name || "Anonymous"}
                  </p>
                  <p className={`message-text mt-4 whitespace-pre-wrap text-amber-950 break-words ${style.fontClass}`}>
                    {note.message_content}
                  </p>
                  
                  {/* Random doodles - BIGGER AND MORE VISIBLE */}
                  {index % 4 === 0 && (
                    <svg
                      className="absolute bottom-4 right-4 text-rose-500 opacity-40"
                      width="36"
                      height="36"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  )}
                  
                  {index % 5 === 0 && (
                    <svg
                      className="absolute top-4 right-4 text-amber-600 opacity-35"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  )}
                  
                  {index % 6 === 0 && (
                    <svg
                      className="absolute bottom-3 left-3 text-sky-600 opacity-30"
                      width="28"
                      height="28"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
