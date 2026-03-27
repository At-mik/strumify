export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-[#101010]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-1 px-4 py-5 text-center md:flex-row md:px-6 md:text-left">
        <p className="text-sm text-gray-400">© {year} Strumify. All rights reserved.</p>
        <p className="text-sm text-gray-400">Built by Atmik Shilajiya</p>
      </div>
    </footer>
  );
};
