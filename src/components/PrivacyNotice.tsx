export default function PrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-4 tracking-wide text-white/60 ${className}`}>
      🔒 Your photo is used only for this experience and is not saved.
      <span className="hidden sm:inline"> Not facial recognition — just a fun visual resemblance game.</span>
    </p>
  );
}
