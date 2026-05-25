import Link from "next/link";

const statuses = ["Lead", "Quoted", "In Progress", "Complete", "Invoiced", "Paid"];

export default function Projects() {
  return (
    <div className="px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0f0f0f]" style={{ fontFamily: "var(--font-serif)" }}>Projects</h1>
          <p className="text-[#9ca3af] text-sm font-light mt-1">Every job from first inquiry to final payment.</p>
        </div>
        <Link href="/dashboard/projects/new" className="bg-[#15803d] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors">
          New Project →
        </Link>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {statuses.map((s) => (
          <button key={s} className="text-xs px-3 py-1.5 rounded-full border border-[#e5e7eb] text-[#6b7280] hover:border-[#15803d] hover:text-[#15803d] transition-colors font-medium">
            {s}
          </button>
        ))}
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
        <p className="text-[#9ca3af] text-sm font-light">No projects yet. Create your first one.</p>
      </div>
    </div>
  );
}
