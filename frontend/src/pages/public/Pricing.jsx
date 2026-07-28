import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNav from '../../components/PublicNav';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import SEOHead, { SOFTWARE_APP_SCHEMA, FAQ_SCHEMA } from '../../components/SEOHead';
import api from '../../utils/api';

// Configuration d'affichage par clé de plan — découplée du prix/features (viennent de l'API)
const PLAN_META = {
  FREE: {
    label:    'Gratuit',
    highlight: false,
    cta:      'Créer un compte gratuit',
    ctaLink:  '/register'
  },
  STARTER: {
    label:    'Starter',
    highlight: false,
    cta:      'Commencer',
    ctaLink:  '/register'
  },
  PRO: {
    label:    'Pro',
    highlight: true,
    badge:    'Le plus populaire',
    cta:      'Essayer gratuitement',
    ctaLink:  '/register'
  },
  ENTERPRISE: {
    label:    'Enterprise',
    highlight: false,
    cta:      "Contacter l'équipe",
    ctaLink:  '/contact'
  }
};

const FAQS = [
  {
    q: "Qu'est-ce que CFActure ?",
    a: "CFActure est un logiciel de facturation en ligne conçu pour les PME, freelances et entreprises de la zone UEMOA. Il permet de créer, envoyer et gérer des factures, devis et proformas en Franc CFA (XOF) en quelques clics, depuis n'importe quel appareil.",
  },
  {
    q: 'CFActure est-il compatible avec la TVA au Sénégal ?',
    a: "Oui. CFActure intègre nativement la TVA Sénégal (18 %), préconfigurée et applicable automatiquement sur vos factures. Vous pouvez également personnaliser les taux pour d'autres pays de la zone UEMOA.",
  },
  {
    q: 'Puis-je envoyer des factures par WhatsApp ?',
    a: "Oui. CFActure génère un PDF de votre facture en un clic que vous pouvez envoyer directement par WhatsApp, email ou tout autre canal de votre choix.",
  },
  {
    q: "Combien de membres puis-je inviter ?",
    a: "Cela dépend de votre plan. Les plans payants permettent d'inviter plusieurs collaborateurs avec des rôles distincts (Admin, Membre). Consultez les détails ci-dessus pour chaque plan.",
  },
  {
    q: "Comment inviter un membre dans mon organisation ?",
    a: "Depuis votre espace Organisation, cliquez sur « Inviter un membre », saisissez l'adresse email de votre collaborateur et choisissez son rôle. Il recevra un email d'invitation.",
  },
];

function PlanCard({ plan }) {
  const meta     = PLAN_META[plan.key] || { label: plan.key, highlight: false, cta: 'Commencer', ctaLink: '/register' };
  const features = Array.isArray(plan.features) ? plan.features : [];
  const isEnterprise = plan.key === 'ENTERPRISE';
  const isFree       = plan.price === 0 && !isEnterprise;

  const priceDisplay = isEnterprise && plan.price === 0
    ? 'Sur devis'
    : isFree
      ? '0'
      : plan.price.toLocaleString('fr-FR');

  const periodDisplay = isEnterprise && plan.price === 0
    ? ''
    : isFree
      ? 'XOF pour toujours'
      : 'XOF / mois';

  return (
    <article
      className={`rounded-2xl p-7 border flex flex-col ${
        meta.highlight
          ? 'bg-gradient-to-br from-[#00C8D7] to-[#007a87] text-white border-transparent shadow-xl md:scale-105'
          : 'bg-white border-gray-200 shadow-sm'
      }`}
    >
      {meta.badge && (
        <div className="inline-block bg-white/20 border border-white/30 rounded-full text-xs font-semibold px-3 py-1 mb-3 self-start">
          {meta.badge}
        </div>
      )}

      <h2 className={`text-xl font-bold mb-1 ${meta.highlight ? 'text-white' : 'text-gray-900'}`}>
        {meta.label}
      </h2>

      {plan.description && (
        <p className={`text-xs mb-4 ${meta.highlight ? 'text-white/70' : 'text-gray-500'}`}>
          {plan.description}
        </p>
      )}

      {/* Prix */}
      <div className="flex items-baseline gap-1.5 mb-6 flex-wrap">
        <span className={`font-extrabold leading-none ${
          meta.highlight ? 'text-white' : 'text-gray-900'
        } ${priceDisplay.length > 5 ? 'text-3xl' : 'text-4xl'}`}>
          {priceDisplay}
        </span>
        {periodDisplay && (
          <span className={`text-sm ${meta.highlight ? 'text-white/80' : 'text-gray-500'}`}>
            {periodDisplay}
          </span>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <ul className="space-y-2.5 mb-8 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <CheckCircle
                className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.highlight ? 'text-white/90' : 'text-primary-500'}`}
                aria-hidden="true"
              />
              <span className={meta.highlight ? 'text-white/90' : 'text-gray-700'}>{f}</span>
            </li>
          ))}
        </ul>
      )}

      <Link
        to={meta.ctaLink}
        className={`mt-auto w-full inline-flex items-center justify-center gap-2 font-semibold py-3 px-6 rounded-xl transition-colors ${
          meta.highlight
            ? 'bg-white text-primary-700 hover:bg-gray-50'
            : isFree
              ? 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              : 'bg-primary-500 text-white hover:bg-primary-600'
        }`}
      >
        {meta.cta}
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

function PlanSkeleton() {
  return (
    <div className="rounded-2xl p-7 border border-gray-100 bg-white shadow-sm animate-pulse">
      <div className="h-5 bg-gray-100 rounded w-1/3 mb-3" />
      <div className="h-10 bg-gray-100 rounded w-1/2 mb-6" />
      <div className="space-y-3 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-4 bg-gray-100 rounded w-full" />
        ))}
      </div>
      <div className="h-11 bg-gray-100 rounded-xl" />
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    api.get('/plans')
      .then(r => setPlans(r.data.data.plans))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Grille responsive selon le nombre de plans actifs
  const gridClass = plans.length <= 3
    ? 'grid grid-cols-1 md:grid-cols-3 gap-6 items-start'
    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start';

  return (
    <>
      <SEOHead
        title="Tarifs – Plans d'abonnement CFActure pour PME et Freelances"
        description="Choisissez le plan adapté à votre activité. Facturation illimitée, gestion des membres, support UEMOA. Essayez CFActure dès aujourd'hui."
        canonical="/tarifs"
        jsonLd={[SOFTWARE_APP_SCHEMA, FAQ_SCHEMA]}
      />

      <div className="min-h-screen bg-white">
        <PublicNav />

        {/* Hero */}
        <section className="text-center py-14 px-4 bg-gray-50 border-b border-gray-100">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Des tarifs adaptés à chaque activité
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le plan adapté à votre taille. Tous les plans incluent la{' '}
            <strong>TVA Sénégal 18 % modifiable</strong> préconfigurée
            et le support pour les entreprises de la zone UEMOA.
          </p>
        </section>

        {/* Plans */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <PlanSkeleton key={i} />)}
            </div>
          ) : error ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg mb-2">Impossible de charger les plans.</p>
              <button
                onClick={() => { setError(false); setLoading(true); api.get('/plans').then(r => setPlans(r.data.data.plans)).catch(() => setError(true)).finally(() => setLoading(false)); }}
                className="text-primary-600 hover:underline text-sm"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className={gridClass} aria-label="Plans d'abonnement">
              {plans.map(plan => <PlanCard key={plan.key} plan={plan} />)}
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            Tous les prix sont en Franc CFA (XOF) · TVA non applicable (exonération UEMOA selon pays)
          </p>
        </main>

        {/* FAQ */}
        <section className="bg-gray-50 border-t border-gray-100 py-14 px-4" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <h2 id="faq-heading" className="text-3xl font-bold text-gray-900 text-center mb-10">
              Questions fréquentes sur CFActure
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

        {/* Footer */}
        <footer className="py-6 border-t border-gray-100 text-center text-xs text-gray-400" role="contentinfo">
          <p>
            © {new Date().getFullYear()} CFActure by Innosoft —{' '}
            <Link to="/legal/cgu" className="hover:underline">CGU</Link> ·{' '}
            <Link to="/legal/privacy" className="hover:underline">Confidentialité</Link>
          </p>
        </footer>
      </div>
    </>
  );
}
