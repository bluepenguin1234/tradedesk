export function Greeting({ firstName }: { firstName: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const name = firstName ? `, ${firstName}` : '';

  return (
    <>
      <h1 className="text-3xl text-[#0f0f0f] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
        {greeting}{name}.
      </h1>
      <p className="text-[#9ca3af] text-sm font-light mb-10">{date}.</p>
    </>
  );
}
