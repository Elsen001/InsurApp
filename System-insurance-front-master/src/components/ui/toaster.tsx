"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-white text-sm max-w-sm",
      type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-blue-600"
    )}>
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto text-white/80 hover:text-white">✕</button>
    </div>
  );
}

interface ToastState { message: string; type: "success" | "error" | "info"; }
const ToastContext = React.createContext<{ show: (msg: string, type?: "success"|"error"|"info") => void }>({ show: () => {} });

export function Toaster() {
  const [toast, setToast] = React.useState<ToastState | null>(null);
  return (
    <ToastContext.Provider value={{ show: (msg, type = "info") => setToast({ message: msg, type }) }}>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export const useToast = () => React.useContext(ToastContext);
