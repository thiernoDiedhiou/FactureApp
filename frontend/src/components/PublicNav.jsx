import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { to: '/fonctionnalites', label: 'Fonctionnalités' },
  { to: '/tarifs', label: 'Tarifs' },
  { to: '/contact', label: 'Contact' },
];

const BrandLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-9 h-9 flex-shrink-0" aria-hidden="true">
    <rect width="100" height="100" rx="20" fill="#00C8D7"/>
    <polyline points="12,33 22,44 38,24" stroke="white" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="46" y1="29" x2="85" y2="29" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="46" y1="40" x2="72" y2="40" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="12" y1="56" x2="85" y2="56" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <line x1="12" y1="68" x2="68" y2="68" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    <text x="28" y="92" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="bold" fill="white" textAnchor="middle">f</text>
    <line x1="18" y1="82" x2="36" y2="82" stroke="white" strokeWidth="4.5" strokeLinecap="round"/>
  </svg>
);

export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0" aria-label="CFActure — Accueil">
          <BrandLogo />
          <span className="text-xl font-bold text-gray-900">CFActure</span>
        </Link>

        {/* Liens — desktop */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition-colors ${
                isActive(to) ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA — desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors">
            Connexion
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            Essayer gratuitement
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        {/* Hamburger — mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Menu mobile déroulant */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3 shadow-lg">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`text-sm font-medium py-2 transition-colors ${
                isActive(to) ? 'text-primary-600' : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              {label}
            </Link>
          ))}
          <hr className="border-gray-100 my-1" />
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-gray-700 hover:text-primary-600 py-2 transition-colors"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="inline-flex items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors"
          >
            Essayer gratuitement
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </header>
  );
}
