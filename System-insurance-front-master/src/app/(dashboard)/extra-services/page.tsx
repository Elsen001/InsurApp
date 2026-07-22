"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function ExtraServicesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Əlavə xidmətlər</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center text-center py-20 gap-3">
          <span className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles size={26} />
          </span>
          <p className="text-lg font-semibold text-slate-800">Əlavə xidmətlər bölməsi</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Bu bölmə əlavə xidmətlər üçün hazırlanır. Buraya hansı xidmətlərin əlavə olunacağını bildirin — sizin üçün qurum.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
