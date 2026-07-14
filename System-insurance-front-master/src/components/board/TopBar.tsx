"use client";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { boardApi } from "@/lib/api";
import { Bell, MessageCircle, X, Send, Trash2, Megaphone } from "lucide-react";

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
  const [annForm, setAnnForm] = useState({ title: "", body: "" });
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLastSeen(Number(localStorage.getItem("ann_last_seen") || 0));
    setChatLastSeen(Number(localStorage.getItem("chat_last_seen") || 0));
  }, []);

  const loadAnnouncements = () => boardApi.getAnnouncements().then(r => setAnnouncements(r.data.announcements)).catch(() => {});
  const loadMessages = () => boardApi.getMessages().then(r => setMessages(r.data.messages)).catch(() => {});

  useEffect(() => {
    if (!session) return;
    loadAnnouncements();
    loadMessages();
    const t = setInterval(() => { loadAnnouncements(); loadMessages(); }, chatOpen ? 5000 : 15000);
    return () => clearInterval(t);
  }, [session, chatOpen]);

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
    await boardApi.createAnnouncement({ title: annForm.title || undefined, body: annForm.body });
    setAnnForm({ title: "", body: "" });
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
      await boardApi.postMessage(chatInput.trim());
      setChatInput("");
      loadMessages();
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
                            <p className="text-[11px] text-muted-foreground mt-1">{a.author || "Admin"} · {timeAgo(a.created_at)}</p>
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
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-primary/10 to-transparent">
              <MessageCircle size={18} className="text-primary" />
              <span className="font-semibold text-slate-800">Söhbət</span>
              <span className="text-xs text-muted-foreground">(hamı görür)</span>
              <button onClick={() => setChatOpen(false)} className="ml-auto text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

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

            <form onSubmit={sendMessage} className="p-3 border-t flex items-center gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Mesaj yazın..."
                className="flex-1 h-10 rounded-full border border-slate-200 px-4 text-sm focus:outline-none focus:border-primary"
              />
              <button type="submit" disabled={sending || !chatInput.trim()} className="h-10 w-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50 hover:bg-primary/90">
                <Send size={17} />
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}
