"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function StudentPage() {
  const [programs, setPrograms] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [programId, setProgramId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [professorName, setProfessorName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured. Add keys in .env.local.");
        setLoadingList(false);
        return;
      }

      const [{ data: programRows, error: programError }, { data: professorRows, error: professorError }] =
        await Promise.all([
          supabase.from("programs").select("id, code, name").order("code"),
          supabase.from("professors").select("id, display_name, program_id").order("display_name"),
        ]);

      if (programError || professorError) {
        setError(programError?.message || professorError?.message);
      } else {
        setPrograms(programRows || []);
        setProfessors(professorRows || []);
      }
      setLoadingList(false);
    }

    loadOptions();
  }, []);

  const filteredProfessors = programId
    ? professors.filter((professor) => {
        if (!professor.program_id) return false;
        if (professor.program_id === programId) return true;
        const matchingProg = programs.find(
          (p) => p.code === programId || p.id === programId
        );
        return (
          matchingProg &&
          (professor.program_id === matchingProg.code ||
            professor.program_id === matchingProg.id)
        );
      })
    : professors;

  const searchedProfessors = filteredProfessors.filter((professor) =>
    professor.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured yet.");
      return;
    }
    if (!professorId || !message.trim()) {
      setError("Please choose a professor and write a message.");
      return;
    }

    setStatus("sending");
    const { error: insertError } = await supabase.from("messages").insert({
      professor_id: professorId,
      sender_name: anonymous || !senderName.trim() ? "Anonymous" : senderName.trim(),
      message_content: message.trim(),
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setStatus("idle");
      return;
    }

    setStatus("sent");
    setShowSuccessModal(true);
    setMessage("");
    setSenderName("");
    setAnonymous(false);
    setProfessorId("");
    setProfessorName("");
    setSearchQuery("");
    setProgramId("");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-10">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="modal-appear mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-8 w-8 text-emerald-600"
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
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-navy-900">
                Message Sent Successfully!
              </h2>
              <p className="mt-3 text-navy-600">
                Your appreciation note has been submitted and is awaiting admin approval.
                Once approved, it will appear on your professor&apos;s corkboard.
              </p>
              <div className="mt-6 flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1 rounded-2xl bg-navy-900 px-6 py-3 font-semibold text-white transition hover:bg-navy-800"
                >
                  Send Another
                </button>
                <Link
                  href="/"
                  className="flex-1 rounded-2xl bg-white px-6 py-3 text-center font-semibold text-navy-900 ring-1 ring-navy-200 transition hover:bg-navy-50"
                >
                  Go Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <Link href="/" className="text-sm font-medium text-navy-600 hover:underline">
        Back to home
      </Link>

      <section className="mt-8 rounded-3xl bg-white/90 p-8 shadow-xl shadow-navy-900/10 ring-1 ring-navy-200">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-yellow-600">
          Student Portal
        </p>
        <h1 className="mt-3 text-4xl font-semibold text-navy-900">
          Write a thank-you note
        </h1>
        <p className="mt-3 text-navy-600">
          Your message waits for a quick review, then appears on your
          professor&apos;s corkboard.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="relative">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-800">
                Select Professor
              </span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setShowDropdown(true);
                    setProfessorId("");
                    setProfessorName("");
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder={
                    loadingList
                      ? "Loading professors..."
                      : filteredProfessors.length
                        ? "Search for a professor..."
                        : "No professors available yet"
                  }
                  className="w-full rounded-2xl border border-navy-200 bg-navy-50/60 px-4 py-3 pr-10 outline-none ring-gold-400 transition focus:border-navy-300 focus:bg-white focus:ring-2"
                  required={!professorId}
                />
                <svg
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400"
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
              {professorName && (
                <div className="mt-2 flex items-center gap-2 rounded-xl bg-gold-50 px-3 py-2 text-sm">
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
                    Selected: {professorName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setProfessorId("");
                      setProfessorName("");
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

            {showDropdown && searchedProfessors.length > 0 && !professorId && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-navy-200 bg-white shadow-xl">
                  {searchedProfessors.map((professor) => (
                    <button
                      key={professor.id}
                      type="button"
                      onClick={() => {
                        setProfessorId(professor.id);
                        setProfessorName(professor.display_name);
                        setSearchQuery("");
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-left text-navy-900 transition hover:bg-navy-50 focus:bg-navy-50 focus:outline-none"
                    >
                      <div className="font-medium">{professor.display_name}</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {showDropdown && searchQuery && searchedProfessors.length === 0 && !professorId && (
              <div className="absolute z-20 mt-2 w-full rounded-2xl border border-navy-200 bg-white p-4 text-center text-sm text-navy-600 shadow-xl">
                No professors found matching &quot;{searchQuery}&quot;
              </div>
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              College Program (Optional Filter)
            </span>
            <select
              value={programId}
              onChange={(event) => {
                setProgramId(event.target.value);
                setProfessorId("");
                setProfessorName("");
                setSearchQuery("");
              }}
              className="w-full rounded-2xl border border-navy-200 bg-navy-50/60 px-4 py-3 outline-none ring-gold-400 focus:ring-2"
            >
              <option value="">
                {loadingList ? "Loading programs..." : "All programs"}
              </option>
              {programs.map((program) => (
                <option key={program.id} value={program.code || program.id}>
                  {program.code} — {program.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Your Name
            </span>
            <input
              type="text"
              value={senderName}
              disabled={anonymous}
              onChange={(event) => setSenderName(event.target.value)}
              placeholder={anonymous ? "Anonymous" : "e.g. Maya from CS 201"}
              className="w-full rounded-2xl border border-navy-200 bg-navy-50/60 px-4 py-3 outline-none ring-gold-400 focus:ring-2 disabled:bg-stone-100 disabled:text-stone-400"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-medium text-navy-800">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(event) => setAnonymous(event.target.checked)}
              className="h-4 w-4 accent-navy-800"
            />
            Submit anonymously
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              placeholder="Thank you for the patience, the late office hours, and the way you made hard ideas feel possible."
              className="w-full resize-y rounded-2xl border border-navy-200 bg-navy-50/60 px-4 py-3 outline-none ring-gold-400 focus:ring-2"
              required
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-2xl bg-yellow-400 px-4 py-3 font-semibold text-navy-900 transition hover:bg-yellow-300 disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : "Send appreciation"}
          </button>
        </form>
      </section>
    </main>
  );
}
