import Link from "next/link";
import Nav from "@/components/Nav";

export default function Login() {
  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <div className="px-8 py-16 max-w-6xl mx-auto">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl text-[#0f0f0f] mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Log in.
          </h1>
          <p className="text-[#9ca3af] font-light text-sm mb-8">Welcome back.</p>

          <div className="border border-[#e5e7eb] rounded-2xl p-8">
            <form action="/api/auth/login" method="POST" className="space-y-5">
              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="john@smithplumbing.com"
                  className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#9ca3af] uppercase tracking-[0.15em] font-medium mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Your password"
                  className="w-full bg-white border border-[#e5e7eb] text-[#0f0f0f] px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-[#15803d] placeholder-[#d1d5db]"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#15803d] text-white py-3.5 rounded-full font-medium text-sm hover:bg-[#14532d] transition-colors"
              >
                Log in →
              </button>
            </form>
            <p className="text-center text-[#9ca3af] text-xs mt-6 font-light">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-[#15803d] hover:underline">Start free trial</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
