export const Card = ({ mode = "mature", className = "", children, interactive = false }) => {
  const matureBase = "rounded-2xl border border-white/10 bg-[#161616]";
  const kidsBase = "rounded-2xl border border-[#9b7bea]/35 bg-[#1c1531]";
  const base = mode === "kids" ? kidsBase : matureBase;

  const motion = interactive
    ? mode === "kids"
      ? "transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(34,211,238,0.24)]"
      : "transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_18px_rgba(245,158,11,0.24)]"
    : "";

  return <article className={`${base} p-6 ${motion} ${className}`}>{children}</article>;
};
