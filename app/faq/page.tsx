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

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
    setOpenSubsection(null);
    setOpenQuestion(null);
  };

  const toggleSubsection = (subsection: string) => {
    setOpenSubsection(openSubsection === subsection ? null : subsection);
    setOpenQuestion(null);
  };

  const toggleQuestion = (question: string) => {
    setOpenQuestion(openQuestion === question ? null : question);
  };

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

        <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-white/70 mb-8">Everything you need to know about briefica</p>

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
                    <span className="font-semibold">A. How do I use briefica 6 (briefica offline)?</span>
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
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Go to briefica.com/downloads or click "download briefica" from any page</p>
                            <p><strong>Step 2:</strong> Choose your platform (currently macOS, Windows coming soon)</p>
                            <p><strong>Step 3:</strong> Download the .dmg installer (for macOS)</p>
                            <p><strong>Step 4:</strong> Open the downloaded file and drag briefica to your Applications folder</p>
                            <p><strong>Step 5:</strong> Launch briefica 6 from your Applications</p>
                            <p className="pt-2"><strong>Note:</strong> On first launch, you may need to right-click and select "Open" due to macOS security settings.</p>
                          </div>
                        )}
                      </div>

                      {/* Question 2: How to create a .bset file */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("create-bset")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">2. How to create a .bset file</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "create-bset" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "create-bset" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Open briefica 6 desktop app</p>
                            <p><strong>Step 2:</strong> Click "New" → "Brief Set" (.bset)</p>
                            <p><strong>Step 3:</strong> Enter a title for your brief set (e.g., "Contracts Fall 2025")</p>
                            <p><strong>Step 4:</strong> Add cases by clicking the "+" button</p>
                            <p><strong>Step 5:</strong> For each case, fill in:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Case name</li>
                              <li>Citation</li>
                              <li>Facts</li>
                              <li>Issue</li>
                              <li>Rule</li>
                              <li>Analysis</li>
                              <li>Conclusion</li>
                            </ul>
                            <p><strong>Step 6:</strong> Save your .bset file (⌘+S on Mac)</p>
                            <p className="pt-2">Your .bset file is now ready to upload to briefica online or share directly!</p>
                          </div>
                        )}
                      </div>

                      {/* Question 3: How to create a .bmod file */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("create-bmod")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">3. How to create a .bmod file</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "create-bmod" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "create-bmod" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Open briefica 6 desktop app</p>
                            <p><strong>Step 2:</strong> Click "New" → "Brief Module" (.bmod)</p>
                            <p><strong>Step 3:</strong> Enter a title for your module (e.g., "Offer and Acceptance")</p>
                            <p><strong>Step 4:</strong> Create sections for different topics within the module</p>
                            <p><strong>Step 5:</strong> Add content using the structured editor:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Headings and subheadings</li>
                              <li>Rules and principles</li>
                              <li>Examples and hypotheticals</li>
                              <li>Practice problems</li>
                            </ul>
                            <p><strong>Step 6:</strong> Save your .bmod file (⌘+S on Mac)</p>
                            <p className="pt-2">.bmod files are perfect for organizing outlines and study guides by topic!</p>
                          </div>
                        )}
                      </div>

                      {/* Question 4: How to create a .tbank file */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("create-tbank")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">4. How to create a .tbank file</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "create-tbank" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "create-tbank" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Open briefica 6 desktop app</p>
                            <p><strong>Step 2:</strong> Click "New" → "Test Bank" (.tbank)</p>
                            <p><strong>Step 3:</strong> Enter a title for your test bank (e.g., "Torts Practice Questions")</p>
                            <p><strong>Step 4:</strong> Add questions by clicking the "+" button</p>
                            <p><strong>Step 5:</strong> For each question, enter:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Question text/prompt</li>
                              <li>Answer options (if multiple choice)</li>
                              <li>Correct answer</li>
                              <li>Explanation/reasoning</li>
                            </ul>
                            <p><strong>Step 6:</strong> Organize questions by topic or difficulty</p>
                            <p><strong>Step 7:</strong> Save your .tbank file (⌘+S on Mac)</p>
                            <p className="pt-2">Test banks are great for exam prep and self-testing!</p>
                          </div>
                        )}
                      </div>

                      {/* Question 5: How to export/save my work */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("export-work")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">5. How to export/save my work</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "export-work" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "export-work" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Saving Files:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Press ⌘+S (Mac) or Ctrl+S (Windows) to save</li>
                              <li>Click File → Save or Save As</li>
                              <li>Choose a location on your computer</li>
                              <li>Files are saved in briefica's native format (.bset, .bmod, or .tbank)</li>
                            </ul>
                            
                            <p><strong>Exporting to Other Formats:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Click File → Export</li>
                              <li>Choose format: PDF, DOCX, TXT</li>
                              <li>Select export location</li>
                            </ul>

                            <p><strong>Cloud Backup:</strong></p>
                            <p>Save your files to iCloud, Dropbox, or Google Drive for automatic backup and sync across devices.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* SUBSECTION B: How do I use briefica online (b-web)? */}
                <div className="border border-white/10 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSubsection("briefica-online")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">B. How do I use briefica online (b-web)?</span>
                    <svg
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${openSubsection === "briefica-online" ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSubsection === "briefica-online" && (
                    <div className="px-3 pb-3 space-y-2">
                      {/* Question 1: How to upload files */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("upload-files")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">1. How to upload files to briefica online</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "upload-files" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "upload-files" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Sign in to briefica.com</p>
                            <p><strong>Step 2:</strong> Click the "Upload" button in the top navigation</p>
                            <p><strong>Step 3:</strong> Select your file (.bset, .bmod, or .tbank)</p>
                            <p><strong>Step 4:</strong> Fill in the upload form:</p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li><strong>Title:</strong> Name of your file</li>
                              <li><strong>Description:</strong> What the file covers</li>
                              <li><strong>Visibility:</strong> Public, Unlisted, or Private</li>
                            </ul>
                            <p><strong>Step 5:</strong> Click "Upload" to publish</p>
                            <p className="pt-2">Your file will appear on your profile and in the community feed (if set to Public)!</p>
                          </div>
                        )}
                      </div>

                      {/* Question 2: How to browse and download files */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("browse-download")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">2. How to browse and download files</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "browse-download" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "browse-download" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Browsing:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Go to your Dashboard to see the main feed</li>
                              <li>Use the search bar to find specific topics or users</li>
                              <li>Filter by file type: All, .bset, .bmod, or .tbank</li>
                              <li>Visit your school page to see materials from classmates</li>
                            </ul>
                            
                            <p><strong>Downloading:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Click on any artifact to view details</li>
                              <li>Click the download button (down arrow icon)</li>
                              <li>File downloads to your computer</li>
                              <li>Open the file in briefica 6 desktop app</li>
                            </ul>

                            <p className="pt-2"><strong>Tip:</strong> Like files you find helpful - this helps others discover quality materials!</p>
                          </div>
                        )}
                      </div>

                      {/* Question 3: How to join my school community */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("join-school")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">3. How to join my school community</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "join-school" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "join-school" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Step 1:</strong> Go to your profile (click your username)</p>
                            <p><strong>Step 2:</strong> Click "Edit Profile"</p>
                            <p><strong>Step 3:</strong> Select your law school from the dropdown (200+ ABA schools available)</p>
                            <p><strong>Step 4:</strong> Click "Save"</p>
                            <p className="pt-2"><strong>What you'll get access to:</strong></p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Your school's community page with all members</li>
                              <li>School-specific chat channel</li>
                              <li>Subject-specific channels (select up to 3 subjects)</li>
                              <li>See what classmates are uploading</li>
                              <li>Rankings of top contributors at your school</li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Question 4: How to use chat features */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("use-chat")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">4. How to use chat features</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "use-chat" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "use-chat" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Joining Chat:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Find the "Live Chat" widget on your Dashboard (left sidebar)</li>
                              <li>Click "Join Chat" to enter</li>
                              <li>Start chatting immediately!</li>
                            </ul>

                            <p><strong>Chat Channels:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li><strong>#main:</strong> Chat with all briefica users</li>
                              <li><strong>#[your-school]:</strong> Chat only with classmates (if school is set)</li>
                              <li><strong>Subject channels:</strong> Available on your school page for specific topics</li>
                            </ul>

                            <p><strong>Chat Features:</strong></p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>Real-time messaging (IRC-style)</li>
                              <li>See who's online</li>
                              <li>Click usernames to visit profiles</li>
                              <li>Click "Leave" to exit chat</li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Question 5: How to add friends */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("add-friends")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">5. How to add friends and build your network</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "add-friends" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "add-friends" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Sending Friend Requests:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Visit any user's profile</li>
                              <li>Click "Add Friend" button</li>
                              <li>They'll receive a notification</li>
                            </ul>

                            <p><strong>Managing Requests:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Click "Friends" from the top navigation</li>
                              <li>See pending requests you've received</li>
                              <li>Click "Accept" or "Reject"</li>
                              <li>View all accepted friends</li>
                            </ul>

                            <p><strong>Friend Features:</strong></p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li>See friends in your sidebar</li>
                              <li>Quick access to their profiles</li>
                              <li>See what they're uploading</li>
                              <li>Build your study network</li>
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Question 6: How to manage my profile */}
                      <div className="border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleQuestion("manage-profile")}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium">6. How to manage my profile and uploads</span>
                          <svg
                            className={`w-4 h-4 flex-shrink-0 transition-transform ${openQuestion === "manage-profile" ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openQuestion === "manage-profile" && (
                          <div className="px-3 pb-3 text-sm text-white/70 space-y-2">
                            <p><strong>Editing Your Profile:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>Click your username to visit your profile</li>
                              <li>Click "Edit Profile"</li>
                              <li>Update your bio, law school, or profile picture</li>
                              <li>Click "Save"</li>
                            </ul>

                            <p><strong>Managing Uploads:</strong></p>
                            <ul className="list-disc pl-6 space-y-1 mb-3">
                              <li>All your uploads appear on your profile</li>
                              <li>Click "Edit" to change visibility (Public, Unlisted, Private)</li>
                              <li>Click "Delete" to remove an upload permanently</li>
                              <li>See likes and downloads on each upload</li>
                            </ul>

                            <p><strong>Visibility Options:</strong></p>
                            <ul className="list-disc pl-6 space-y-1">
                              <li><strong>Public:</strong> Anyone can see and download</li>
                              <li><strong>Unlisted:</strong> Only people with the direct link</li>
                              <li><strong>Private:</strong> Only you can see it</li>
                            </ul>
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

                  <div>
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

                  <div>
                    <h4 className="font-semibold mb-2">Why use .bset files?</h4>
                    <ul className="list-disc pl-6 space-y-1 text-white/70">
                      <li>Consistent structure across all your briefs</li>
                      <li>Easy to search and reference during exams</li>
                      <li>Share with classmates in a universal format</li>
                      <li>Import/export to other formats (PDF, DOCX)</li>
                      <li>Works seamlessly with briefica 6 desktop app</li>
                    </ul>
                  </div>
                </div>

                <p className="text-white/80 font-semibold mb-3 pl-4">Okay, I understand .bset files, what about...</p>

                {/* SUBSECTION: .bmod files */}
                <div className="border border-white/10 rounded-lg overflow-hidden mb-3">
                  <button
                    onClick={() => toggleSubsection("bmod-files")}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <span className="font-semibold">.bmod files (b-modifications)</span>
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
                      <div className="space-y-3 text-white/70 text-sm">
                        <p>
                          <strong>.bmod</strong> (Brief Modification) files are briefica's format for organizing outlines and study guides by topic. 
                          Think of them as modular building blocks for your course materials.
                        </p>

                        <div>
                          <h5 className="font-semibold text-white mb-2">What's in a .bmod file?</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Topic/Module Name:</strong> The subject area you're covering</li>
                            <li><strong>Sections & Subsections:</strong> Organized hierarchical structure</li>
                            <li><strong>Rules & Principles:</strong> Legal doctrines and frameworks</li>
                            <li><strong>Examples:</strong> Hypotheticals and illustrations</li>
                            <li><strong>Practice Problems:</strong> Questions to test understanding</li>
                            <li><strong>Cross-references:</strong> Links to related cases from .bset files</li>
                          </ul>
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

                        <div>
                          <h5 className="font-semibold text-white mb-2">Example use cases:</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>"Contracts: Offer and Acceptance" - detailed module on formation</li>
                            <li>"Torts: Negligence Framework" - comprehensive duty/breach/causation outline</li>
                            <li>"Civil Procedure: Personal Jurisdiction" - step-by-step analysis guide</li>
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
                    <span className="font-semibold">.tbank files (typo-banks)</span>
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
                          <strong>.tbank</strong> (Typo-Bank) files are briefica's format for practice questions and exam preparation materials. 
                          They're your personal question repository for self-testing and exam readiness.
                        </p>

                        <div>
                          <h5 className="font-semibold text-white mb-2">What's in a .tbank file?</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Question Prompts:</strong> Multiple choice, essay, or short answer questions</li>
                            <li><strong>Answer Options:</strong> For multiple choice questions</li>
                            <li><strong>Correct Answers:</strong> The right answer with explanations</li>
                            <li><strong>Detailed Reasoning:</strong> Why the answer is correct (and why others aren't)</li>
                            <li><strong>Difficulty Levels:</strong> Easy, medium, hard categorization</li>
                            <li><strong>Topic Tags:</strong> Link questions to specific subjects or cases</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-white mb-2">When to use .tbank files?</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Creating practice exams for yourself</li>
                            <li>Testing your understanding of course material</li>
                            <li>Building question banks organized by topic</li>
                            <li>Preparing for multiple choice or essay exams</li>
                            <li>Sharing practice questions with study groups</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-white mb-2">Example use cases:</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>"Contracts Midterm Practice" - 50 multiple choice questions on formation and consideration</li>
                            <li>"Torts Essay Hypos" - 10 essay questions with model answers</li>
                            <li>"Civ Pro Multiple Choice" - Subject-specific questions for bar exam prep</li>
                          </ul>
                        </div>

                        <div>
                          <h5 className="font-semibold text-white mb-2">Question Types Supported:</h5>
                          <ul className="list-disc pl-6 space-y-1">
                            <li><strong>Multiple Choice:</strong> 4-5 answer options with explanations</li>
                            <li><strong>True/False:</strong> Simple binary questions</li>
                            <li><strong>Short Answer:</strong> Brief response questions</li>
                            <li><strong>Essay:</strong> Long-form analysis questions with sample answers</li>
                          </ul>
                        </div>
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