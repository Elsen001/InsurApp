"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";

type Mode = "login" | "forgot" | "reset";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Şifrə bərpası vəziyyəti
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Email və ya şifrə yanlışdır");
      setLoading(false);
    } else {
      router.push("/dashboard");
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
