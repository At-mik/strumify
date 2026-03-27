export const ProgressBar = ({ mode = "mature", label, value = 0, total = 1 }) => {
  const safeTotal = total > 0 ? total : 1;
  const safeValue = value > 0 ? value : 0;
  const percent = Math.max(0, Math.min(100, Math.round((safeValue / safeTotal) * 100)));

  const trackClass = mode === "kids" ? "bg-[#261d3f]" : "bg-[#1f1f1f]";
  const fillClass = mode === "kids" ? "bg-[#8b5cf6]" : "bg-[#38bdf8]";
  const textClass = mode === "kids" ? "text-[#ddceff]" : "text-[#c9efff]";

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between text-sm ${textClass}`}>
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div className={`h-3 overflow-hidden rounded-full ${trackClass}`}>
        <div className={`h-full rounded-full transition-all duration-300 ${fillClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
