import { Link } from "react-router-dom";
import { Container } from "../layouts/Container";

export const NotFoundPage = () => (
  <div className="min-h-screen bg-[#0f0f0f] text-brand-text">
    <Container className="flex items-center justify-center">
      <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#161616] p-8 text-center">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-brand-text/65">This route is not part of Strumify.</p>
        <Link to="/" className="mt-6 inline-flex rounded-lg bg-brand-amber px-4 py-2 font-semibold text-black">
          Go Home
        </Link>
      </section>
    </Container>
  </div>
);
