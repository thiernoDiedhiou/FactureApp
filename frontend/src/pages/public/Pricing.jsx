import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import SEOHead, { SOFTWARE_APP_SCHEMA, FAQ_SCHEMA } from '../../components/SEOHead';

const PLANS = [
  {
    name: 'Gratuit',
    price: '0',
    currency: 'XOF',
    period: 'pour toujours',
    highlight: false,
    features: [
      '10 factures par mois',
      '5 clients',
      '1 organisation',
      'Export PDF',
      'TVA Sénégal préconfigurée',
    ],
    cta: 'Créer un compte gratuit',
    ctaLink: '/register',
  },
  {
    name: 'PME',
    price: '9 900',
    currency: 'XOF',
    period: '/ mois',
    highlight: true,
    badge: 'Le plus populaire',
    features: [
      'Factures illimitées',
      'Clients illimités',
      '3 organisations',
      'Export PDF & email',
      'Envoi WhatsApp intégré',
      'Gestion des membres',
      'Support prioritaire',
    ],
    cta: 'Essayer gratuitement',
    ctaLink: '/register',
  },
  {
    name: 'Entreprise',
    price: '24 900',
    currency: 'XOF',
    period: '/ mois',
    highlight: false,
    features: [
      'Tout du plan PME',
      'Organisations illimitées',
      'Membres illimités',
      'Import/export CSV',
      'Personnalisation avancée',
      'Support dédié',
    ],
    cta: 'Contacter l\'équipe',
    ctaLink: '/contact',
  },
];

const FAQS = [
  {
    q: "Qu'est-ce que FactureApp ?",
    a: "FactureApp est un logiciel de facturation en ligne conçu pour les PME, freelances et entreprises de la zone UEMOA. Il permet de créer, envoyer et gérer des factures, devis et proformas en Franc CFA (XOF) en quelques clics, depuis n'importe quel appareil.",
  },
  {
    q: 'FactureApp est-il compatible avec la TVA au Sénégal ?',
    a: "Oui. FactureApp intègre nativement la TVA Sénégal (18 %), préconfigurée et applicable automatiquement sur vos factures. Vous pouvez également personnaliser les taux pour d'autres pays de la zone UEMOA.",
  },
  {
    q: 'Puis-je envoyer des factures par WhatsApp ?',
    a: "Oui. FactureApp génère un PDF de votre facture en un clic que vous pouvez envoyer directement par WhatsApp, email ou tout autre canal de votre choix. C'est particulièrement adapté aux pratiques commerciales en Afrique de l'Ouest.",
  },
  {
    q: "Combien d'organisations puis-je gérer ?",
    a: "Selon votre plan, vous pouvez gérer une ou plusieurs organisations depuis un seul compte FactureApp. Les plans supérieurs permettent la gestion multi-organisations idéale pour les cabinets comptables ou groupes d'entreprises.",
  },
  {
    q: "Comment inviter un membre dans mon organisation ?",
    a: "Depuis votre espace Organisation, cliquez sur « Inviter un membre », saisissez l'adresse email de votre collaborateur et choisissez son rôle. Il recevra un email d'invitation pour rejoindre votre organisation sur FactureApp.",
  },
];

export default function Pricing() {
  return (
    <>
      <SEOHead
        title="Tarifs – Plans d'abonnement FactureApp pour PME et Freelances"
        description="Choisissez le plan adapté à votre activité. Facturation illimitée, multi-organisations, gestion des membres. Essayez FactureApp dès aujourd'hui."
        canonical="/tarifs"
        jsonLd={[SOFTWARE_APP_SCHEMA, FAQ_SCHEMA]}
      />

      <div className="min-h-screen bg-white">

        {/* ── Nav ── */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">
            <Link to="/" className="text-xl font-bold text-gray-900" aria-label="FactureApp — Accueil">
              FactureApp
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/fonctionnalites" className="text-sm text-gray-600 hover:text-primary-600">Fonctionnalités</Link>
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600">Connexion</Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section className="text-center py-14 px-4 bg-gray-50 border-b border-gray-100">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Des tarifs adaptés à chaque activité
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le plan adapté à votre taille. Tous les plans incluent la <strong>TVA Sénégal 18 %</strong> préconfigurée
            et le support pour les entreprises de la zone UEMOA.
          </p>
        </section>

        {/* ── Plans ── */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start" aria-label="Plans d'abonnement">
            {PLANS.map((plan) => (
              <article
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-[#00C8D7] to-[#007a87] text-white border-transparent shadow-xl scale-105'
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="inline-block bg-white/20 border border-white/30 rounded-full text-xs font-semibold px-3 py-1 mb-3">
                    {plan.badge}
                  </div>
                )}
                <h2 className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h2>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-white/80' : 'text-gray-500'}`}>
                    {plan.currency} {plan.period}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-white/90' : 'text-primary-500'}`}
                        aria-hidden="true"
                      />
                      <span className={plan.highlight ? 'text-white/90' : 'text-gray-700'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={plan.ctaLink}
                  className={`w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${
                    plan.highlight
                      ? 'bg-white text-primary-700 hover:bg-gray-50'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Tous les prix sont en Franc CFA (XOF) · TVA non applicable (exonération UEMOA selon pays)
          </p>
        </main>

        {/* ── FAQ ── */}
        <section className="bg-gray-50 border-t border-gray-100 py-14 px-4" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 text-center mb-10">
              Questions fréquentes sur FactureApp
            </h2>
            <div className="space-y-6">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="bg-white rounded-xl border border-gray-200 p-6 group">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-center justify-between gap-4">
                    {q}
                    <span className="text-primary-500 text-xl leading-none select-none group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer minimal ── */}
        <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400" role="contentinfo">
          <p>© {new Date().getFullYear()} FactureApp by Innosoft — <Link to="/legal/cgu" className="hover:underline">CGU</Link> · <Link to="/legal/privacy" className="hover:underline">Confidentialité</Link></p>
        </footer>

      </div>
    </>
  );
}
