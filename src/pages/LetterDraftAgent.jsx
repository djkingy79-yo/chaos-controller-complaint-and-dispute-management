import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Plus, Bot, User, Loader2, FileText, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";

const AGENT_NAME = "complaint_letter_drafter";

function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent"}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${isUser ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm"}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
            {message.content || ""}
          </ReactMarkdown>
        )}
        {message.tool_calls?.map((tc, i) => {
          if (tc.display_projection?.hide_details) return null;
          return (
            <div key={i} className="mt-2 text-xs text-muted-foreground italic border-t border-border/50 pt-1.5">
              🔍 {tc.display_projection?.label || tc.name?.replace(/_/g, " ")}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LetterDraftAgent() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showConvList, setShowConvList] = useState(false);
  const bottomRef = useRef(null);

  const { data: cases = [] } = useQuery({
    queryKey: ["cases-agent"],
    queryFn: () => base44.entities.Case.list("-updated_date", 20),
    enabled: !!user,
  });

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeConvId) return;
    const unsub = base44.agents.subscribeToConversation(activeConvId, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsub();
  }, [activeConvId]);

  const loadConversations = async () => {
    setLoadingConvs(true);
    try {
      const convs = await base44.agents.listConversations({ agent_name: AGENT_NAME });
      setConversations(convs || []);
      if (convs?.length > 0 && !activeConvId) {
        await selectConversation(convs[0]);
      }
    } finally {
      setLoadingConvs(false);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConvId(conv.id);
    setShowConvList(false);
    const full = await base44.agents.getConversation(conv.id);
    setMessages(full.messages || []);
  };

  const startNewConversation = async (starterMessage) => {
    const conv = await base44.agents.createConversation({
      agent_name: AGENT_NAME,
      metadata: { name: `Letter Draft — ${new Date().toLocaleDateString("en-AU")}` },
    });
    setActiveConvId(conv.id);
    setConversations(prev => [conv, ...prev]);
    setMessages([]);
    if (starterMessage) {
      await sendMessage(conv, starterMessage);
    }
  };

  const sendMessage = async (conv, text) => {
    const convToUse = conv || (activeConvId ? { id: activeConvId } : null);
    if (!convToUse || !text.trim()) return;
    setSending(true);
    try {
      const fullConv = await base44.agents.getConversation(convToUse.id);
      await base44.agents.addMessage(fullConv, { role: "user", content: text });
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    if (!activeConvId) {
      await startNewConversation(text);
    } else {
      await sendMessage(null, text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const visibleMessages = messages.filter(m => m.role !== "system");
  const activeConv = conversations.find(c => c.id === activeConvId);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-accent/15 rounded-xl">
            <Bot className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Letter Drafter AI</h1>
            <p className="text-xs text-muted-foreground">Draft professional complaint letters from your case details</p>
          </div>
        </div>
        <Button size="sm" onClick={() => startNewConversation(null)} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Chat
        </Button>
      </div>

      {/* Quick-start cases */}
      {cases.length > 0 && !activeConvId && (
        <div className="mb-4 p-4 bg-card border border-border rounded-xl space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Start — Draft a letter for a case</p>
          <div className="flex flex-wrap gap-2">
            {cases.slice(0, 6).map(c => (
              <button
                key={c.id}
                onClick={() => startNewConversation(`Please help me draft a 1st complaint letter for my case: "${c.title}" against ${c.organisation_name || "the organisation"}. Case ID: ${c.id}`)}
                className="text-xs bg-secondary/60 hover:bg-primary/10 hover:text-primary border border-border rounded-lg px-3 py-1.5 transition-colors text-left"
              >
                <FileText className="w-3 h-3 inline mr-1" />
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation selector */}
      {conversations.length > 1 && (
        <div className="relative mb-3">
          <button
            onClick={() => setShowConvList(!showConvList)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground bg-secondary/40 border border-border rounded-lg px-3 py-1.5 w-full sm:w-auto"
          >
            <span className="truncate">{activeConv?.metadata?.name || "Select conversation"}</span>
            <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${showConvList ? "rotate-180" : ""}`} />
          </button>
          {showConvList && (
            <div className="absolute top-full mt-1 left-0 w-72 bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c)}
                  className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 transition-colors ${c.id === activeConvId ? "text-primary font-medium" : "text-foreground"}`}
                >
                  {c.metadata?.name || "Conversation"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-2">
        {loadingConvs ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="p-4 bg-accent/10 rounded-2xl">
              <FileText className="w-10 h-10 text-accent" />
            </div>
            <div>
              <p className="font-heading font-semibold text-foreground">Ready to draft your letter</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Tell me about your dispute, or select a case above to get started instantly.</p>
            </div>
            <div className="space-y-2 w-full max-w-sm">
              {["Help me draft a 1st complaint letter", "I need a follow-up letter — no response in 30 days", "Draft an escalation letter to AFCA"].map(s => (
                <button
                  key={s}
                  onClick={() => startNewConversation(s)}
                  className="w-full text-xs bg-secondary/50 hover:bg-primary/10 hover:text-primary border border-border rounded-lg px-3 py-2 transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => <MessageBubble key={i} message={msg} />)
        )}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-accent" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2 items-end border border-border rounded-xl p-2 bg-card focus-within:border-primary/50 transition-colors">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for a letter draft, or describe your dispute..."
          rows={2}
          className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm p-1"
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="shrink-0 h-9 w-9"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-1.5">Press Enter to send · Shift+Enter for new line</p>
    </div>
  );
}