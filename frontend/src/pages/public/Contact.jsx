import { Link } from 'react-router-dom';
import { Mail, MapPin, Globe } from 'lucide-react';
import SEOHead, { SOFTWARE_APP_SCHEMA } from '../../components/SEOHead';

export default function Contact() {
  return (
    <>
      <SEOHead
        title="Contact – FactureApp"
        description="Contactez l'équipe FactureApp pour toute question sur notre logiciel de facturation en ligne pour les PME et freelances de la zone UEMOA."
        canonical="/contact"
        jsonLd={[SOFTWARE_APP_SCHEMA]}
      />

      <div className="min-h-screen bg-white">

        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">
            <Link to="/" className="text-xl font-bold text-gray-900" aria-label="FactureApp — Accueil">
              FactureApp
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/fonctionnalites" className="text-sm text-gray-600 hover:text-primary-600">Fonctionnalités</Link>
              <Link to="/tarifs" className="text-sm text-gray-600 hover:text-primary-600">Tarifs</Link>
              <Link to="/register" className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </nav>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Contactez-nous</h1>
            <p className="text-lg text-gray-600">
              Une question sur notre logiciel de facturation Sénégal ? Notre équipe est là pour vous aider.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Nos coordonnées</h2>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email</p>
                  <a href="mailto:contact@innosft.com" className="text-primary-600 hover:underline text-sm">
                    contact@innosft.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Localisation</p>
                  <p className="text-gray-600 text-sm">Dakar, Sénégal — Zone UEMOA</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-primary-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Site web</p>
                  <a href="https://facture.innosft.com" className="text-primary-600 hover:underline text-sm">
                    facture.innosft.com
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Envoyez-nous un message</h2>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="space-y-4"
                aria-label="Formulaire de contact"
              >
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="Mamadou Diallo"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="email@exemple.sn"
                  />
                </div>
                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
                    placeholder="Votre question sur FactureApp..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </div>
        </main>

        <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400" role="contentinfo">
          <p>© {new Date().getFullYear()} FactureApp by Innosoft — <Link to="/legal/cgu" className="hover:underline">CGU</Link> · <Link to="/legal/privacy" className="hover:underline">Confidentialité</Link></p>
        </footer>
      </div>
    </>
  );
}
