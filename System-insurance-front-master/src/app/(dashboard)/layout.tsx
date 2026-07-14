import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/board/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 pt-16 lg:pt-6">
          <TopBar />
          {children}
        </div>
      </main>
    </div>
  );
}
