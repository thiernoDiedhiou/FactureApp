import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

export default function CGU() {
  return (
    <>
      <SEOHead
        title="Conditions Générales d'Utilisation – FactureApp"
        description="Conditions générales d'utilisation de FactureApp, logiciel de facturation en ligne pour les PME et freelances de la zone UEMOA."
        canonical="/legal/cgu"
      />

      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">
            <Link to="/" className="text-xl font-bold text-gray-900" aria-label="FactureApp — Accueil">
              FactureApp
            </Link>
            <Link to="/register" className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Essayer gratuitement
            </Link>
          </nav>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose prose-gray">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section className="mb-8" aria-labelledby="cgu-objet">
            <h2 id="cgu-objet" className="text-xl font-bold text-gray-900 mb-3">1. Objet</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de FactureApp,
              logiciel de facturation en ligne édité par Innosoft, accessible à l'adresse
              <a href="https://facture.innosft.com" className="text-primary-600 hover:underline mx-1">https://facture.innosft.com</a>.
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-service">
            <h2 id="cgu-service" className="text-xl font-bold text-gray-900 mb-3">2. Description du service</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              FactureApp est une application SaaS de facturation en ligne destinée aux PME, freelances et entreprises
              de la zone UEMOA (Sénégal, Côte d'Ivoire, Mali, Burkina Faso et autres pays membres).
              Elle permet la création, la gestion et l'envoi de factures, devis et proformas en Franc CFA (XOF).
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-compte">
            <h2 id="cgu-compte" className="text-xl font-bold text-gray-900 mb-3">3. Création de compte</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              L'accès aux fonctionnalités de FactureApp nécessite la création d'un compte utilisateur.
              L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité
              de ses identifiants de connexion.
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-utilisation">
            <h2 id="cgu-utilisation" className="text-xl font-bold text-gray-900 mb-3">4. Utilisation acceptable</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              L'utilisateur s'engage à utiliser FactureApp conformément aux lois et réglementations en vigueur
              dans son pays et dans la zone UEMOA, notamment en matière fiscale et comptable.
              Toute utilisation à des fins frauduleuses est strictement interdite.
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-donnees">
            <h2 id="cgu-donnees" className="text-xl font-bold text-gray-900 mb-3">5. Données et confidentialité</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les données saisies par l'utilisateur restent sa propriété. Innosoft s'engage à ne pas vendre
              ni partager ces données à des tiers sans consentement explicite. Pour plus de détails,
              consultez notre{' '}
              <Link to="/legal/privacy" className="text-primary-600 hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-responsabilite">
            <h2 id="cgu-responsabilite" className="text-xl font-bold text-gray-900 mb-3">6. Limitation de responsabilité</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Innosoft met tout en œuvre pour assurer la disponibilité et la fiabilité de FactureApp.
              Toutefois, Innosoft ne saurait être tenu responsable des interruptions de service, pertes de données
              résultant de cas de force majeure ou de défaillances techniques indépendantes de sa volonté.
            </p>
          </section>

          <section className="mb-8" aria-labelledby="cgu-droit">
            <h2 id="cgu-droit" className="text-xl font-bold text-gray-900 mb-3">7. Droit applicable</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Les présentes CGU sont soumises au droit sénégalais. Tout litige sera soumis à la compétence
              exclusive des tribunaux de Dakar, Sénégal.
            </p>
          </section>

          <section aria-labelledby="cgu-contact">
            <h2 id="cgu-contact" className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pour toute question relative aux présentes CGU, contactez-nous à{' '}
              <a href="mailto:contact@innosft.com" className="text-primary-600 hover:underline">contact@innosft.com</a>.
            </p>
          </section>
        </main>

        <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400" role="contentinfo">
          <p>© {new Date().getFullYear()} FactureApp by Innosoft — <Link to="/legal/privacy" className="hover:underline">Confidentialité</Link></p>
        </footer>
      </div>
    </>
  );
}
