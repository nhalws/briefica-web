"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";

interface Message {
  id: string;
  username: string;
  message: string;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
  school_name: string;
}

interface LiveChatProps {
  currentUserId: string;
  username: string;
  userSchool: string | null;
  large?: boolean; // Optional prop for larger version on school page
}

export default function LiveChat({ currentUserId, username, userSchool, large = false }: LiveChatProps) {
  const [isJoined, setIsJoined] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("main");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [userSubjects, setUserSubjects] = useState<Subject[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's subject preferences
  useEffect(() => {
    async function loadUserSubjects() {
      const { data: preferences } = await supabase
        .from("user_subject_preferences")
        .select("subject_id, subjects(*)")
        .eq("user_id", currentUserId);

      if (preferences) {
        const subjects = preferences
          .map((p: any) => p.subjects)
          .filter(Boolean);
        setUserSubjects(subjects);
      }
    }

    loadUserSubjects();
  }, [currentUserId]);

  // Generate channel list: main, school, + up to 3 subjects
  const channels = [
    { id: "main", label: "#main" },
    ...(userSchool ? [{ id: userSchool, label: `#${userSchool.toLowerCase().replace(/\s+/g, '-')}` }] : []),
    ...userSubjects.map((subject) => ({
      id: `${userSchool}-${subject.name}`,
      label: `#${userSchool?.toLowerCase().replace(/\s+/g, '-')}-${subject.name.toLowerCase().replace(/\s+/g, '-')}`,
    })),
  ];

  const currentChannel = activeTab;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load messages when channel changes
  useEffect(() => {
    if (!isJoined) return;

    async function loadMessages() {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("channel", currentChannel)
        .order("created_at", { ascending: true })
        .limit(50);

      setMessages(data ?? []);
    }

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${currentChannel}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `channel=eq.${currentChannel}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isJoined, currentChannel]);

  // Track online users
  useEffect(() => {
    if (!isJoined) return;

    async function joinChat() {
      await supabase.from("online_users").upsert({
        user_id: currentUserId,
        username: username,
        last_seen: new Date().toISOString(),
      });
    }

    async function updateOnlineCount() {
      const { count } = await supabase
        .from("online_users")
        .select("user_id", { count: "exact", head: true })
        .gte("last_seen", new Date(Date.now() - 60000).toISOString());

      setOnlineCount(count ?? 0);
    }

    joinChat();
    updateOnlineCount();

    const presenceInterval = setInterval(joinChat, 30000);
    const countInterval = setInterval(updateOnlineCount, 10000);

    return () => {
      clearInterval(presenceInterval);
      clearInterval(countInterval);
      supabase.from("online_users").delete().eq("user_id", currentUserId);
    };
  }, [isJoined, currentUserId, username]);

  async function sendMessage() {
    if (!newMessage.trim()) return;

    await supabase.from("chat_messages").insert({
      user_id: currentUserId,
      username: username,
      channel: currentChannel,
      message: newMessage.trim(),
    });

    setNewMessage("");
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const chatHeight = large ? "500px" : "400px";

  if (!isJoined) {
    return (
      <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Live Chat</h2>
          <span className="text-xs text-white/60">IRC-style</span>
        </div>
        <p className="text-sm text-white/60 mb-4">
          Join the live chat to talk with other briefica users in real-time.
        </p>
        <button
          onClick={() => setIsJoined(true)}
          className="w-full py-2 rounded-lg text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#66b2ff' }}
        >
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-[#1e1e1e] rounded-2xl overflow-hidden flex flex-col" style={{ height: chatHeight }}>
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-semibold">Live Chat</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/60">{onlineCount} online</span>
          <button
            onClick={() => setIsJoined(false)}
            className="text-xs text-white/60 hover:text-white"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm">
            <span className="font-semibold" style={{ color: '#66b2ff' }}>
              @{msg.username}
            </span>
            <span className="text-white/60 mx-2">·</span>
            <span className="text-white/90">{msg.message}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${channels.find(c => c.id === activeTab)?.label || '#main'}...`}
            className="flex-1 px-3 py-2 rounded-lg bg-[#2b2b2b] border border-white/20 focus:border-white/40 focus:outline-none text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-colors disabled:opacity-30 text-sm"
            style={{ backgroundColor: '#66b2ff' }}
          >
            Send
          </button>
        </div>

        {/* Channel Tabs */}
        <div className="flex gap-2 flex-wrap">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveTab(channel.id)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                activeTab === channel.id
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
              style={activeTab === channel.id ? { backgroundColor: '#66b2ff' } : {}}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}