"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { boardApi } from "@/lib/api";
import { Bell, MessageCircle, X, Send, Trash2, Megaphone, Smile, ArrowLeft } from "lucide-react";

// Chat üçün emoji seçimi
const EMOJIS = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😉", "😎", "🤔", "😐",
  "😢", "😭", "😡", "🥳", "😴", "🤝", "👍", "👎", "👏", "🙏",
  "💪", "✌️", "👋", "❤️", "🔥", "⭐", "✅", "❌", "⚠️", "📌",
  "📞", "📧", "💰", "📄", "🚗", "🏠", "🎉", "🎯", "⏰", "💡",
];

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "indicə";
  if (s < 3600) return `${Math.floor(s / 60)} dəq əvvəl`;
  if (s < 86400) return `${Math.floor(s / 3600)} saat əvvəl`;
  return new Date(iso).toLocaleDateString("az");
}

export function TopBar() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const userId = Number((session?.user as any)?.id);
  const isAdmin = role === "admin";

  const [annOpen, setAnnOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [lastSeen, setLastSeen] = useState(0);
  const [chatLastSeen, setChatLastSeen] = useState(0);
  const [annForm, setAnnForm] = useState({ title: "", body: "", audience: "all" as "all" | "agent" | "subagent" });
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [chatTab, setChatTab] = useState<"public" | "inbox">("public");
  const [peer, setPeer] = useState<any | null>(null); // seçilmiş şəxs (şəxsi yazışma)
  const [contacts, setContacts] = useState<any[]>([]);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastSeen(Number(localStorage.getItem("ann_last_seen") || 0));
    setChatLastSeen(Number(localStorage.getItem("chat_last_seen") || 0));
  }, []);

  const loadAnnouncements = () => boardApi.getAnnouncements().then(r => setAnnouncements(r.data.announcements)).catch(() => {});
  const loadMessages = (p?: number) => boardApi.getMessages(p).then(r => setMessages(r.data.messages)).catch(() => {});
  const loadContacts = () => boardApi.getContacts().then(r => setContacts(r.data.contacts)).catch(() => {});

  useEffect(() => {
    if (!session) return;
    loadAnnouncements();
    loadMessages(peer?.id);
    if (chatOpen) loadContacts();
    const t = setInterval(() => {
      loadAnnouncements();
      loadMessages(peer?.id);
      if (chatOpen && chatTab === "inbox") loadContacts();
    }, chatOpen ? 5000 : 15000);
    return () => clearInterval(t);
  }, [session, chatOpen, chatTab, peer]);

  // chat açılanda / yeni mesajda aşağı sürüş + oxunmuş kimi işarələ
  useEffect(() => {
    if (chatOpen) {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
      if (messages.length) {
        const maxId = Math.max(...messages.map(m => m.id));
        setChatLastSeen(maxId);
        localStorage.setItem("chat_last_seen", String(maxId));
      }
    }
  }, [messages, chatOpen]);

  const unread = announcements.filter(a => a.id > lastSeen).length;
  const chatUnread = messages.filter(m => m.id > chatLastSeen && m.user_id !== userId).length;

  const toggleAnn = () => {
    const next = !annOpen;
    setAnnOpen(next);
    if (next && announcements.length) {
      const maxId = Math.max(...announcements.map(a => a.id));
      setLastSeen(maxId);
      localStorage.setItem("ann_last_seen", String(maxId));
    }
  };

  const shareAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.body.trim()) return;
    await boardApi.createAnnouncement({
      title: annForm.title || undefined,
      body: annForm.body,
      audience: annForm.audience,
    });
    setAnnForm({ title: "", body: "", audience: "all" });
    loadAnnouncements();
  };

  const removeAnnouncement = async (id: number) => {
    await boardApi.deleteAnnouncement(id);
    loadAnnouncements();
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || sending) return;
    setSending(true);
    try {
      await boardApi.postMessage(chatInput.trim(), peer?.id);
      setChatInput("");
      loadMessages(peer?.id);
    } finally {
      setSending(false);
    }
  };

  if (!session) return null;

  return (
    <>
      {/* Yuxarı panel */}
      <div className="sticky top-0 z-30 flex items-center justify-end gap-2 mb-4 -mt-2">
        {/* Chat düyməsi */}
        <button
          onClick={() => setChatOpen(true)}
          className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-primary hover:border-primary/40 transition"
          title="Söhbət"
        >
          <MessageCircle size={19} />
          {chatUnread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-bold">
              {chatUnread > 9 ? "9+" : chatUnread}
            </span>
          )}
        </button>

        {/* Bildiriş zəngi */}
        <div className="relative">
          <button
            onClick={toggleAnn}
            className="relative h-10 w-10 flex items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm text-slate-600 hover:text-primary hover:border-primary/40 transition"
            title="Bildirişlər"
          >
            <Bell size={19} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Bildiriş dropdown */}
          {annOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setAnnOpen(false)} />
              <div className="absolute right-0 mt-2 w-[340px] sm:w-[380px] max-h-[70vh] overflow-hidden z-40 rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col">
                <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
                  <Megaphone size={16} className="text-primary" />
                  <span className="font-semibold text-slate-800">Bildirişlər</span>
                  <button onClick={() => setAnnOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={16} /></button>
                </div>

                {/* Admin: yeni bildiriş */}
                {isAdmin && (
                  <form onSubmit={shareAnnouncement} className="p-3 border-b bg-slate-50 space-y-2">
                    {/* Kimə göndərilsin */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-muted-foreground mr-1">Kimə:</span>
                      {([["all", "Hamısı"], ["agent", "Agentlər"], ["subagent", "Subagentlər"]] as const).map(([v, l]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAnnForm(f => ({ ...f, audience: v }))}
                          className={`px-2 py-1 rounded-md text-[11px] font-medium border transition ${
                            annForm.audience === v ? "bg-primary text-primary-foreground border-primary" : "bg-white text-slate-600 border-slate-200"
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <input
                      value={annForm.title}
                      onChange={e => setAnnForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Başlıq (istəyə bağlı)"
                      className="w-full h-8 rounded-md border border-slate-200 px-2.5 text-sm"
                    />
                    <textarea
                      value={annForm.body}
                      onChange={e => setAnnForm(f => ({ ...f, body: e.target.value }))}
                      placeholder="Bildiriş mətni..."
                      rows={2}
                      className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm resize-none"
                    />
                    <button type="submit" className="w-full h-8 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                      Paylaş
                    </button>
                  </form>
                )}

                {/* Siyahı */}
                <div className="flex-1 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">Bildiriş yoxdur</p>
                  ) : (
                    announcements.map(a => (
                      <div key={a.id} className="px-4 py-3 border-b last:border-0 hover:bg-slate-50">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 h-7 w-7 shrink-0 flex items-center justify-center rounded-full bg-primary/10 text-primary"><Megaphone size={14} /></span>
                          <div className="min-w-0 flex-1">
                            {a.title && <p className="font-semibold text-sm text-slate-800">{a.title}</p>}
                            <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{a.body}</p>
                            <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                              <span>{a.author || "Admin"} · {timeAgo(a.created_at)}</span>
                              {isAdmin && a.audience && a.audience !== "all" && (
                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                  {a.audience === "agent" ? "yalnız agentlər" : "yalnız subagentlər"}
                                </span>
                              )}
                            </p>
                          </div>
                          {isAdmin && (
                            <button onClick={() => removeAnnouncement(a.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat slide-over */}
      {chatOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setChatOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col">
            {/* Başlıq */}
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
              {peer ? (
                <>
                  <button onClick={() => setPeer(null)} className="text-slate-400 hover:text-primary" title="Geri">
                    <ArrowLeft size={18} />
                  </button>
                  <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {peer.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{peer.name}</p>
                    <p className="text-[10px] text-muted-foreground">şəxsi yazışma</p>
                  </div>
                </>
              ) : (
                <>
                  <MessageCircle size={18} className="text-primary" />
                  <span className="font-semibold text-slate-800">Söhbət</span>
                </>
              )}
              <button onClick={() => setChatOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Tablar */}
            {!peer && (
              <div className="flex border-b bg-white">
                {([["public", "Ümumi"], ["inbox", "Şəxsi"]] as const).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setChatTab(v)}
                    className={`flex-1 py-2 text-sm font-medium transition border-b-2 ${
                      chatTab === v ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {l === "Ümumi" ? "Ümumi (hamı görür)" : "Şəxsi (inbox)"}
                  </button>
                ))}
              </div>
            )}

            {/* İNBOX — kontakt siyahısı */}
            {!peer && chatTab === "inbox" ? (
              <div className="flex-1 overflow-y-auto divide-y bg-white">
                {contacts.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">İstifadəçi yoxdur</p>
                ) : (
                  contacts.map(c => {
                    const seen = Number(localStorage.getItem(`dm_seen_${c.id}`) || 0);
                    const isUnread = c.last_message_id && !c.last_from_me && c.last_message_id > seen;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setPeer(c);
                          if (c.last_message_id) localStorage.setItem(`dm_seen_${c.id}`, String(c.last_message_id));
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 text-left"
                      >
                        <span className="h-8 w-8 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">
                          {c.name.charAt(0)}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className={`text-sm truncate ${isUnread ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{c.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                              {c.role === "admin" ? "Admin" : c.role === "subagent" ? "Subagent" : "Agent"}
                            </span>
                          </span>
                          <span className={`block text-[11px] truncate ${isUnread ? "text-slate-700 font-medium" : "text-muted-foreground"}`}>
                            {c.last_body ? `${c.last_from_me ? "Siz: " : ""}${c.last_body}` : "Mesaj yoxdur"}
                          </span>
                        </span>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (

            <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
              {messages.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">Hələ mesaj yoxdur. İlk siz yazın!</p>
              ) : (
                messages.map(m => {
                  const mine = m.user_id === userId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "bg-primary text-primary-foreground" : "bg-white border border-slate-200 text-slate-800"}`}>
                        {!mine && (
                          <p className="text-[11px] font-semibold text-primary mb-0.5">
                            {m.user_name}{m.user_role === "admin" ? " · Admin" : m.user_role === "subagent" ? " · Subagent" : ""}
                          </p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-0.5 ${mine ? "text-white/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}

            {/* Mesaj yazma sahəsi — kontakt siyahısında gizlənir */}
            {!(!peer && chatTab === "inbox") && (
            <div className="relative border-t">
              {/* Emoji paneli */}
              {showEmoji && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowEmoji(false)} />
                  <div className="absolute bottom-full left-3 mb-2 z-20 w-64 p-2 rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="grid grid-cols-8 gap-0.5 max-h-40 overflow-y-auto">
                      {EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => { setChatInput(v => v + em); setShowEmoji(false); }}
                          className="h-7 w-7 flex items-center justify-center rounded hover:bg-slate-100 text-lg leading-none"
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <form onSubmit={sendMessage} className="p-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmoji(s => !s)}
                  className={`h-10 w-10 shrink-0 flex items-center justify-center rounded-full border transition ${showEmoji ? "border-primary text-primary bg-primary/5" : "border-slate-200 text-slate-500 hover:text-primary"}`}
                  title="Emoji"
                >
                  <Smile size={18} />
                </button>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder={peer ? `${peer.name} adlı şəxsə yazın...` : "Mesaj yazın..."}
                  className="flex-1 h-10 rounded-full border border-slate-200 px-4 text-sm focus:outline-none focus:border-primary"
                />
                <button type="submit" disabled={sending || !chatInput.trim()} className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90">
                  <Send size={17} />
                </button>
              </form>
            </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
