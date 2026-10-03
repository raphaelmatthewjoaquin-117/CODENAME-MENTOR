"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export default function StudentPage() {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
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

      const [
        { data: programRows, error: programError },
        { data: professorRows, error: professorError },
        { data: linkRows, error: linkError },
      ] = await Promise.all([
        supabase.from("programs").select("id, code, name").order("code"),
        supabase.from("professors").select("id, display_name, program_id").order("display_name"),
        supabase.from("professor_programs").select("professor_id, program_id"),
      ]);

      if (programError || professorError || linkError) {
        setError(programError?.message || professorError?.message || linkError?.message);
      } else {
        const codeById = new Map((programRows || []).map((p) => [p.id, p.code]));
        const idsByProfessor = new Map();
        (linkRows || []).forEach((link) => {
          const set = idsByProfessor.get(link.professor_id) || new Set();
          set.add(link.program_id);
          const code = codeById.get(link.program_id);
          if (code) set.add(code);
          idsByProfessor.set(link.professor_id, set);
        });
        setPrograms(programRows || []);
        setProfessors(
          (professorRows || []).map((professor) => ({
            ...professor,
            programKeys: idsByProfessor.get(professor.id) || new Set(),
          }))
        );
      }
      setLoadingList(false);
    }

    loadOptions();
  }, []);

  const filteredProfessors = programId
    ? professors.filter((professor) => professor.programKeys.has(programId))
    : professors;

  const searchedProfessors = filteredProfessors.filter((professor) =>
    professor.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function clearImage() {
    setImageFile(null);
    setImagePreview("");
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    setError("");
    if (!file) {
      clearImage();
      return;
    }
    if (!IMAGE_EXTENSIONS[file.type]) {
      setError("Please choose a JPG, PNG, WebP or GIF image.");
      event.target.value = "";
      clearImage();
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be 5 MB or smaller.");
      event.target.value = "";
      clearImage();
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

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

    let imageUrl = null;
    if (imageFile) {
      const extension = IMAGE_EXTENSIONS[imageFile.type];
      const path = `${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("message-images")
        .upload(path, imageFile, { contentType: imageFile.type });

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setStatus("idle");
        return;
      }
      imageUrl = supabase.storage.from("message-images").getPublicUrl(path).data.publicUrl;
    }

    const { error: insertError } = await supabase.from("messages").insert({
      professor_id: professorId,
      sender_name: anonymous || !senderName.trim() ? "Anonymous" : senderName.trim(),
      message_content: message.trim(),
      image_url: imageUrl,
      status: "pending",
    });

    if (insertError) {
      setError(insertError.message);
      setStatus("idle");
      return;
    }

    clearImage();
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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-12">
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="modal-appear mx-4 w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-navy-200">
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
              <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
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

      <Link
        href="/"
        className="group inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-navy-700 shadow-sm ring-1 ring-navy-200/80 transition hover:bg-white hover:text-navy-900"
      >
        <svg className="h-4 w-4 transition group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      <section className="student-portal-card mt-6 rounded-3xl bg-white/95 shadow-xl shadow-navy-900/10 ring-1 ring-navy-200">
        <div className="relative z-10 p-6 sm:p-8 md:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-navy-900 shadow-sm">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 8.25h9m-9 3.75h6m-8.25 8.25L3 21l.75-4.5A8.25 8.25 0 1112 20.25c-1.45 0-2.82-.37-4.01-1.02z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-700">
                Student Portal
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">
                Write a thank-you note
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-navy-600">
            Share a little gratitude. Your note will be reviewed before it appears
            on your professor&apos;s corkboard.
          </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                  className="student-form-control w-full rounded-2xl border border-navy-200 bg-white/80 px-4 py-3 pr-10"
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
              className="student-form-control w-full rounded-2xl border border-navy-200 bg-white/80 px-4 py-3"
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

          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-navy-800">
                Your Name
              </span>
              <input
                type="text"
                value={senderName}
                disabled={anonymous}
                onChange={(event) => setSenderName(event.target.value)}
                placeholder={anonymous ? "Anonymous" : "e.g. Matthew from BS-IT 4th yr"}
                className="student-form-control w-full rounded-2xl border border-navy-200 bg-white/80 px-4 py-3 disabled:bg-stone-100 disabled:text-stone-400"
              />
              <label className="mt-3 inline-flex items-center gap-2.5 text-sm font-medium text-navy-700">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(event) => setAnonymous(event.target.checked)}
                  className="h-4 w-4 rounded accent-navy-800"
                />
                Submit anonymously
              </label>
            </label>
            
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Message
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={6}
              placeholder="Thank you for the patience, the late office hours, and the way you made hard ideas feel possible."
              className="student-form-control w-full resize-y rounded-2xl border border-navy-200 bg-white/80 px-4 py-3"
              required
            />
          </label>

          <div className="block">
            <span className="mb-2 block text-sm font-semibold text-navy-800">
              Picture (Optional)
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="student-form-control w-full rounded-2xl border border-dashed border-navy-300 bg-white/80 px-4 py-3 text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-navy-800 file:px-3 file:py-1.5 file:font-semibold file:text-white file:transition hover:file:bg-navy-700"
            />
            {imagePreview ? (
              <div className="mt-3 flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Selected preview"
                  className="max-h-40 rounded-2xl border border-navy-200"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-sm font-semibold text-rose-700 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-2xl bg-navy-900 px-4 py-3.5 font-semibold text-white shadow-md shadow-navy-900/15 transition hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-400/50 disabled:cursor-wait disabled:opacity-60"
          >
            {status === "sending" ? "Sending..." : "Send appreciation"}
          </button>
        </form>
        </div>
      </section>
    </main>
  );
}
