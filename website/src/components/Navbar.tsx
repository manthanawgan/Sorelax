import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
        {/* Left: Wordmark */}
        <Link to="/" className="text-white font-bold text-lg tracking-tight hover:opacity-80 transition-opacity">
          Sorelax
        </Link>

        {/* Right: Nav links */}
        <div className="flex items-center gap-6">
          <Link
            to="/docs"
            className={`text-sm transition-colors duration-200 ${
              isActive('/docs') ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Docs
          </Link>
          <Link
            to="/github"
            className={`text-sm transition-colors duration-200 ${
              isActive('/github') ? 'text-white' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            GitHub
          </Link>
        </div>
      </div>
    </nav>
  );
}
