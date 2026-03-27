export const Button = ({ mode = "mature", variant = "primary", className = "", children, ...props }) => {
  const maturePrimary = "bg-[#38bdf8] text-[#03101a] hover:bg-[#67d0fc]";
  const matureSecondary = "border border-[#3c91c1]/55 bg-transparent text-[#c9efff] hover:border-[#67bce7] hover:text-[#e6f7ff]";

  const kidsPrimary = "bg-[#8b5cf6] text-white hover:bg-[#9d78fb]";
  const kidsSecondary = "border border-[#9a77e8]/60 bg-[#2c2048]/45 text-[#e0d5ff] hover:border-[#b79df5] hover:text-[#f2ecff]";

  const tone =
    mode === "kids"
      ? variant === "secondary"
        ? kidsSecondary
        : kidsPrimary
      : variant === "secondary"
        ? matureSecondary
        : maturePrimary;

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition duration-200 ${tone} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
