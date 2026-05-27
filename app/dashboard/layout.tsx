import { BottomNav } from './_components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <main className="max-w-2xl mx-auto pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
