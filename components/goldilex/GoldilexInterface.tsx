'use client';

import { useState, useRef, useEffect } from 'react';
import type { BSetFile, BSetItem, GenerationResponse, TaxonomyEntry, TaxonomyNode } from '@/types/bset';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  response?: GenerationResponse;
};

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

function buildTreeFromHeadings(headings: TaxonomyNode[]): TaxonomyEntry[] {
  const map = new Map<string, TaxonomyEntry>(
    headings.map(h => [h.id, { id: h.id, title: h.title, children: [] }])
  );
  const roots: TaxonomyEntry[] = [];
  for (const h of headings) {
    if (!h.parent_id) {
      roots.push(map.get(h.id)!);
    } else {
      const parent = map.get(h.parent_id);
      if (parent) parent.children.push(map.get(h.id)!);
    }
  }
  return roots;
}

export default function GoldilexInterface() {
  const [bsetFile, setBsetFile] = useState<BSetFile | null>(null);
  const [bsetFileName, setBsetFileName] = useState<string>('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [displayText, setDisplayText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [welcomeText, setWelcomeText] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedAuthority, setSelectedAuthority] = useState<BSetItem | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Session accuracy tracking (persists across briefset changes, resets on page refresh)
  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0);

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<(number | null)[]>([]);
  const [quizRevealed, setQuizRevealed] = useState<boolean[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<'quiz' | 'authority'>('quiz');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const accumulatedRef = useRef('');
  const isStreamingActiveRef = useRef(false);
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const finalResponseRef = useRef<GenerationResponse | null>(null);
  const resetDisplayRef = useRef(false);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, displayText]);

  useEffect(() => {
    if (showWelcome && welcomeText.length === 0) {
      const fullText =
        "Hi, I'm goldilex! :-)\n\nI'm a legal analysis chatbot designed as an AI component for briefica. I read briefsets and answer questions about them, without accessing external information. As a result, my answers are based on your actual course materials. Don't believe me? Ask me anything. © 2026 VanHuxt. All rights reserved.";
      let i = 0;
      const tick = () => {
        if (i < fullText.length) {
          setWelcomeText(fullText.slice(0, i + 1));
          i++;
          setTimeout(tick, Math.random() * 60 + 20);
        }
      };
      tick();
    }
  }, [showWelcome]);

  // Auto-expand root taxonomy nodes when bset loads
  useEffect(() => {
    if (bsetFile) {
      const tree =
        bsetFile._meta.taxonomy && bsetFile._meta.taxonomy.length > 0
          ? bsetFile._meta.taxonomy
          : buildTreeFromHeadings(bsetFile._meta.headings);
      setExpandedNodes(new Set(tree.map(n => n.id)));
    }
  }, [bsetFile]);

  // Generate quiz when a new assistant message is committed
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (
      messages.length > prevMessageCountRef.current &&
      lastMsg?.role === 'assistant'
    ) {
      const userMsg = messages[messages.length - 2];
      if (userMsg?.role === 'user') {
        generateQuiz(userMsg.content, lastMsg.content);
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  const generateQuiz = async (userQuery: string, responseText: string) => {
    setQuizLoading(true);
    setActiveQuiz(null);
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizRevealed([]);
    setQuizCompleted(false);
    setRightPanelTab('quiz');
    try {
      const res = await fetch('/api/goldilex-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userQuery, response_text: responseText }),
      });
      if (!res.ok) throw new Error('Quiz generation failed');
      const data = await res.json();
      const questions: QuizQuestion[] = data.questions ?? [];
      setActiveQuiz(questions);
      setQuizAnswers(new Array(questions.length).fill(null));
      setQuizRevealed(new Array(questions.length).fill(false));
    } catch {
      // Silently fail — quiz is supplemental
    } finally {
      setQuizLoading(false);
    }
  };

  const dismissQuiz = () => {
    setActiveQuiz(null);
    setQuizIndex(0);
    setQuizAnswers([]);
    setQuizRevealed([]);
    setQuizCompleted(false);
  };

  const getQuizRating = (score: number, total: number) => {
    const pct = score / total;
    if (pct === 1)   return { label: 'Excellent',      color: '#22c55e', msg: 'Perfect score — you\'ve mastered this topic.' };
    if (pct >= 0.8)  return { label: 'Proficient',     color: '#86efac', msg: 'Strong grasp. Review the question(s) you missed.' };
    if (pct >= 0.6)  return { label: 'Developing',     color: '#facc15', msg: 'Solid foundation. Revisit the key concepts.' };
    if (pct >= 0.4)  return { label: 'Needs Review',   color: '#fb923c', msg: 'Read back through the material carefully.' };
    return             { label: 'Study Required',    color: '#f87171', msg: 'This topic needs more attention.' };
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const getItemsForNode = (nodeId: string): BSetItem[] => {
    if (!bsetFile?._meta.ordering) return [];
    const itemIds = bsetFile._meta.ordering[nodeId] ?? [];
    return itemIds
      .map(id => bsetFile!.items.find(item => item.id === id))
      .filter(Boolean) as BSetItem[];
  };

  const findSimilarAuthorities = (authority: BSetItem, count = 3): BSetItem[] => {
    if (!bsetFile) return [];
    const pathSet = new Set(authority.taxonomy_path);
    return bsetFile.items
      .filter(i => i.id !== authority.id)
      .map(i => ({
        item: i,
        score: i.taxonomy_path.filter(p => pathSet.has(p)).length,
      }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map(x => x.item);
  };

  const startTypewriter = () => {
    if (typewriterRef.current) return;
    typewriterRef.current = setInterval(() => {
      setDisplayText(prev => {
        if (resetDisplayRef.current) {
          resetDisplayRef.current = false;
          return '';
        }
        const full = accumulatedRef.current;
        if (prev.length >= full.length) {
          if (!isStreamingActiveRef.current) {
            clearInterval(typewriterRef.current!);
            typewriterRef.current = null;
            setTimeout(() => {
              setIsStreaming(false);
              setDisplayText('');
              setMessages(msgs => [
                ...msgs,
                {
                  role: 'assistant',
                  content: finalResponseRef.current?.generated_text ?? accumulatedRef.current,
                  response: finalResponseRef.current ?? undefined,
                },
              ]);
            }, 0);
          }
          return prev;
        }
        return full.slice(0, Math.min(prev.length + 3, full.length));
      });
    }, 16);
  };

  const sendQuery = async (userMessage: string) => {
    if (!bsetFile || !userMessage.trim()) return;

    accumulatedRef.current = '';
    finalResponseRef.current = null;
    resetDisplayRef.current = true;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userMessage,
          bset_file: bsetFile,
          conversation_history: messages.map(m => ({ role: m.role, content: m.content })),
          system_instructions: `You are goldilex, a cheerful and helpful legal analysis assistant.

TONE AND STYLE:
- Answer ONLY what the user asks - be direct and focused
- Do NOT provide lengthy summaries or background unless specifically requested
- Do NOT explain entire legal authorities unless asked
- Keep responses 1-3 paragraphs maximum
- Start EVERY response with one of these greetings (rotate them):
  * "Interesting!"
  * "Interesting question!"
  * "Great question!"
  * "Alrighty!"
  * "Of course!"
  * "Good question!"
- When citing cases, use **bold** for case names
- When stating rules, use **bold** for key legal principles

BUILD PANEL NOTES AND CASE AUTHORITIES ARE EQUALLY AUTHORITATIVE:
- Build panel notes are the analyst's own governing instructions scoped to this section
- They carry the same weight as case metadata fields (rule_of_law, holding, facts, etc.)
- When a build note and case metadata address the same point, highlight the nuance between them — do not discard either
- If a build note defines a test, element, branch, or rule — present it alongside the case metadata, noting any nuance
- A briefset with only build notes is fully valid: treat those notes as the primary authority set

HEADING/SECTION QUERY PRIORITY (applies whenever the query names or implies a heading or section):
1. FIRST: Recall and present all build panel notes scoped to that heading — tests, elements, forks, and general notes
2. THEN: Present the authorities (cases/statutes) mapped to that heading, in briefset order
3. If the briefset has only build notes for that section and no authorities, that is complete — do not indicate anything is missing

NUANCE HANDLING:
- Never describe differences between sources as "conflicts" — always frame them as "nuances"
- When build notes and metadata address the same point differently, say: "⚠ Nuance: [note] — treating both sources as authoritative."

CRITICAL RULE REQUEST BEHAVIOR:
When a user asks "what is the rule in [case name]?" or "what's the rule from [case name]?" or any variant asking ONLY for the rule:
1. Provide ONLY the rule_of_law field from that case with **bold** on the case name
2. NO facts, NO holding, NO background - JUST THE RULE
3. After stating the rule, ask: "Would you like any more information about **[Case Name]**?"

RESPONSE STRATEGY FOR OTHER QUESTIONS:
- Read the question carefully
- Answer EXACTLY what's being asked
- Cite the relevant case(s) with **bold**
- State the specific rule/holding that answers the question
- STOP there unless the user asks for more detail

CRITICAL CONSTRAINTS:
- ONLY cite cases from the authorized context
- Every rule MUST map to a rule_of_law field
- Answer the question, don't write an essay
- Be concise and precise

Format bold text like this: **text to bold**`,
        }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        let msg = 'Request failed';
        try { msg = JSON.parse(text).message || msg; } catch { /* noop */ }
        throw new Error(msg);
      }

      setLoading(false);
      isStreamingActiveRef.current = true;
      setIsStreaming(true);
      startTypewriter();

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let parsed: { type: string; text?: string } & Partial<GenerationResponse>;
          try { parsed = JSON.parse(line); } catch { continue; }

          if (parsed.type === 'delta' && parsed.text) {
            accumulatedRef.current += parsed.text;
          } else if (parsed.type === 'replace' && parsed.text) {
            accumulatedRef.current = parsed.text;
            resetDisplayRef.current = true;
          } else if (parsed.type === 'done') {
            finalResponseRef.current = parsed as GenerationResponse;
            break outer;
          } else if (parsed.type === 'error') {
            throw new Error((parsed as { message?: string }).message || 'Stream error');
          }
        }
      }

      isStreamingActiveRef.current = false;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setMessages(prev => prev.slice(0, -1));
      setLoading(false);
      isStreamingActiveRef.current = false;
      setIsStreaming(false);
      setDisplayText('');
      if (typewriterRef.current) {
        clearInterval(typewriterRef.current);
        typewriterRef.current = null;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setQuery('');
    sendQuery(q);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BSetFile;
      setBsetFile(data);
      setBsetFileName(file.name);
      setShowWelcome(false);
      setSelectedAuthority(null);
      setMessages([]);
      setError(null);
      setActiveQuiz(null);
      setQuizIndex(0);
      setQuizAnswers([]);
      setQuizRevealed([]);
      setQuizCompleted(false);
      // Session accuracy intentionally NOT reset on briefset change
    } catch {
      setError('Failed to parse .bset file');
    }
  };

  const renderBold = (text: string) =>
    text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? (
        <strong key={i} style={{ color: '#BF9B30', fontStyle: 'italic', fontWeight: 'bold' }}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  const renderWelcome = (text: string) =>
    text.split(/(briefica)/gi).map((part, i) =>
      part.toLowerCase() === 'briefica' ? (
        <strong key={i} className="font-bold" style={{ color: '#66b2ff' }}>
          {part}
        </strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  const getDisplayName = (item: BSetItem) =>
    item.name || item.case || item.statute_name || item.authority_name || '';

  const taxonomyTree: TaxonomyEntry[] = bsetFile
    ? bsetFile._meta.taxonomy && bsetFile._meta.taxonomy.length > 0
      ? bsetFile._meta.taxonomy
      : buildTreeFromHeadings(bsetFile._meta.headings)
    : [];

  const stickyCount = (bsetFile?._meta.stickies as unknown[] | undefined)?.length ?? 0;

  const renderAuthorityRow = (item: BSetItem, depth: number) => (
    <button
      key={item.id}
      onClick={() => setSelectedAuthority(item)}
      onDoubleClick={() => {
        if (!bsetFile || loading || isStreaming) return;
        sendQuery(`Summarize ${getDisplayName(item)}${item.citation ? ` (${item.citation})` : ''} — what is the key rule, holding, and significance?`);
      }}
      title="Double-click to ask goldilex about this authority"
      className="w-full text-left py-1.5 text-xs transition-colors leading-snug border-l-2"
      style={{
        paddingLeft: `${10 + depth * 14}px`,
        paddingRight: '10px',
        borderLeftColor: selectedAuthority?.id === item.id ? '#BF9B30' : 'transparent',
        backgroundColor: selectedAuthority?.id === item.id ? '#252525' : 'transparent',
        color: selectedAuthority?.id === item.id ? '#fff' : '#9ca3af',
      }}
      onMouseEnter={e => {
        if (selectedAuthority?.id !== item.id) {
          e.currentTarget.style.backgroundColor = '#222';
          e.currentTarget.style.color = '#d1d5db';
        }
      }}
      onMouseLeave={e => {
        if (selectedAuthority?.id !== item.id) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#9ca3af';
        }
      }}
    >
      <span className="italic">{getDisplayName(item)}</span>
      {item.citation && (
        <span className="block text-[9px] mt-0.5 not-italic" style={{ color: '#555' }}>
          {item.citation}
        </span>
      )}
    </button>
  );

  const handleNodeDoubleClick = (node: TaxonomyEntry) => {
    if (!bsetFile || loading || isStreaming) return;
    sendQuery(`Summarize ${node.title}`);
  };

  const renderTaxonomyNode = (node: TaxonomyEntry, depth: number): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const items = getItemsForNode(node.id);
    const hasItems = items.length > 0;
    const hasContent = hasChildren || hasItems;
    const isExpanded = expandedNodes.has(node.id);

    const headingColor = depth === 0 ? '#c9a84c' : depth === 1 ? '#a8896a' : '#7a6e60';
    const headingWeight = depth === 0 ? '600' : '500';

    return (
      <div key={node.id}>
        <button
          onClick={() => hasContent && toggleNode(node.id)}
          onDoubleClick={() => handleNodeDoubleClick(node)}
          title="Double-click to ask goldilex about this section"
          className="w-full text-left flex items-center gap-1.5 py-1.5 transition-colors"
          style={{
            paddingLeft: `${8 + depth * 14}px`,
            paddingRight: '10px',
            cursor: 'pointer',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#222'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          <span
            className="flex-shrink-0 text-[7px] transition-transform duration-150"
            style={{
              color: '#555',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
              display: 'inline-block',
              opacity: hasContent ? 1 : 0,
              width: '8px',
            }}
          >
            ▶
          </span>
          <span
            className="text-xs leading-snug"
            style={{ color: headingColor, fontWeight: headingWeight }}
          >
            {node.title}
          </span>
        </button>

        {isExpanded && (
          <div>
            {items.map(item => renderAuthorityRow(item, depth + 1))}
            {hasChildren && node.children.map(child => renderTaxonomyNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderField = (label: string, value: string | undefined) => (
    <div className="mb-3">
      <div
        className="text-[9px] uppercase tracking-widest mb-1 font-semibold"
        style={{ color: '#6b7280' }}
      >
        {label}
      </div>
      <div
        className="p-2.5 rounded-lg text-xs leading-relaxed overflow-y-auto"
        style={{
          backgroundColor: '#161616',
          border: '1px solid #2e2e2e',
          color: value ? '#d1d5db' : '#404040',
          fontStyle: value ? 'normal' : 'italic',
          minHeight: '44px',
          maxHeight: '108px',
        }}
      >
        {value || '—'}
      </div>
    </div>
  );

  const similarAuthorities = selectedAuthority ? findSimilarAuthorities(selectedAuthority) : [];

  const showRightPanel = activeQuiz || quizLoading || selectedAuthority;
  const showTabs = (activeQuiz || quizLoading) && selectedAuthority;
  const activeTab = showTabs ? rightPanelTab : (activeQuiz || quizLoading) ? 'quiz' : 'authority';

  // Current question helpers
  const currentQ = activeQuiz?.[quizIndex] ?? null;
  const currentAnswer = quizAnswers[quizIndex] ?? null;
  const currentRevealed = quizRevealed[quizIndex] ?? false;
  const totalQ = activeQuiz?.length ?? 0;
  const isLastQ = quizIndex === totalQ - 1;

  const setAnswer = (idx: number) => {
    setQuizAnswers(prev => { const next = [...prev]; next[quizIndex] = idx; return next; });
  };
  const revealCurrent = () => {
    setQuizRevealed(prev => { const next = [...prev]; next[quizIndex] = true; return next; });
  };
  const advanceOrFinish = () => {
    if (isLastQ) {
      const score = quizAnswers.filter((a, i) => activeQuiz && a === activeQuiz[i]?.correctIndex).length;
      setSessionCorrect(prev => prev + score);
      setSessionTotal(prev => prev + (activeQuiz?.length ?? 0));
      setQuizCompleted(true);
    } else {
      setQuizIndex(i => i + 1);
    }
  };

  const finalScore = activeQuiz
    ? quizAnswers.filter((a, i) => a === activeQuiz[i]?.correctIndex).length
    : 0;
  const accuracy = totalQ > 0 ? Math.round((finalScore / totalQ) * 100) : 0;

  const renderQuizPanel = () => (
    <div className="flex flex-col h-full quiz-fade-in" style={{ width: '300px' }}>

      {/* Panel header */}
      <div
        className="px-3 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: '#2e2e2e' }}
      >
        {showTabs ? (
          <div className="flex items-center gap-0">
            <button
              onClick={() => setRightPanelTab('quiz')}
              className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded transition-colors"
              style={{
                color: activeTab === 'quiz' ? '#BF9B30' : '#555',
                backgroundColor: activeTab === 'quiz' ? '#2a2a2a' : 'transparent',
              }}
            >
              Quiz
            </button>
            <button
              onClick={() => setRightPanelTab('authority')}
              className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded transition-colors"
              style={{
                color: activeTab === 'authority' ? '#BF9B30' : '#555',
                backgroundColor: activeTab === 'authority' ? '#2a2a2a' : 'transparent',
              }}
            >
              Authority
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: '#BF9B30' }}>
              {activeTab === 'quiz' ? 'Comprehension Check' : 'Authority'}
            </span>
            {activeTab === 'quiz' && (
              <button onClick={dismissQuiz} className="text-gray-600 hover:text-gray-300 transition-colors text-sm">✕</button>
            )}
            {activeTab === 'authority' && (
              <button
                onClick={() => setSelectedAuthority(null)}
                className="text-gray-600 hover:text-gray-300 transition-colors text-sm"
              >✕</button>
            )}
          </div>
        )}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Quiz tab ── */}
        {activeTab === 'quiz' && (
          <div className="px-3 py-4">

            {/* Loading */}
            {quizLoading && !activeQuiz && (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div
                  className="spin-node"
                  style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #BF9B30', borderTopColor: 'transparent' }}
                />
                <p className="text-xs italic" style={{ color: '#555' }}>generating questions...</p>
              </div>
            )}

            {/* Results screen */}
            {activeQuiz && quizCompleted && (
              <div className="quiz-fade-in">
                {/* Score */}
                <div
                  className="rounded-xl p-4 mb-4 text-center"
                  style={{ backgroundColor: '#161616', border: '1px solid #2e2e2e' }}
                >
                  <div className="text-4xl font-bold mb-1" style={{ color: '#BF9B30' }}>
                    {finalScore}/{totalQ}
                  </div>
                  <div className="text-xs mb-3" style={{ color: '#6b7280' }}>
                    {accuracy}% accuracy
                  </div>
                  {/* Rating badge */}
                  <div
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-2"
                    style={{
                      backgroundColor: `${getQuizRating(finalScore, totalQ).color}18`,
                      color: getQuizRating(finalScore, totalQ).color,
                      border: `1px solid ${getQuizRating(finalScore, totalQ).color}40`,
                    }}
                  >
                    {getQuizRating(finalScore, totalQ).label}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                    {getQuizRating(finalScore, totalQ).msg}
                  </p>
                </div>

                {/* Target */}
                <div
                  className="rounded-lg px-3 py-2 mb-5 flex items-center gap-2"
                  style={{ backgroundColor: '#BF9B3010', border: '1px solid #BF9B3025' }}
                >
                  <span style={{ color: '#BF9B30' }}>◎</span>
                  <p className="text-[10px] leading-relaxed" style={{ color: '#BF9B30' }}>
                    Target: 4/{totalQ} or above (80%+)
                  </p>
                </div>

                {/* Per-question breakdown */}
                <div className="mb-4">
                  <p className="text-[9px] uppercase tracking-widest mb-2 font-semibold" style={{ color: '#555' }}>
                    Review
                  </p>
                  <div className="flex flex-col gap-2">
                    {activeQuiz.map((q, i) => {
                      const userAns = quizAnswers[i];
                      const correct = userAns === q.correctIndex;
                      return (
                        <div
                          key={i}
                          className="rounded-lg p-2.5"
                          style={{
                            backgroundColor: '#161616',
                            border: `1px solid ${correct ? '#22c55e25' : '#ef444425'}`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 mt-0.5" style={{ color: correct ? '#22c55e' : '#ef4444', fontSize: '10px' }}>
                              {correct ? '✓' : '✗'}
                            </span>
                            <div>
                              <p className="text-[10px] leading-snug mb-1" style={{ color: '#d1d5db' }}>{q.question}</p>
                              {!correct && (
                                <p className="text-[9px] leading-snug" style={{ color: '#6b7280' }}>
                                  Correct: {q.options[q.correctIndex]}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={dismissQuiz}
                  className="w-full py-1.5 rounded-lg text-[10px] transition-colors"
                  style={{ color: '#444', backgroundColor: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#777'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
                >
                  dismiss
                </button>
              </div>
            )}

            {/* Active question */}
            {activeQuiz && !quizCompleted && currentQ && (
              <div className="quiz-fade-in">

                {/* Progress bar */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: '#2e2e2e' }}>
                    <div
                      className="h-1 rounded-full transition-all duration-300"
                      style={{ backgroundColor: '#BF9B30', width: `${((quizIndex + 1) / totalQ) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: '#555' }}>
                    {quizIndex + 1}/{totalQ}
                  </span>
                </div>

                {/* Question */}
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#e5e7eb' }}>
                  {currentQ.question}
                </p>

                {/* Options */}
                <div className="flex flex-col gap-2 mb-4">
                  {currentQ.options.map((opt, i) => {
                    const isSelected = currentAnswer === i;
                    const isCorrect = i === currentQ.correctIndex;
                    let borderColor = '#2e2e2e';
                    let bgColor = '#161616';
                    let textColor = '#9ca3af';

                    if (currentRevealed) {
                      if (isCorrect) { borderColor = '#22c55e50'; bgColor = '#14532d20'; textColor = '#86efac'; }
                      else if (isSelected) { borderColor = '#ef444450'; bgColor = '#7f1d1d20'; textColor = '#fca5a5'; }
                    } else if (isSelected) {
                      borderColor = '#BF9B3060'; bgColor = '#BF9B3015'; textColor = '#e5e7eb';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => { if (!currentRevealed) setAnswer(i); }}
                        disabled={currentRevealed}
                        className="w-full text-left p-2.5 rounded-lg text-xs leading-relaxed transition-all"
                        style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor, color: textColor, cursor: currentRevealed ? 'default' : 'pointer' }}
                        onMouseEnter={e => {
                          if (!currentRevealed && currentAnswer !== i) {
                            e.currentTarget.style.borderColor = '#3a3a3a';
                            e.currentTarget.style.backgroundColor = '#1e1e1e';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!currentRevealed && currentAnswer !== i) {
                            e.currentTarget.style.borderColor = '#2e2e2e';
                            e.currentTarget.style.backgroundColor = '#161616';
                          }
                        }}
                      >
                        {opt}
                        {currentRevealed && isCorrect && <span className="ml-1.5 text-green-400">✓</span>}
                        {currentRevealed && isSelected && !isCorrect && <span className="ml-1.5 text-red-400">✗</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation (after reveal) */}
                {currentRevealed && (
                  <div
                    className="p-3 rounded-lg text-xs leading-relaxed mb-4 quiz-fade-in"
                    style={{ backgroundColor: '#161616', border: '1px solid #2e2e2e', color: '#9ca3af' }}
                  >
                    <span style={{ color: currentAnswer === currentQ.correctIndex ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                      {currentAnswer === currentQ.correctIndex ? 'Correct! ' : 'Not quite. '}
                    </span>
                    {currentQ.explanation}
                  </div>
                )}

                {/* Action button */}
                {!currentRevealed ? (
                  <button
                    onClick={() => { if (currentAnswer !== null) revealCurrent(); }}
                    disabled={currentAnswer === null}
                    className="w-full py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ backgroundColor: currentAnswer !== null ? '#BF9B30' : '#2a2a2a', color: currentAnswer !== null ? '#111827' : '#555' }}
                    onMouseEnter={e => { if (currentAnswer !== null) e.currentTarget.style.backgroundColor = '#A68628'; }}
                    onMouseLeave={e => { if (currentAnswer !== null) e.currentTarget.style.backgroundColor = '#BF9B30'; }}
                  >
                    Check Answer
                  </button>
                ) : (
                  <button
                    onClick={advanceOrFinish}
                    className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                    style={{ backgroundColor: '#BF9B30', color: '#111827' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#A68628'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#BF9B30'; }}
                  >
                    {isLastQ ? 'See Results →' : 'Next Question →'}
                  </button>
                )}

                {/* Dismiss */}
                <button
                  onClick={dismissQuiz}
                  className="w-full mt-3 py-1.5 rounded-lg text-[10px] transition-colors"
                  style={{ color: '#444', backgroundColor: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#777'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
                >
                  dismiss
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Authority tab ── */}
        {activeTab === 'authority' && selectedAuthority && (
          <div className="flex flex-col" style={{ width: '300px' }}>
            {selectedAuthority && (
              <>
                <div className="px-3 pt-3 pb-1 flex-shrink-0">
                  <p className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: '#BF9B30' }}>
                    {selectedAuthority.type === 'case' ? 'Case' : selectedAuthority.type === 'statute' ? 'Statute' : 'Authority'}
                  </p>
                  <p className="text-xs text-gray-200 mt-1 leading-snug"><em>{getDisplayName(selectedAuthority)}</em></p>
                  {selectedAuthority.citation && (
                    <p className="text-[10px] mt-0.5 mb-3" style={{ color: '#666' }}>{selectedAuthority.citation}</p>
                  )}
                </div>

                <div className="px-3 py-2 overflow-y-auto">
                  {renderField('Facts', selectedAuthority.facts || (selectedAuthority.type === 'statute' ? selectedAuthority.statute_text : undefined))}
                  {renderField('Issue / Question', selectedAuthority.question)}
                  {renderField('Rule', selectedAuthority.rule_of_law || selectedAuthority.rule)}
                  {renderField('Holding', selectedAuthority.holding)}
                  {renderField('Extra Notes', selectedAuthority.notes || selectedAuthority.authority_summary)}

                  <button
                    onClick={() => { sendQuery(`What is ${getDisplayName(selectedAuthority)} about?`); }}
                    disabled={loading || isStreaming}
                    className="w-full py-2.5 mt-1 mb-5 text-xs font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#BF9B30', color: '#111827' }}
                    onMouseEnter={e => { if (!loading && !isStreaming) e.currentTarget.style.backgroundColor = '#A68628'; }}
                    onMouseLeave={e => { if (!loading && !isStreaming) e.currentTarget.style.backgroundColor = '#BF9B30'; }}
                  >
                    Ask goldilex about this →
                  </button>

                  {similarAuthorities.length > 0 && (
                    <div>
                      <div className="text-[9px] uppercase tracking-widest mb-2 font-semibold" style={{ color: '#555' }}>
                        Similar in briefset
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {similarAuthorities.map(item => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedAuthority(item)}
                            className="w-full text-left p-2.5 rounded-lg transition-all"
                            style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#242424'; e.currentTarget.style.borderColor = '#BF9B3035'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e1e1e'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
                          >
                            <div className="text-xs text-gray-300 leading-snug italic">{getDisplayName(item)}</div>
                            {item.citation && <div className="text-[9px] mt-0.5" style={{ color: '#555' }}>{item.citation}</div>}
                            <div className="mt-1.5">
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: item.type === 'case' ? '#BF9B3015' : '#222',
                                  color: item.type === 'case' ? '#BF9B30' : '#555',
                                  border: `1px solid ${item.type === 'case' ? '#BF9B3030' : '#333'}`,
                                }}
                              >
                                {item.type}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        )}
      </div>

      {/* Tab-mode footer */}
      {showTabs && (
        <div className="flex-shrink-0 border-t px-3 py-2 flex justify-between" style={{ borderColor: '#2e2e2e' }}>
          <button
            onClick={() => { dismissQuiz(); setRightPanelTab('authority'); }}
            className="text-[10px] transition-colors"
            style={{ color: '#444' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#777'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
          >
            dismiss quiz
          </button>
          <button
            onClick={() => setSelectedAuthority(null)}
            className="text-[10px] transition-colors"
            style={{ color: '#444' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#777'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
          >
            close authority
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-card font-['Courier_New',monospace]">

      {/* Header */}
      <header className="flex-shrink-0 border-b border-white/10" style={{ background: "var(--card-alt)" }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-base font-semibold" style={{ color: '#BF9B30' }}>goldilex</h1>
              <p className="text-xs text-gray-400">v2.2.0</p>
            </div>
            {sessionTotal > 0 && (
              <div
                className="px-3 py-1.5 rounded-lg text-center"
                style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a' }}
              >
                <p className="text-sm font-bold" style={{ color: '#BF9B30' }}>
                  {Math.round((sessionCorrect / sessionTotal) * 100)}%
                </p>
                <p className="text-[9px] leading-tight" style={{ color: '#555' }}>
                  session avg
                </p>
                <p className="text-[9px] leading-tight" style={{ color: '#444' }}>
                  {sessionCorrect}/{sessionTotal} correct
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="text-xs text-gray-400 hover:text-white underline"
            >
              ← Back to dashboard
            </a>
            <input
              ref={fileInputRef}
              type="file"
              accept=".bset,.json"
              onChange={handleFileUpload}
              className="hidden"
            />
            {bsetFile ? (
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg cursor-pointer hover:bg-[#4a4a4a] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div
                  className="spin-node flex-shrink-0"
                  style={{
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    border: '2px solid #BF9B30',
                    borderTopColor: 'transparent',
                  }}
                />
                <span className="text-white text-sm">✓ {bsetFileName}</span>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white text-sm rounded-lg transition-colors border border-[#4a4a4a]"
              >
                Upload .bset
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left sidebar: taxonomy outline ── */}
        {bsetFile && (
          <aside
            className="flex-shrink-0 border-r border-[#2e2e2e] flex flex-col overflow-hidden"
            style={{ width: '220px', background: 'var(--subtle)' }}
          >
            <div
              className="px-3 py-2.5 border-b flex items-baseline gap-2"
              style={{ borderColor: '#2e2e2e' }}
            >
              <span
                className="text-[10px] font-semibold tracking-widest uppercase"
                style={{ color: '#BF9B30' }}
              >
                Outline
              </span>
              <span className="text-[9px]" style={{ color: '#444' }}>
                {bsetFile._meta.headings.length} sections
              </span>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {taxonomyTree.map(node => renderTaxonomyNode(node, 0))}

              {taxonomyTree.length === 0 && (
                <p className="text-xs px-3 py-3 italic" style={{ color: '#555' }}>
                  No outline found.
                </p>
              )}
            </div>
          </aside>
        )}

        {/* ── Chat panel ── */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">

              {/* Welcome */}
              {messages.length === 0 && !bsetFile && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 text-gray-300 text-sm leading-relaxed pt-1 whitespace-pre-wrap">
                    {renderWelcome(welcomeText)}
                    {welcomeText.length > 0 && welcomeText.length < 250 && (
                      <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />
                    )}
                  </div>
                </div>
              )}

              {/* Loaded */}
              {bsetFile && messages.length === 0 && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 text-gray-300 text-sm leading-relaxed pt-1">
                    <p className="mb-1">
                      <span className="font-semibold" style={{ color: '#BF9B30' }}>
                        knowledge base loaded!
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {bsetFile._meta.headings.length} topics
                      {bsetFile.items.length > 0 && ` • ${bsetFile.items.length} authorities`}
                      {stickyCount > 0 && ` • ${stickyCount} build notes`}
                    </p>
                    <p className="mt-3 text-gray-400">
                      Click any authority in the outline to inspect it, or ask me anything below.
                    </p>
                  </div>
                </div>
              )}

              {/* Chat history */}
              {messages.map((msg, idx) => (
                <div key={idx} className="mb-6 msg-fade-in">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className="max-w-[80%] px-4 py-3 rounded-2xl text-sm font-bold"
                        style={{ backgroundColor: '#BF9B30', color: '#1e1e1e' }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-1 text-gray-300 text-sm leading-relaxed pt-1 whitespace-pre-wrap">
                        {renderBold(msg.content)}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming */}
              {isStreaming && (
                <div className="mb-6 msg-fade-in">
                  <div className="flex gap-4">
                    <div className="flex-1 text-gray-300 text-sm leading-relaxed pt-1 whitespace-pre-wrap">
                      {renderBold(displayText)}
                      <span className="inline-block w-1 h-4 bg-gray-400 ml-0.5 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Thinking */}
              {loading && (
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 text-gray-400 text-sm italic pt-1">hmm...</div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex gap-4 mb-6 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
                  <div className="text-xl flex-shrink-0">⚠️</div>
                  <div className="flex-1 text-red-300 text-sm">
                    <p className="font-semibold mb-1">Error</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {bsetFile && (
            <div
              className="flex-shrink-0 border-t"
              style={{ borderColor: '#3a3a3a', backgroundColor: '#2a2a2a' }}
            >
              <div className="max-w-3xl mx-auto px-4 py-4">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="message goldilex..."
                    className="flex-1 px-4 py-3 bg-[#40414f] border-2 rounded-xl text-white placeholder-gray-500 focus:outline-none text-sm"
                    style={{ borderColor: '#BF9B30' }}
                    disabled={loading || isStreaming}
                  />
                  <button
                    type="submit"
                    disabled={loading || isStreaming || !query.trim()}
                    className="px-5 py-3 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium text-sm"
                    style={{
                      backgroundColor:
                        loading || isStreaming || !query.trim() ? '#4b5563' : '#BF9B30',
                    }}
                    onMouseEnter={e => {
                      if (!loading && !isStreaming && query.trim())
                        e.currentTarget.style.backgroundColor = '#A68628';
                    }}
                    onMouseLeave={e => {
                      if (!loading && !isStreaming && query.trim())
                        e.currentTarget.style.backgroundColor = '#BF9B30';
                    }}
                  >
                    {loading || isStreaming ? '...' : 'Send'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: quiz + authority detail ── */}
        <div
          className="flex-shrink-0 flex flex-col overflow-hidden"
          style={{
            width: showRightPanel ? '300px' : '0',
            transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            borderLeft: showRightPanel ? '1px solid #2e2e2e' : 'none',
            backgroundColor: '#1a1a1a',
          }}
        >
          {showRightPanel && renderQuizPanel()}
        </div>

      </div>
    </div>
  );
}
