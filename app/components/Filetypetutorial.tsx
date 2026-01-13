"use client";

import { useState } from "react";
import Image from "next/image";

interface FileTypeTutorialProps {
  fileType: "bset" | "bmod" | "tbank";
}

export default function FileTypeTutorial({ fileType }: FileTypeTutorialProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTutorialContent = () => {
    switch (fileType) {
      case "bset":
        return {
          icon: "/bset.png",
          title: "first time downloading a briefset? (.bset)",
          description: "Imagine an entire law school semester, in a single file. Briefsets are comprehensive collections of legal authorities, organized in a structured format with a complete authority library, table of contents, and a unique outline build.",
          steps: [
            {
              number: 1,
              title: "download the .bset",
              content: "Click the download button above to save the .bset to your computer.",
            },
            {
              number: 2,
              title: "move to your /briefsets/ folder",
              content: "DO NOT open the .bset directly. Instead, move the downloaded .bset to the /briefsets/ folder that briefica 6 creates on your desktop when you install it. If you've changed that path since installing, move the .bset to your custom folder location.",
            },
            {
              number: 3,
              title: "re-open briefica",
              content: "Either launch briefica 6 (if it's closed) or restart the app if it's already open. The .bset should automatically populate, including all authorities in the library, the complete table of contents, and the outline rendered in the outline builder.",
            },
          ],
        };

      case "bmod":
        return {
          icon: "/bmod.png",
          title: "first time downloading a modification? (.bmod)",
          description: "With briefica, users can share customizable color palettes as functional accessories for their outline builds.",
          steps: [
            {
              number: 1,
              title: "download the .bmod",
              content: "Click the download button above to save the .bmod file to your computer.",
            },
            {
              number: 2,
              title: "move to your /mods/ folder",
              content: "DO NOT open the .bmod directly. Instead, move it to the /briefsets/ folder created on your desktop. If you modified the destination during setup, locate the 'mods' folder within your custom /briefsets/ path.",
            },
            {
              number: 3,
              title: "apply the mod in the app",
              content: "In briefica, click the 'mods' button. From here, click, 'import preset', and select the mod. NOTE: The caution prompt will read 'Are you sure? All bold/italic/underline formatting will be lost.' This is FALSE. Applying mods should NOT change your formatting.",
            },
          ],
        };

      case "tbank":
        return {
          icon: "/b_blank.png",
          title: "first time downloading a typobank? (.tbank)",
          description: "Typobanks serve as your own personal spell-check. In law, words are spelled funny, and commerical spell-checks may not always pick on student's mistakes. With typobanks, you can keep a literal bank of your typos.",
          steps: [
            {
              number: 1,
              title: "download the .tbank",
              content: "Click the download button above to save the .tbank file to your computer.",
            },
            {
              number: 2,
              title: "move to /briefsets/ folder",
              content: "DO NOT open the .tbank directly. Instead, move it to the /briefsets/ folder created on your desktop. If you modified the destination during setup, locate the 'typobank' folder within your custom /briefsets/ path.",
            },
            {
              number: 3,
              title: "import the typobank in the app",
              content: "In briefica, click the 'typobank' button and select 'import .tbank'. Navigate to where you saved the .tbank, and import.",
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
        <div className="flex items-center gap-3 flex-1">
          {/* Icon */}
          <Image
            src={tutorial.icon}
            alt={`${fileType} icon`}
            width={40}
            height={40}
            className="flex-shrink-0"
          />
          {/* Text content */}
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">{tutorial.title}</h3>
            <p className="text-sm text-white/60">{tutorial.description}</p>
          </div>
        </div>
        {/* Dropdown arrow */}
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
              <strong>Don't have briefica?</strong>
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