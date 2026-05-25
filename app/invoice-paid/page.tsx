export default function InvoicePaid() {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex items-center justify-center px-6">
      <div className="max-w-sm w-full bg-white border border-[#e5e7eb] rounded-2xl p-10 text-center">
        <div className="w-14 h-14 bg-[#15803d] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-medium text-[#0f0f0f] mb-2">Payment received</h1>
        <p className="text-sm text-[#6b7280]">
          Your payment has been processed. You&apos;ll receive a confirmation shortly.
        </p>
      </div>
    </div>
  );
}
