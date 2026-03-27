import { useEffect, useState } from "react";

import { IconInstagram, IconMail, IconWhatsapp, IconYoutube } from "./Icons";

const contactLinks = [
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/@Strumify-in",
    detail: "Watch lessons and updates",
    Icon: IconYoutube
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/strumify.in/",
    detail: "Follow daily practice clips",
    Icon: IconInstagram
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://chat.whatsapp.com/Kh5YmYY9Ru81LZiPNV3j4z?mode=gi_t",
    detail: "Join the Strumify community",
    Icon: IconWhatsapp
  },
  {
    id: "email",
    label: "Email",
    href: "mailto:strumify.in@gmail.com",
    detail: "strumify.in@gmail.com",
    Icon: IconMail
  }
];

export const GlobalContactModal = ({ open, onClose }) => {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowForm(false);
      return;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6">
      <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#111111]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="text-lg font-semibold text-white">Connect with Strumify</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm text-gray-200 transition hover:border-[#f0b64f] hover:text-[#f7d79c]"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid gap-3 md:grid-cols-2">
            {contactLinks.map(({ id, label, href, detail, Icon }) => (
              <a
                key={id}
                href={href}
                target={href.startsWith("mailto:") ? "_self" : "_blank"}
                rel="noreferrer"
                className="rounded-xl border border-white/10 bg-[#161616] p-5 transition hover:scale-[1.03] hover:border-[#f0b64f]/60"
              >
                <Icon className="h-5 w-5 text-[#f7c16f]" />
                <h3 className="mt-3 text-base font-semibold text-white">{label}</h3>
                <p className="mt-1 text-sm text-gray-300">{detail}</p>
              </a>
            ))}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex rounded-xl border border-[#d59d38]/60 bg-[#1b160f] px-4 py-2 text-sm font-semibold text-[#f7d79c] transition hover:scale-[1.03] hover:border-[#f0b64f]"
            >
              📄 Contact Form
            </button>
          </div>

          {showForm ? (
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <div className="h-[62vh] overflow-auto bg-[#0f0f0f]">
                <iframe
                  title="Strumify contact form"
                  src="https://docs.google.com/forms/d/e/1FAIpQLScXevIF1-i4zSCZGGhrYaj77rLv0O_5-OFpQIQCFwamCm12og/viewform?embedded=true"
                  className="h-[1300px] w-full border-0"
                >
                  Loading…
                </iframe>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
