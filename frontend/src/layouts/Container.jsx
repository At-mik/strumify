export const Container = ({ children, className = "" }) => (
  <div className={`mx-auto max-w-[1200px] px-6 py-8 ${className}`}>{children}</div>
);
