"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const ADMIN_SESSION_KEY = "teachersday_admin";
const MESSAGE_SELECT =
  "id, sender_name, message_content, status, created_at, professor_id, professors(display_name, programs(code, name))";

function playDing() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  } catch {
    // Browser audio can be blocked; toast still shows.
  }
}

function statusStyles(status) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-800";
  }
  if (status === "rejected") {
    return "bg-rose-100 text-rose-800";
  }
  return "bg-gold-100 text-gold-700";
}

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [messages, setMessages] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef(null);
  const [professorFilter, setProfessorFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProfessorDropdown, setShowProfessorDropdown] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored === "1") {
      setUnlocked(true);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!unlocked || !isSupabaseConfigured) {
      return;
    }

    let channel;

    async function loadMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select(MESSAGE_SELECT)
        .in("status", ["pending", "approved"])
        .order("created_at", { ascending: false });

      if (error) {
        setLoadError(error.message);
        return;
      }
      setLoadError("");
      setMessages(data || []);
    }

    loadMessages();

    channel = supabase
      .channel("admin-all-messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            playDing();
            setToast("A new appreciation note just arrived.");
            if (toastTimer.current) {
              clearTimeout(toastTimer.current);
            }
            toastTimer.current = setTimeout(() => setToast(""), 3500);
          }
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, [unlocked]);

  const counts = useMemo(
    () => ({
      pending: messages.filter((item) => item.status === "pending").length,
      approved: messages.filter((item) => item.status === "approved").length,
      all: messages.length,
    }),
    [messages]
  );

  const allProfessors = useMemo(() => {
    const profMap = new Map();
    messages.forEach((msg) => {
      if (msg.professors && !profMap.has(msg.professor_id)) {
        profMap.set(msg.professor_id, {
          id: msg.professor_id,
          name: msg.professors.display_name,
          program: msg.professors.programs,
        });
      }
    });
    return Array.from(profMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [messages]);

  const allPrograms = useMemo(() => {
    const progMap = new Map();
    messages.forEach((msg) => {
      if (msg.professors?.programs && !progMap.has(msg.professors.programs.code)) {
        progMap.set(msg.professors.programs.code, msg.professors.programs);
      }
    });
    return Array.from(progMap.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [messages]);

  const searchedProfessors = useMemo(() => {
    return allProfessors.filter((prof) =>
      prof.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allProfessors, searchQuery]);

  const visibleMessages = useMemo(() => {
    let filtered = messages;

    // Filter by status
    if (filter !== "all") {
      filtered = filtered.filter((item) => item.status === filter);
    }

    // Filter by professor
    if (professorFilter) {
      filtered = filtered.filter((item) => item.professor_id === professorFilter);
    }

    // Filter by program
    if (programFilter) {
      filtered = filtered.filter(
        (item) =>
          item.professors?.programs?.code === programFilter ||
          item.professors?.program_id === programFilter ||
          item.professors?.programs?.id === programFilter
      );
    }

    return filtered;
  }, [filter, messages, professorFilter, programFilter]);

  function handleUnlock(event) {
    event.preventDefault();
    const expected = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "teachersday2026";
    if (password !== expected) {
      setAuthError("That admin password is not correct.");
      return;
    }
    sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
    setUnlocked(true);
  }

  async function updateStatus(id, status) {
    if (!isSupabaseConfigured) {
      return;
    }
    const { error } = await supabase.from("messages").update({ status }).eq("id", id);
    if (error) {
      setLoadError(error.message);
      return;
    }
    if (status === "rejected") {
      setMessages((current) => current.filter((item) => item.id !== id));
      return;
    }
    setMessages((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item))
    );
  }

  async function deleteMessage(id) {
    if (!isSupabaseConfigured) {
      return;
    }
    const confirmed = window.confirm("Delete this note permanently?");
    if (!confirmed) {
      return;
    }
    const { error } = await supabase.from("messages").delete().eq("id", id);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setMessages((current) => current.filter((item) => item.id !== id));
  }

  if (!ready) {
    return null;
  }

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-10">
        <Link href="/" className="text-sm font-medium text-navy-600 hover:underline">
          Back to home
        </Link>
        <section className="mt-16 rounded-3xl bg-white/90 p-8 shadow-xl ring-1 ring-navy-200">
          <h1 className="text-3xl font-semibold text-navy-900">Admin desk</h1>
          <p className="mt-2 text-navy-600">
            Enter the staff password to review pending and approved notes.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleUnlock}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Admin password"
              className="w-full rounded-2xl border border-navy-200 bg-navy-50/70 px-4 py-3 outline-none ring-gold-400 focus:ring-2"
            />
            {authError ? <p className="text-sm text-rose-700">{authError}</p> : null}
            <button
              type="submit"
              className="w-full rounded-2xl bg-yellow-400 py-3 font-semibold text-navy-900 transition hover:bg-yellow-300"
            >
              Unlock dashboard
            </button>
          </form>
        </section>
      </main>
    );
  }

  const filters = [
    { key: "pending", label: `Pending (${counts.pending})` },
    { key: "approved", label: `Approved (${counts.approved})` },
    { key: "all", label: `All (${counts.all})` },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10">
      {toast ? (
        <div className="toast-in fixed right-6 top-6 z-50 rounded-2xl bg-navy-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/" className="text-sm font-medium text-navy-600 hover:underline">
            Home
          </Link>
          <h1 className="mt-2 text-4xl font-semibold text-navy-900">
            Message desk
          </h1>
          <p className="mt-2 text-navy-600">
            Review pending notes, keep approved ones, and delete anything that should not stay on a corkboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            setUnlocked(false);
          }}
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy-900 ring-1 ring-navy-200"
        >
          Lock
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                filter === item.key
                  ? "bg-yellow-400 text-navy-950 font-bold shadow-sm"
                  : "bg-white text-navy-900 ring-1 ring-navy-200 hover:bg-navy-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {/* Professor Filter */}
        <div className="relative">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Filter by Professor
            </span>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setShowProfessorDropdown(true);
                }}
                onFocus={() => setShowProfessorDropdown(true)}
                placeholder="Search professors..."
                className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-2.5 pr-10 text-sm outline-none ring-gold-400 transition focus:border-navy-300 focus:ring-2"
              />
              <svg
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {professorFilter && (
              <div className="mt-2 flex items-center gap-2 rounded-xl bg-gold-50 px-3 py-1.5 text-sm">
                <svg
                  className="h-4 w-4 text-gold-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium text-navy-800">
                  {allProfessors.find((p) => p.id === professorFilter)?.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setProfessorFilter("");
                    setSearchQuery("");
                  }}
                  className="ml-auto text-navy-500 hover:text-navy-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </label>

          {showProfessorDropdown && searchedProfessors.length > 0 && !professorFilter && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowProfessorDropdown(false)}
              />
              <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-navy-200 bg-white shadow-xl">
                {searchedProfessors.map((professor) => (
                  <button
                    key={professor.id}
                    type="button"
                    onClick={() => {
                      setProfessorFilter(professor.id);
                      setSearchQuery("");
                      setShowProfessorDropdown(false);
                    }}
                    className="w-full px-4 py-2.5 text-left transition hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
                  >
                    <div className="font-medium text-navy-900">{professor.name}</div>
                    {professor.program && (
                      <div className="text-xs text-navy-500">
                        {professor.program.code} — {professor.program.name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {showProfessorDropdown && searchQuery && searchedProfessors.length === 0 && !professorFilter && (
            <div className="absolute z-20 mt-2 w-full rounded-2xl border border-navy-200 bg-white p-4 text-center text-sm text-navy-600 shadow-xl">
              No professors found matching &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Program Filter */}
        <div>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Filter by Program
            </span>
            <select
              value={programFilter}
              onChange={(event) => setProgramFilter(event.target.value)}
              className="w-full rounded-2xl border border-navy-200 bg-white px-4 py-2.5 text-sm outline-none ring-gold-400 transition focus:border-navy-300 focus:ring-2"
            >
              <option value="">All programs</option>
              {allPrograms.map((program) => (
                <option key={program.code} value={program.code}>
                  {program.code} — {program.name}
                </option>
              ))}
            </select>
          </label>
          {programFilter && (
            <button
              type="button"
              onClick={() => setProgramFilter("")}
              className="mt-2 text-sm font-medium text-navy-500 hover:text-navy-800 hover:underline"
            >
              Clear program filter
            </button>
          )}
        </div>
      </div>

      {!isSupabaseConfigured ? (
        <p className="mt-8 rounded-2xl bg-rose-50 p-4 text-rose-800">
          Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in
          .env.local.
        </p>
      ) : null}
      {loadError ? (
        <p className="mt-4 rounded-2xl bg-rose-50 p-4 text-rose-800">{loadError}</p>
      ) : null}

      <section className="mt-8 grid gap-4">
        {visibleMessages.length === 0 ? (
          <div className="rounded-3xl bg-white/80 p-8 text-navy-600 ring-1 ring-navy-200">
            No notes in this list yet.
          </div>
        ) : (
          visibleMessages.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-navy-200"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-gold-600">
                    For {item.professors?.display_name || "Unknown professor"}
                    {item.professors?.programs?.code
                      ? ` · ${item.professors.programs.code}`
                      : ""}
                  </p>
                  <p className="mt-1 text-sm text-navy-600">
                    From {item.sender_name || "Anonymous"}
                  </p>
                  <span
                    className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(item.status)}`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, "approved")}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateStatus(item.id, "rejected")}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteMessage(item.id)}
                    className="rounded-full bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-lg leading-7 text-navy-900">
                {item.message_content}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
