import { Link } from 'react-router-dom';
import SEOHead from '../../components/SEOHead';

export default function Privacy() {
  return (
    <>
      <SEOHead
        title="Politique de Confidentialité – FactureApp"
        description="Politique de confidentialité de FactureApp. Découvrez comment nous collectons, utilisons et protégeons vos données personnelles."
        canonical="/legal/privacy"
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

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
          <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="space-y-8 text-gray-600 text-sm leading-relaxed">
            <section aria-labelledby="priv-collecte">
              <h2 id="priv-collecte" className="text-xl font-bold text-gray-900 mb-3">1. Données collectées</h2>
              <p>
                FactureApp collecte les données suivantes pour fournir son service de facturation en ligne :
              </p>
              <ul className="mt-3 space-y-1 list-disc list-inside">
                <li>Informations de compte : nom, email, mot de passe (chiffré)</li>
                <li>Données de l'organisation : nom de l'entreprise, coordonnées</li>
                <li>Données commerciales : clients, produits, factures, devis</li>
                <li>Données d'utilisation : logs de connexion, actions sur la plateforme</li>
              </ul>
            </section>

            <section aria-labelledby="priv-utilisation">
              <h2 id="priv-utilisation" className="text-xl font-bold text-gray-900 mb-3">2. Utilisation des données</h2>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul className="mt-3 space-y-1 list-disc list-inside">
                <li>Fournir les services de facturation et de gestion documentaire</li>
                <li>Vous envoyer des notifications liées à votre compte</li>
                <li>Améliorer la qualité de notre logiciel de facturation Sénégal</li>
                <li>Assurer la sécurité de votre compte</li>
              </ul>
            </section>

            <section aria-labelledby="priv-partage">
              <h2 id="priv-partage" className="text-xl font-bold text-gray-900 mb-3">3. Partage des données</h2>
              <p>
                Innosoft ne vend, ne loue ni ne partage vos données personnelles à des tiers à des fins commerciales.
                Vos données peuvent être partagées uniquement avec des prestataires techniques nécessaires
                au fonctionnement du service (hébergement, messagerie), liés par des obligations de confidentialité strictes.
              </p>
            </section>

            <section aria-labelledby="priv-securite">
              <h2 id="priv-securite" className="text-xl font-bold text-gray-900 mb-3">4. Sécurité</h2>
              <p>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
                vos données contre tout accès non autorisé, perte ou destruction :
                chiffrement des mots de passe (bcrypt), connexions HTTPS/TLS, sauvegardes régulières.
              </p>
            </section>

            <section aria-labelledby="priv-droits">
              <h2 id="priv-droits" className="text-xl font-bold text-gray-900 mb-3">5. Vos droits</h2>
              <p>
                Conformément aux lois applicables, vous disposez des droits suivants sur vos données :
              </p>
              <ul className="mt-3 space-y-1 list-disc list-inside">
                <li>Droit d'accès et de rectification</li>
                <li>Droit à l'effacement (« droit à l'oubli »)</li>
                <li>Droit à la portabilité des données</li>
                <li>Droit d'opposition au traitement</li>
              </ul>
              <p className="mt-3">
                Pour exercer ces droits, contactez-nous à{' '}
                <a href="mailto:contact@innosft.com" className="text-primary-600 hover:underline">
                  contact@innosft.com
                </a>.
              </p>
            </section>

            <section aria-labelledby="priv-cookies">
              <h2 id="priv-cookies" className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
              <p>
                FactureApp utilise des cookies techniques strictement nécessaires au fonctionnement de la plateforme
                (authentification, préférences). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.
              </p>
            </section>

            <section aria-labelledby="priv-conservation">
              <h2 id="priv-conservation" className="text-xl font-bold text-gray-900 mb-3">7. Conservation des données</h2>
              <p>
                Vos données sont conservées pendant toute la durée de votre abonnement actif,
                puis pendant 12 mois après résiliation, conformément aux obligations légales applicables.
              </p>
            </section>

            <section aria-labelledby="priv-contact">
              <h2 id="priv-contact" className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
              <p>
                Délégué à la Protection des Données — Innosoft<br />
                Email : <a href="mailto:contact@innosft.com" className="text-primary-600 hover:underline">contact@innosft.com</a><br />
                Adresse : Dakar, Sénégal
              </p>
            </section>
          </div>
        </main>

        <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400" role="contentinfo">
          <p>© {new Date().getFullYear()} FactureApp by Innosoft — <Link to="/legal/cgu" className="hover:underline">CGU</Link></p>
        </footer>
      </div>
    </>
  );
}
