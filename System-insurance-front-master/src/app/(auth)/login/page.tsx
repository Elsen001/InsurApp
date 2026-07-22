"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft, Car, Home, HeartPulse, Plane } from "lucide-react";
import { authApi } from "@/lib/api";

type Mode = "login" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [enterAnim, setEnterAnim] = useState(false); // tam ekran giriş animasiyası

  // Şifrə bərpası vəziyyəti
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEnterAnim(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email və ya şifrə yanlışdır");
      setLoading(false);
      setEnterAnim(false);
    } else {
      // Animasiya görünsün deyə qısa gözləmə, sonra yönləndir
      setTimeout(() => router.push("/dashboard"), 1900);
    }
  };

  // Addım 1: sorğu göndər (və ya təsdiqlənibsə yeni şifrə addımına keç)
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await authApi.requestPasswordReset(resetEmail);
      if (res.data?.status === "approved") {
        setMode("reset");
        setInfo("Sorğunuz təsdiqlənib. Yeni şifrənizi təyin edin.");
      } else {
        setInfo(
          "Sorğunuz admin təsdiqinə göndərildi. Admin təsdiqlədikdən sonra bu bölməyə yenidən daxil olub yeni şifrə təyin edə bilərsiniz."
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  // Addım 2: yeni şifrəni təyin et
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    if (newPassword.length < 6) {
      setError("Şifrə ən az 6 simvol olmalıdır");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Şifrələr eyni deyil");
      return;
    }
    setLoading(true);
    try {
      await authApi.completePasswordReset(resetEmail, newPassword);
      setInfo("Şifrəniz uğurla dəyişdirildi. İndi yeni şifrə ilə daxil ola bilərsiniz.");
      setEmail(resetEmail);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMode("login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  };

  const goLogin = () => {
    setMode("login");
    setError("");
    setInfo("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950 p-4">
      {/* ── Tam ekran giriş animasiyası (sığorta temalı) ── */}
      {enterAnim && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 animate-[fadeIn_0.4s_ease-out]">
          {/* Arxa fon — üzən işıq ləkələri */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl animate-[blob_9s_ease-in-out_infinite]" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl animate-[blob_11s_ease-in-out_infinite_reverse]" />
          <div className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl animate-[blob_13s_ease-in-out_infinite]" />

          {/* Orbit — mərkəzdə qalxan, ətrafında sığorta ikonları */}
          <div className="relative h-72 w-72">
            {/* fırlanan halqa */}
            <div className="absolute inset-6 rounded-full border border-white/10 animate-[spin_12s_linear_infinite]" />
            <div className="absolute inset-0 rounded-full border border-dashed border-white/10 animate-[spin_18s_linear_infinite_reverse]" />

            {/* mərkəz — qalxan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl animate-[beat_1.6s_ease-in-out_infinite]">
                <ShieldCheck className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* orbitləşən ikonlar */}
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
              {[
                { Icon: Car, pos: "top-0 left-1/2 -translate-x-1/2", color: "text-sky-300", ring: "bg-sky-500/15 border-sky-400/30" },
                { Icon: Plane, pos: "right-0 top-1/2 -translate-y-1/2", color: "text-indigo-300", ring: "bg-indigo-500/15 border-indigo-400/30" },
                { Icon: Home, pos: "bottom-0 left-1/2 -translate-x-1/2", color: "text-emerald-300", ring: "bg-emerald-500/15 border-emerald-400/30" },
                { Icon: HeartPulse, pos: "left-0 top-1/2 -translate-y-1/2", color: "text-rose-300", ring: "bg-rose-500/15 border-rose-400/30" },
              ].map(({ Icon, pos, color, ring }, i) => (
                <div key={i} className={`absolute ${pos}`}>
                  <div className={`h-16 w-16 rounded-2xl border backdrop-blur-sm flex items-center justify-center shadow-xl ${ring} animate-[spin_10s_linear_infinite_reverse]`}>
                    <Icon className={`h-8 w-8 ${color}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mətn + zolaq */}
          <div className="mt-10 flex flex-col items-center gap-4">
            <p className="text-white text-xl font-semibold tracking-wide flex items-center">
              Daxil olunur
              <span className="inline-flex gap-1 ml-2">
                {[0, 150, 300].map(d => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </span>
            </p>
            <p className="text-slate-400 text-sm">Sığorta Sistemi</p>
            <div className="h-1 w-56 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 to-rose-400 animate-[loadbar_1.6s_ease-in-out_infinite]" />
            </div>
          </div>

          {/* Keyframe tərifləri */}
          <style>{`
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
            @keyframes beat {
              0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.15) }
              50% { transform: scale(1.08); box-shadow: 0 0 40px 8px rgba(96,165,250,0.25) }
            }
            @keyframes blob {
              0%, 100% { transform: translate(0,0) scale(1) }
              33% { transform: translate(30px,-20px) scale(1.1) }
              66% { transform: translate(-20px,20px) scale(0.95) }
            }
            @keyframes loadbar {
              0% { transform: translateX(-120%) }
              100% { transform: translateX(360%) }
            }
          `}</style>
        </div>
      )}

      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-primary rounded-full">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Sığorta Sistemi</CardTitle>
          <CardDescription>
            {mode === "login" && "Daxili idarəetmə paneli"}
            {mode === "forgot" && "Şifrənin bərpası"}
            {mode === "reset" && "Yeni şifrə təyini"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {info && (
            <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md p-3 mb-4">
              {info}
            </div>
          )}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              {error}
            </div>
          )}

          {/* GİRİŞ */}
          {mode === "login" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@sigorta.az"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Şifrə</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Daxil ol
              </Button>
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setInfo("");
                  setResetEmail(email);
                }}
                className="w-full text-sm text-primary hover:underline text-center"
              >
                Şifrəmi unutdum?
              </button>
            </form>
          )}

          {/* ŞİFRƏMİ UNUTDUM — sorğu */}
          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="email@sigorta.az"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
                <p className="text-xs text-muted-foreground">
                  Sorğunuz admin təsdiqinə göndəriləcək. Təsdiqləndikdən sonra yeni şifrə təyin edə bilərsiniz.
                </p>
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Davam et
              </Button>
              <button
                type="button"
                onClick={goLogin}
                className="w-full text-sm text-muted-foreground hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Girişə qayıt
              </button>
            </form>
          )}

          {/* YENİ ŞİFRƏ TƏYİNİ */}
          {mode === "reset" && (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Yeni şifrə</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Yeni şifrə (təkrar)</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Şifrəni dəyiş
              </Button>
              <button
                type="button"
                onClick={goLogin}
                className="w-full text-sm text-muted-foreground hover:underline flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Girişə qayıt
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
