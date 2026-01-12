"use client";

import { useState } from "react";

interface FileTypeTutorialProps {
  fileType: "bset" | "bmod" | "tbank";
}

export default function FileTypeTutorial({ fileType }: FileTypeTutorialProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTutorialContent = () => {
    switch (fileType) {
      case "bset":
        return {
          title: "first time downloading a .bset?",
          description: "Imagine an entire law school semester, in a single file. Briefsets are omprehensive collections of case briefs, organized in a structured format with a complete table of contents, case library, and outline builder.",
          steps: [
            {
              number: 1,
              title: "download the .bset",
              content: "Click the download button above to save the .bset to your computer.",
            },
            {
              number: 2,
              title: "move to your /briefsets/ folder",
              content: "DO NOT open the .bset directly. Instead, move the downloaded .bset to the /briefsets/ folder that briefica 6 creates on your desktop when you install it. If you've changed that path since installing, simply move the .bset to your custom folder location.",
            },
            {
              number: 3,
              title: "re-open briefica 6",
              content: "Either launch briefica 6 (if it's closed) or restart the app if it's already open. The .bset should automatically populate, including all authorities in the library, the complete table of contents, and the outline rendered in the outline builder.",
            },
          ],
        };

      case "bmod":
        return {
          title: "First time downloading a .bmod?",
          description: "Brief Modules are structured outlines organized by topic.",
          steps: [
            {
              number: 1,
              title: "Download the file",
              content: "Click the download button above to save the .bmod file to your computer.",
            },
            {
              number: 2,
              title: "Open in briefica 6",
              content: "Launch the briefica desktop app, then open the downloaded .bmod file. You can also double-click the file if briefica is set as the default app.",
            },
            {
              number: 3,
              title: "Study the modules",
              content: "Navigate through the hierarchical outline structure. Modules break down complex topics into digestible sections with rules, examples, and practice problems.",
            },
          ],
        };

      case "tbank":
        return {
          title: "First time downloading a .tbank?",
          description: "Test Banks are collections of practice questions for exam preparation.",
          steps: [
            {
              number: 1,
              title: "Download the file",
              content: "Click the download button above to save the .tbank file to your computer.",
            },
            {
              number: 2,
              title: "Open in briefica 6",
              content: "Launch the briefica desktop app, then open the downloaded .tbank file. You can also double-click the file if briefica is set as the default app.",
            },
            {
              number: 3,
              title: "Practice with questions",
              content: "Work through the practice questions at your own pace. Each question includes detailed explanations to help you understand the correct answers and improve your exam performance.",
            },
          ],
        };

      default:
        return null;
    }
  };

  const tutorial = getTutorialContent();

  if (!tutorial) return null;

  return (
    <div className="border border-white/10 bg-[#1e1e1e] rounded-xl overflow-hidden mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex-1">
          <h3 className="font-semibold text-white mb-1">{tutorial.title}</h3>
          <p className="text-sm text-white/60">{tutorial.description}</p>
        </div>
        <svg
          className={`w-5 h-5 flex-shrink-0 ml-4 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {tutorial.steps.map((step) => (
            <div key={step.number} className="flex gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white"
                style={{ backgroundColor: "#66b2ff" }}
              >
                {step.number}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{step.title}</h4>
                <p className="text-sm text-white/70">{step.content}</p>
              </div>
            </div>
          ))}

          {/* Additional Help Section */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-white/60 mb-2">
              <strong>Don't have briefica 6?</strong>
            </p>
            <button
              onClick={() => window.open("/downloads", "_blank")}
              className="text-sm text-white rounded-lg py-2 px-4 hover:opacity-90 transition-colors"
              style={{ backgroundColor: "#66b2ff" }}
            >
              Download briefica 6
            </button>
          </div>

          <div className="pt-3 border-t border-white/10">
            <p className="text-xs text-white/50">
              Need more help?{" "}
              <button
                onClick={() => window.open("/faq", "_blank")}
                className="text-blue-400 hover:underline"
              >
                Check out our FAQ
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}