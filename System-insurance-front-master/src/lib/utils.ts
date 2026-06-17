import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POLICY_TYPE_LABELS: Record<string, string> = {
  auto: "İcbari avtomobil sığortası",
  casco: "Kasko",
  property: "Əmlak",
  travel: "Səfər",
};

export const STATUS_LABELS: Record<string, string> = {
  active: "Aktiv",
  expired: "Bitmiş",
  cancelled: "Ləğv edilmiş",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Gözləyir",
  paid: "Ödənilib",
  overdue: "Gecikmiş",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
};

export const POLICY_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  expired: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("az-AZ", { style: "currency", currency: "AZN", minimumFractionDigits: 2 }).format(amount);

export const formatDate = (date: string | Date) =>
  new Date(date).toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric" });

export const formatDateTime = (date: string | Date) =>
  new Date(date).toLocaleString("az-AZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
