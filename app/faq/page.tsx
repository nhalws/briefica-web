"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import Footer from "../components/Footer";

export default function FAQPage() {
  const router = useRouter();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openSubsection, setOpenSubsection] = useState<string | null>(null);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const [openSubSubsection, setOpenSubSubsection] = useState<string | null>(null);
  
  // State for interactive demos
  const [noteColor, setNoteColor] = useState("#FFD700");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
    setOpenSubsection(null);
    setOpenQuestion(null);
    setOpenSubSubsection(null);
  };

  const toggleSubsection = (subsection: string) => {
    setOpenSubsection(openSubsection === subsection ? null : subsection);
    setOpenQuestion(null);
    setOpenSubSubsection(null);
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestion(openQuestion === question ? null : question);
    setOpenSubSubsection(null);
  };

  const toggleSubSubsection = (subsubsection: string) => {
    setOpenSubSubsection(openSubSubsection === subsubsection ? null : subsubsection);
  };

  // Preset colors that mimic macOS color picker
  const presetColors = [
    "#FF3B30", "#FF9500", "#FFCC00", "#34C759", "#00C7BE",
    "#30B0C7", "#32ADE6", "#007AFF", "#5856D6", "#AF52DE",
    "#FF2D55", "#A2845E", "#8E8E93", "#000000", "#FFFFFF"
  ];

  return (
    <main className="min-h-screen bg-[#2b2b2b] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </button>

          <Image
            src="/logo_6.png"
            alt="briefica"
            width={140}
            height={42}
            className="object-contain"
          />
        </div>

        <h1 className="text-4xl font-bold mb-2">manual</h1>
        <p className="text-white/70 mb-8">everything you need to know about briefica</p>

        <div className="space-y-3">
          {/* SECTION 1: What is briefica? */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("what-is-briefica")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-bold text-lg">1. What is briefica?</span>
              <svg
                className={`w-5 h-5 flex-shrink-0 transition-transform ${openSection === "what-is-briefica" ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openSection === "what-is-briefica" && (
              <div className="px-4 pb-4">
                <p className="text-white/80 mb-4 pl-4">
                  briefica is a comprehensive platform for law students that combines a powerful native desktop editor 
                  with a social web platform. Create structured case briefs, outlines, and test banks offline, then share 
                  and discover materials online with your school community.
                </p>

                {/* SUBSECTION A: How do I use briefica 6 (offline)? */}
                <div className="border border-white/10 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleSubsection("briefica-offline")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">A. How do I use briefica 6?</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubsection === "briefica-offline" ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSubsection === "briefica-offline" && (
                    <div className="px-3 pb-3 space-y-2">
                      {/* Question 1: How to download briefica 6 */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("download-b6")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">1. How to download briefica 6</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "download-b6" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "download-b6" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-3">
                            <p>Navigate to briefica.com and click on "download briefica 6." Save the installer to your computer.</p>
                          </div>
                        )}
                      </div>

                      {/* Continue with other questions as before... */}
                    </div>
                  )}
                </div>

                {/* SUBSECTION B: Getting started with briefica */}
                <div className="border border-white/10 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleSubsection("getting-started")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">B. Getting started with briefica</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubsection === "getting-started" ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSubsection === "getting-started" && (
                    <div className="px-3 pb-3 space-y-2">
                      {/* Sub-dropdown: I. Creating a briefset */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("creating-briefset")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">I. Creating a briefset (.bset)</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "creating-briefset" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "creating-briefset" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-3">
                            <p>
                              After downloading and installing briefica, you will be prompted to create a briefset. 
                              Title your briefset, and click, "create and open."
                            </p>
                            <div className="flex justify-center">
                              <Image
                                src="/beginning.png"
                                alt="Creating a briefset in briefica"
                                width={600}
                                height={400}
                                className="rounded-lg border border-white/20"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-dropdown: II. Adding legal authorities */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("add-legal-authorities")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">II. Adding legal authorities</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "add-legal-authorities" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "add-legal-authorities" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-3">
                            <p>
                              Once your briefset is created, click "options" → "authorities" → "add new" to add a legal authority to your set.
                            </p>
                            <div className="border border-white/20 rounded-lg overflow-hidden">
                              <Image
                                src="/add new auth.png"
                                alt="Adding a new authority in briefica"
                                width={800}
                                height={600}
                                className="w-full h-auto"
                              />
                            </div>
                            <p>
                              Add an authority by completing the (1) name, (2) area(s) of law, and (3) rule OR notes fields at a minimum.
                            </p>
                            <div className="border border-white/20 rounded-lg overflow-hidden">
                              <Image
                                src="/new auth page.png"
                                alt="Adding authority details in briefica"
                                width={800}
                                height={600}
                                className="w-full h-auto"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-dropdown: III. Using the table of contents */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("table-of-contents")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">III. Using the table of contents</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "table-of-contents" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "table-of-contents" && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Sub-subsection (a): Creating headings */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("creating-headings")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(a) Creating headings (+ sub-headings)</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "creating-headings" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "creating-headings" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <p>
                                    Create headings by clicking, "edit..." → "creating heading" OR "create subheading." Name your heading accordingly.
                                  </p>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/creating headings.png"
                                      alt="Creating headings in briefica"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sub-subsection (b): Assigning authorities */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("assigning-authorities")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(b) Assigning authorities</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "assigning-authorities" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "assigning-authorities" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <p>
                                    To assign an authority to a heading, select the authority in your library, click "edit" → "assign" → "reassign/assign", and select the heading you want the authority assigned to.
                                  </p>
                                  <div className="space-y-3">
                                    <div className="border border-white/20 rounded-lg overflow-hidden">
                                      <Image
                                        src="/assignment_1.png"
                                        alt="Assigning authorities step 1"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto"
                                      />
                                    </div>
                                    <div className="border border-white/20 rounded-lg overflow-hidden">
                                      <Image
                                        src="/assignment_2.png"
                                        alt="Assigning authorities step 2"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub-dropdown: IV. Using the outline builder */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("outline-builder")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">IV. Using the outline builder</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "outline-builder" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "outline-builder" && (
                          <div className="px-3 pb-3 space-y-2">
                            {/* Sub-subsection (a): Navigating the builder */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("navigating-builder")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(a) Navigating the builder</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "navigating-builder" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "navigating-builder" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <p>
                                    Navigate to the outline builder by clicking, "build ✎". In the builder, you'll find all your notes in your outline. You can create, edit, and re-order these notes to your liking, and these changes are immediately reflected in the editor.
                                  </p>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/outline build.png"
                                      alt="Outline builder interface"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/adding notes.png"
                                      alt="Adding notes in outline builder"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sub-subsection (b): Editing notes */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("editing-notes")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(b) Editing notes</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "editing-notes" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "editing-notes" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/add note page main.png"
                                      alt="Add note from page main"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/note added to builder.png"
                                      alt="Note added to builder"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <p>
                                    You may also edit these notes directly in your editor. These changes are saved to your briefset upon pressing the global "save..." button.
                                  </p>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/edit note live.png"
                                      alt="Edit note live"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sub-subsection (c): Pinning authorities */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("pinning-authorities")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(c) Pinning authorities</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "pinning-authorities" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "pinning-authorities" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <p>
                                    After assigning authorities to your table of contents, pin them to your outline by clicking, "pin..". Select the respective heading, and select the specific contents of the authority you want pinned.
                                  </p>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/pin auth.png"
                                      alt="Pin authority"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/pin specifics.png"
                                      alt="Pin specifics"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/auth pinned.png"
                                      alt="Authority pinned"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Sub-subsection (d): Exporting outlines */}
                            <div className="border border-white/10 rounded-lg overflow-hidden bg-[#252525]">
                              <button
                                onClick={() => toggleSubSubsection("exporting-outlines")}
                                className="w-full flex items-center justify-between p-2.5 text-left hover:bg-white/5 transition-colors"
                              >
                                <span className="text-xs font-medium">(d) Exporting outlines</span>
                                <svg
                                  className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${openSubSubsection === "exporting-outlines" ? 'rotate-180' : ''}`}
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              {openSubSubsection === "exporting-outlines" && (
                                <div className="px-2.5 pb-2.5 text-xs text-white/70 space-y-3">
                                  <p>
                                    To export your outline, click, "export...". Upon exporting, select one of our native presets, or export your current outline build by selecting, "modded". Advanced toggles allow for more specification.
                                  </p>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/export sets.png"
                                      alt="Export sets"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                  <div className="border border-white/20 rounded-lg overflow-hidden">
                                    <Image
                                      src="/show export.png"
                                      alt="Show exports"
                                      width={800}
                                      height={600}
                                      className="w-full h-auto"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: What is a .bset? */}
          <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden">
            <button
              onClick={() => toggleSection("what-is-bset")}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-bold text-lg">2. What is a .bset?</span>
              <svg
                className={`w-5 h-5 flex-shrink-0 transition-transform ${openSection === "what-is-bset" ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {openSection === "what-is-bset" && (
              <div className="px-4 pb-4">
                <div className="pl-4 space-y-3 mb-4">
                  <p className="text-white/80">
                    A <strong>.bset</strong> (Brief Set) is briefica's native file format for organizing collections of case briefs. 
                    It's designed specifically for law students to structure and store case analysis in a standardized format.
                  </p>

                  {/* INTERACTIVE DEMO */}
                  <div className="bg-[#2b2b2b] border border-white/20 rounded-lg p-4 space-y-4 mt-4">
                    <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Interactive Demo: Case Brief Structure
                    </h5>

                    <p className="text-xs text-white/60 italic">
                      Try filling in the fields below to see how a .bset file is structured!
                    </p>

                    <div className="space-y-3">
                      {/* Citation */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Citation:
                        </label>
                        <input
                          type="text"
                          placeholder="347 U.S. 483 (1954)"
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Name (case or authority):
                        </label>
                        <input
                          type="text"
                          placeholder="Brown v. Board of Education"
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      {/* Area of Law */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Area(s) of Law:
                        </label>
                        <input
                          type="text"
                          placeholder="Constitutional Law"
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40"
                        />
                      </div>

                      {/* Facts */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Facts:
                        </label>
                        <textarea
                          placeholder="Black children were denied admission to public schools attended by white children under state laws requiring or permitting racial segregation in public education."
                          rows={3}
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                      </div>

                      {/* Question */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Question:
                        </label>
                        <textarea
                          placeholder="Does racial segregation in public schools violate the Equal Protection Clause of the Fourteenth Amendment?"
                          rows={2}
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                      </div>

                      {/* Holding */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Holding:
                        </label>
                        <textarea
                          placeholder="Yes. Racial segregation in public schools violates the Equal Protection Clause."
                          rows={2}
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                      </div>

                      {/* Rule */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-1">
                          Rule:
                        </label>
                        <textarea
                          placeholder="State-imposed segregation in public education is unconstitutional when it denies students equal protection of the laws."
                          rows={2}
                          className="w-full bg-[#1e1e1e] border border-white/20 rounded px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-white/40 resize-none"
                        />
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="flex justify-center pt-2">
                      <a
                        href="/sample.bset"
                        download="sample.bset"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#66b2ff] hover:bg-[#5aa3ee] text-white font-medium rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Sample
                      </a>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-semibold mb-2">What's in a .bset file?</h4>
                    <ul className="list-disc pl-6 space-y-1 text-white/70">
                      <li><strong>Case Name:</strong> The full citation and parties</li>
                      <li><strong>Facts:</strong> Key facts of the case</li>
                      <li><strong>Issue:</strong> The legal question being addressed</li>
                      <li><strong>Rule:</strong> The applicable law or principle</li>
                      <li><strong>Analysis:</strong> How the court applied the rule</li>
                      <li><strong>Conclusion:</strong> The court's holding</li>
                      <li><strong>Notes:</strong> Your own observations and connections</li>
                    </ul>
                  </div>
                </div>

                <p className="text-white/80 font-semibold mb-3 pl-4">Okay, I understand .bset files, what about...</p>

                {/* SUBSECTION: .bmod files WITH INTERACTIVE DEMO */}
                <div className="border border-white/10 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleSubsection("bmod-files")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">.bmod (modifications)</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubsection === "bmod-files" ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSubsection === "bmod-files" && (
                    <div className="px-3 pb-3">
                      <div className="space-y-4 text-white/70 text-sm">
                        <p>
                          <strong>.bmod</strong> (Brief Modification) files are briefica's format for organizing outlines and study guides by topic. 
                          They use a color-coding system to help you categorize and visualize different types of notes.
                        </p>

                        {/* INTERACTIVE DEMO */}
                        <div className="bg-[#2b2b2b] border border-white/20 rounded-lg p-4 space-y-4">
                          <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Interactive Demo: Color-Coded Notes
                          </h5>

                          <p className="text-xs text-white/60 italic">
                            Try clicking the color swatch below to change the color of your note!
                          </p>

                          {/* Color Swatch Example */}
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <button
                                onClick={() => setShowColorPicker(!showColorPicker)}
                                className="w-12 h-12 rounded-lg border-2 border-white/30 hover:border-white/50 transition-all shadow-lg cursor-pointer"
                                style={{ backgroundColor: noteColor }}
                                title="Click to change color"
                              />
                              
                              {/* Color Picker Dropdown */}
                              {showColorPicker && (
                                <div className="absolute top-14 left-0 z-50 bg-[#1e1e1e] border border-white/20 rounded-lg p-3 shadow-2xl">
                                  <div className="mb-2 text-xs text-white/70">Choose a color:</div>
                                  <div className="grid grid-cols-5 gap-2 mb-3">
                                    {presetColors.map((color) => (
                                      <button
                                        key={color}
                                        onClick={() => {
                                          setNoteColor(color);
                                          setShowColorPicker(false);
                                        }}
                                        className="w-8 h-8 rounded border border-white/20 hover:border-white/50 transition-all hover:scale-110"
                                        style={{ backgroundColor: color }}
                                      />
                                    ))}
                                  </div>
                                  <input
                                    type="color"
                                    value={noteColor}
                                    onChange={(e) => setNoteColor(e.target.value)}
                                    className="w-full h-8 rounded cursor-pointer"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div 
                                className="p-3 rounded-lg border-l-4 transition-all"
                                style={{ 
                                  backgroundColor: `${noteColor}15`,
                                  borderLeftColor: noteColor
                                }}
                              >
                                <p className="text-xs text-white/70">
                                  <span className="font-semibold" style={{ color: noteColor }}>
                                    GENERAL NOTE ✎
                                  </span>
                                  {" - "}
                                  This is an example of a color-coded note in a .bmod file. 
                                  Click the color swatch to customize it!
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <h5 className="font-semibold text-white mb-2">How .bmod files work:</h5>
                          <ol className="list-decimal pl-6 space-y-2">
                            <li>Create different note types with custom colors</li>
                            <li>Organize notes hierarchically (topics → subtopics → details)</li>
                            <li>Use consistent color-coding across all your outlines</li>
                            <li>Visual organization helps with recall during exams</li>
                            <li>Export to PDF with colors preserved</li>
                          </ol>
                        </div>

                        <div>
                          <h5 className="font-semibold text-white mb-2">When to use .bmod files?</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Creating comprehensive course outlines</li>
                            <li>Breaking down complex topics into digestible modules</li>
                            <li>Organizing black letter law by subject</li>
                            <li>Building study guides for specific exam topics</li>
                            <li>Supplementing your .bset briefs with theoretical frameworks</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* SUBSECTION: .tbank files */}
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSubsection("tbank-files")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">.tbank (typobanks)</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubsection === "tbank-files" ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSubsection === "tbank-files" && (
                    <div className="px-3 pb-3">
                      <div className="space-y-3 text-white/70 text-sm">
                        <p>
                          <strong>.tbank</strong> Typobanks serve as your own personal spell-check. Commerical spell-checks may not always pick on student's mistakes. With typobanks, students can keep a literal bank of their typos.
                        </p>
                        {/* Add tbank content as before */}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 border border-white/10 bg-[#1e1e1e] rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Still have questions?</h2>
          <p className="text-white/70 mb-4">We're here to help!</p>
          <p className="text-sm text-white/60">Contact us at: <a href="mailto:support@briefica.com" className="text-blue-400 hover:underline">support@briefica.com</a></p>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}