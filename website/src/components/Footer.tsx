import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-[1200px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Wordmark */}
        <span className="text-white font-bold text-sm tracking-tight">Sorelax</span>

        {/* Center: Attribution */}
        <span className="text-text-tertiary text-xs">Built for the Coral Hackathon</span>

        {/* Right: Links */}
        <div className="flex items-center gap-4">
          <Link
            to="/docs"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Docs
          </Link>
          <Link
            to="/github"
            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  );
}
