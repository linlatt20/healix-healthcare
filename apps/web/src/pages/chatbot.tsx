import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Button, Input, Badge } from "@/components/shared-ui";
import {
  MessageSquare, Send, Activity, Info, AlertTriangle,
  Languages, Loader2, Mic, MicOff, Volume2, ArrowLeftRight, X, ChevronDown,
  PenLine, FileText, Upload, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useChatbotMessage, useTranslateMedical } from "@workspace/api-client-react";
import { ChatMessage } from "@workspace/api-client-react/src/generated/api.schemas";

type Tab = "chat" | "translate";

export default function Chatbot() {
  const initialTab: Tab = new URLSearchParams(window.location.search).get("tab") === "translate" ? "translate" : "chat";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
        {(["chat", "translate"] as Tab[]).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab === "chat" ? <><MessageSquare className="w-4 h-4" /> Symptom Chat</> : <><Languages className="w-4 h-4" /> Live Interpreter</>}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {activeTab === "chat" ? (
          <motion.div key="chat" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <ChatPanel />
          </motion.div>
        ) : (
          <motion.div key="translate" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <InterpreterPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Chat Panel ──────────────────────────────────────────────────────── */
function ChatPanel() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hello! I'm Healix AI. Please tell me about your symptoms or medical questions. How are you feeling today?" }
  ]);
  const [urgency, setUrgency] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const chatMutation = useChatbotMessage();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatMutation.isPending]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;
    const msg = input; setInput("");
    const history: ChatMessage[] = [...messages, { role: "user", content: msg }];
    setMessages(history);
    chatMutation.mutate({ data: { message: msg, conversationHistory: messages, language: "English" } }, {
      onSuccess: (data) => {
        setMessages(p => [...p, { role: "assistant", content: data.message }]);
        if (data.urgencyLevel) setUrgency(data.urgencyLevel);
        if (data.suggestedDepartments) setDepartments(data.suggestedDepartments);
      }
    });
  };

  const urgencyColor = (l: string) => ({
    emergency: "bg-red-500 text-white border-red-600 animate-pulse",
    high: "bg-orange-500 text-white border-orange-600",
    medium: "bg-yellow-400 text-yellow-900 border-yellow-500",
    low: "bg-emerald-500 text-white border-emerald-600",
  }[l.toLowerCase()] ?? "bg-primary/10 text-primary");

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col md:flex-row gap-6">
      <Card className="flex-1 flex flex-col shadow-xl border-border/50 overflow-hidden">
        <div className="p-4 bg-card border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold">Healix Symptom Checker</h2>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" /> AI Assistant Online
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm shadow-md shadow-primary/20" : "bg-card border border-border text-foreground rounded-tl-sm shadow-sm"}`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </motion.div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-tl-sm p-4 flex gap-1.5 items-center">
                {[0,150,300].map(d => <div key={d} className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay:`${d}ms` }} />)}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="p-4 bg-card border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Describe your symptoms..."
              className="flex-1 pl-4 pr-14 h-14 text-base bg-muted/20" disabled={chatMutation.isPending} />
            <Button type="submit" disabled={!input.trim() || chatMutation.isPending} className="absolute right-1 top-1 h-12 w-12 p-0 rounded-xl">
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> AI suggestions do not replace professional medical advice.
          </p>
        </div>
      </Card>
      <div className="w-full md:w-72 flex flex-col gap-4">
        <Card className="p-5 border-t-4 border-t-accent">
          <h3 className="font-bold flex items-center gap-2 mb-4"><Activity className="w-5 h-5 text-accent" /> Assessment</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Estimated Urgency</p>
              {urgency ? (
                <div className={`px-4 py-3 rounded-xl border font-bold flex items-center gap-2 ${urgencyColor(urgency)}`}>
                  {urgency === "emergency" && <AlertTriangle className="w-5 h-5" />}{urgency.toUpperCase()}
                </div>
              ) : <div className="px-4 py-3 rounded-xl bg-muted/50 text-muted-foreground text-sm border border-dashed border-border">Provide symptoms to analyze.</div>}
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">Suggested Departments</p>
              {departments.length > 0 ? (
                <div className="flex flex-wrap gap-2">{departments.map((d,i) => <Badge key={i} variant="outline" className="text-sm py-1">{d}</Badge>)}</div>
              ) : <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-xl border border-dashed">Pending analysis...</div>}
            </div>
          </div>
          {departments.length > 0 && <Button className="w-full mt-5" onClick={() => window.location.href=`/clinics?department=${departments[0]}`}>Find {departments[0]} Clinics</Button>}
        </Card>
      </div>
    </div>
  );
}

/* ─── Live Interpreter Panel ──────────────────────────────────────────── */
const LANGS = ["English","Korean","Chinese","Japanese","Vietnamese","Thai","Burmese","Mongolian"];

const LANG_CODES: Record<string, string> = {
  English: "en-US", Korean: "ko-KR", Chinese: "zh-CN", Japanese: "ja-JP",
  Vietnamese: "vi-VN", Thai: "th-TH", Burmese: "my-MM", Mongolian: "mn-MN",
};

type InputMethod = "voice" | "text" | "doc";

interface ConvoMsg {
  id: number;
  speaker: "A" | "B";
  original: string;
  translated: string;
  pending: boolean;
}

interface DocResult {
  extractedText: string;
  translatedText: string;
  documentType: string;
  medicalTerms: { original: string; translation: string; explanation: string }[];
}

function InterpreterPanel() {
  const [langA, setLangA] = useState("English");
  const [langB, setLangB] = useState("Korean");
  const [conversation, setConversation] = useState<ConvoMsg[]>([]);
  const [nextId, setNextId] = useState(1);
  const [inputMethod, setInputMethod] = useState<InputMethod>("voice");
  const [textInputSpeaker, setTextInputSpeaker] = useState<"A" | "B" | null>(null);
  const [draftA, setDraftA] = useState("");
  const [draftB, setDraftB] = useState("");
  const [showLangPicker, setShowLangPicker] = useState<null | "A" | "B">(null);
  const [listening, setListening] = useState<"A" | "B" | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [docProcessing, setDocProcessing] = useState(false);
  const [docResult, setDocResult] = useState<DocResult | null>(null);
  const [docSpeaker, setDocSpeaker] = useState<"A" | "B">("A");

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recogRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const translateMutation = useTranslateMedical();

  const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }); }, [conversation]);
  useEffect(() => { if (textInputSpeaker) inputRef.current?.focus(); }, [textInputSpeaker]);

  const sendText = useCallback((speaker: "A" | "B", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (speaker === "A") setDraftA(""); else setDraftB("");
    setTextInputSpeaker(null);
    setLiveTranscript("");
    const from = speaker === "A" ? langA : langB;
    const to = speaker === "A" ? langB : langA;
    const id = nextId; setNextId(p => p + 1);
    setConversation(p => [...p, { id, speaker, original: trimmed, translated: "", pending: true }]);
    translateMutation.mutate({ data: { text: trimmed, sourceLanguage: from, targetLanguage: to } }, {
      onSuccess: (data) => setConversation(p => p.map(m => m.id === id ? { ...m, translated: data.translatedText, pending: false } : m)),
      onError: () => setConversation(p => p.map(m => m.id === id ? { ...m, translated: "[Translation failed]", pending: false } : m)),
    });
  }, [langA, langB, nextId, translateMutation]);

  /* ── Voice input ── */
  const startVoice = useCallback((speaker: "A" | "B") => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSpeechError("Speech recognition is not supported in this browser. Try Chrome."); return; }
    if (listening === speaker) {
      recogRef.current?.stop();
      setListening(null);
      return;
    }
    recogRef.current?.stop();
    setSpeechError(null);
    setLiveTranscript("");
    const rec = new SR();
    recogRef.current = rec;
    rec.lang = LANG_CODES[speaker === "A" ? langA : langB] || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    setListening(speaker);
    let finalText = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t;
        else interim = t;
      }
      setLiveTranscript(finalText + interim);
    };
    rec.onend = () => {
      setListening(null);
      if (finalText.trim()) sendText(speaker, finalText);
      else setLiveTranscript("");
    };
    rec.onerror = (e: any) => {
      setListening(null);
      if (e.error !== "no-speech") setSpeechError(`Microphone error: ${e.error}`);
    };
    rec.start();
  }, [langA, langB, listening, sendText]);

  /* ── Text input key handler ── */
  const handleKey = (e: React.KeyboardEvent, speaker: "A" | "B") => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(speaker, speaker === "A" ? draftA : draftB); }
    if (e.key === "Escape") setTextInputSpeaker(null);
  };

  /* ── Doc upload ── */
  const handleFile = async (file: File, speaker: "A" | "B") => {
    setDocResult(null);
    setDocSpeaker(speaker);
    setDocProcessing(true);
    const targetLang = speaker === "A" ? langB : langA;

    try {
      if (file.type === "text/plain") {
        const text = await file.text();
        const res = await fetch(`${BASE}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sourceLanguage: "auto", targetLanguage: targetLang }),
        });
        const data = await res.json();
        setDocResult({ extractedText: text, translatedText: data.translatedText, documentType: "Text Document", medicalTerms: data.medicalTerms || [] });
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => { const r = reader.result as string; resolve(r.split(",")[1]); };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch(`${BASE}/api/translate/doc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type, targetLanguage: targetLang, fileName: file.name }),
        });
        const data = await res.json();
        setDocResult(data);
      }
    } catch {
      setSpeechError("Document processing failed. Please try again.");
    } finally {
      setDocProcessing(false);
    }
  };

  const speakText = (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_CODES[lang] || "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  const micBtn = (speaker: "A" | "B") => {
    const isA = speaker === "A";
    const color = isA ? "bg-primary hover:bg-primary/90 ring-primary/30" : "bg-orange-500 hover:bg-orange-600 ring-orange-300";
    const isActiveListening = listening === speaker;

    if (inputMethod === "voice") {
      return (
        <button onClick={() => startVoice(speaker)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 relative ${color} ${isActiveListening ? "ring-4 scale-105" : ""}`}>
          {isActiveListening ? (
            <>
              <MicOff className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            </>
          ) : <Mic className="w-6 h-6" />}
        </button>
      );
    }
    if (inputMethod === "text") {
      return (
        <button onClick={() => setTextInputSpeaker(textInputSpeaker === speaker ? null : speaker)}
          className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${color} ${textInputSpeaker === speaker ? "ring-4 scale-105" : ""}`}>
          <PenLine className="w-6 h-6" />
        </button>
      );
    }
    return (
      <button onClick={() => { setDocSpeaker(speaker); fileInputRef.current?.click(); }}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 ${color}`}>
        <Upload className="w-6 h-6" />
      </button>
    );
  };

  const langPicker = (speaker: "A" | "B") => {
    const isA = speaker === "A";
    return (
      <div className="relative">
        <button onClick={() => setShowLangPicker(showLangPicker === speaker ? null : speaker)}
          className={`flex items-center gap-1 text-sm font-semibold text-gray-700 ${isA ? "hover:text-primary" : "hover:text-orange-500"} transition-colors`}>
          {isA ? langA : langB} <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {showLangPicker === speaker && (
          <div className={`absolute bottom-8 ${isA ? "left-0" : "right-0"} bg-white border border-border rounded-xl shadow-xl z-50 py-1 min-w-[130px]`}>
            {LANGS.map(l => (
              <button key={l} onClick={() => { isA ? setLangA(l) : setLangB(l); setShowLangPicker(null); }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${isA ? "hover:bg-primary/10" : "hover:bg-orange-50"} ${l === (isA ? langA : langB) ? `font-bold ${isA ? "text-primary" : "text-orange-500"}` : ""}`}>
                {l}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-border shadow-xl bg-white" style={{ height: "calc(100vh - 160px)" }}>

      {/* Conversation scroll area */}
      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-5 bg-gray-50">
        {conversation.length === 0 && !docResult && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center text-muted-foreground py-10">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowLeftRight className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground mb-1">Ready to interpret</p>
              <p className="text-sm">
                {inputMethod === "voice" && "Tap the mic button and speak — translation happens automatically."}
                {inputMethod === "text" && "Tap the text button for either speaker to type."}
                {inputMethod === "doc" && "Tap the upload button to scan a prescription or lab result."}
              </p>
            </div>
            {inputMethod === "voice" && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {["Hello, how are you?", "Where does it hurt?", "I have a fever.", "어디가 아프세요?"].map(s => (
                  <button key={s} onClick={() => sendText("A", s)}
                    className="text-xs bg-white border border-border px-3 py-1.5 rounded-full hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all shadow-sm">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Doc result */}
        {docResult && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-semibold text-sm text-primary">
                <CheckCircle2 className="w-4 h-4" /> {docResult.documentType}
              </span>
              <button onClick={() => setDocResult(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Original Text</p>
                <p className="text-sm text-foreground bg-gray-50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">{docResult.extractedText}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 uppercase tracking-wide text-primary">Translated ({docSpeaker === "A" ? langB : langA})</p>
                <div className="flex items-start gap-2">
                  <p className="text-sm font-medium text-foreground bg-primary/5 rounded-xl p-3 whitespace-pre-wrap leading-relaxed flex-1">{docResult.translatedText}</p>
                  <button onClick={() => speakText(docResult.translatedText, docSpeaker === "A" ? langB : langA)} className="text-primary/70 hover:text-primary mt-2 shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {docResult.medicalTerms.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Medical Terms</p>
                <div className="flex flex-wrap gap-2">
                  {docResult.medicalTerms.map((t, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-primary border border-blue-100 px-2.5 py-1 rounded-full">
                      {t.original} → {t.translation}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {conversation.map(msg => {
          const isA = msg.speaker === "A";
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${isA ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[72%] rounded-2xl px-4 py-3 shadow-sm ${isA ? "bg-blue-50 rounded-tl-sm" : "bg-orange-50 rounded-tr-sm"}`}>
                <p className="text-sm text-gray-500 mb-1">{msg.original}</p>
                {msg.pending ? (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400 italic">
                    <Loader2 className="w-3 h-3 animate-spin" /> translating…
                  </span>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold ${isA ? "text-primary" : "text-orange-500"}`}>{msg.translated}</p>
                    <button onClick={() => speakText(msg.translated, isA ? langB : langA)}
                      className={`shrink-0 ${isA ? "text-primary/70 hover:text-primary" : "text-orange-400 hover:text-orange-600"} transition-colors`}>
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live transcript preview */}
      <AnimatePresence>
        {(listening || liveTranscript) && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`border-t overflow-hidden ${listening === "A" ? "border-blue-200 bg-blue-50/80" : "border-orange-200 bg-orange-50/80"}`}>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className={`text-xs font-semibold ${listening === "A" ? "text-primary" : "text-orange-500"}`}>
                  {listening === "A" ? langA : langB} · Listening…
                </span>
              </span>
              <p className="flex-1 text-sm text-foreground/70 italic truncate">{liveTranscript || "Speak now…"}</p>
              <button onClick={() => { recogRef.current?.stop(); setListening(null); setLiveTranscript(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text input bar */}
      <AnimatePresence>
        {textInputSpeaker && inputMethod === "text" && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`border-t ${textInputSpeaker === "A" ? "border-blue-200 bg-blue-50/80" : "border-orange-200 bg-orange-50/80"} overflow-hidden`}>
            <div className="flex items-center gap-2 px-4 py-3">
              <span className={`text-xs font-semibold shrink-0 ${textInputSpeaker === "A" ? "text-primary" : "text-orange-500"}`}>
                {textInputSpeaker === "A" ? langA : langB}
              </span>
              <input ref={inputRef}
                value={textInputSpeaker === "A" ? draftA : draftB}
                onChange={e => textInputSpeaker === "A" ? setDraftA(e.target.value) : setDraftB(e.target.value)}
                onKeyDown={e => handleKey(e, textInputSpeaker)}
                placeholder={`Type in ${textInputSpeaker === "A" ? langA : langB}…`}
                className="flex-1 bg-white border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <button onClick={() => sendText(textInputSpeaker, textInputSpeaker === "A" ? draftA : draftB)}
                disabled={!(textInputSpeaker === "A" ? draftA : draftB).trim()}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-white disabled:opacity-40 transition-colors ${textInputSpeaker === "A" ? "bg-primary hover:bg-primary/90" : "bg-orange-500 hover:bg-orange-600"}`}>
                <Send className="w-4 h-4" />
              </button>
              <button onClick={() => setTextInputSpeaker(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Doc processing indicator */}
      <AnimatePresence>
        {docProcessing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-violet-200 bg-violet-50/80 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
              <p className="text-sm text-violet-700 font-medium">Extracting and translating document…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error bar */}
      <AnimatePresence>
        {speechError && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-red-200 bg-red-50 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700 flex-1">{speechError}</p>
              <button onClick={() => setSpeechError(null)} className="text-red-400 hover:text-red-600"><X className="w-3.5 h-3.5" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div className="bg-white border-t border-gray-200">
        {/* Mode selector */}
        <div className="flex items-center justify-center gap-2 px-6 pt-3 pb-1">
          {([
            { id: "voice", icon: Mic, label: "Voice" },
            { id: "text", icon: PenLine, label: "Text" },
            { id: "doc", icon: FileText, label: "Doc" },
          ] as { id: InputMethod; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setInputMethod(id); setTextInputSpeaker(null); setDocResult(null); setSpeechError(null); }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                inputMethod === id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "text-muted-foreground border-border hover:border-primary/40 hover:text-primary bg-white"
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Speaker controls */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            {micBtn("A")}
            {langPicker("A")}
          </div>
          <button onClick={() => { setLangA(langB); setLangB(langA); setConversation([]); setDocResult(null); }}
            className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all">
            <ArrowLeftRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 flex-row-reverse">
            {micBtn("B")}
            {langPicker("B")}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".txt,.jpg,.jpeg,.png,.webp,.pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f, docSpeaker); e.target.value = ""; }} />
    </div>
  );
}
