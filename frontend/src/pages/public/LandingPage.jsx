import { Link } from 'react-router-dom';
import {
  FileText, Send, Users, CheckCircle, Zap, Shield,
  Globe, ArrowRight, Star, ChevronRight,
} from 'lucide-react';
import SEOHead, { SOFTWARE_APP_SCHEMA, WEBSITE_SCHEMA } from '../../components/SEOHead';

/* ── Données ─────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: FileText,
    title: 'Factures & Devis en un clic',
    desc: 'Créez vos factures, devis et proformas professionnels en quelques secondes. Génération PDF instantanée pour la zone UEMOA.',
  },
  {
    icon: CheckCircle,
    title: 'TVA Sénégal 18 % préconfigurée',
    desc: 'La TVA Sénégal (18 %) est intégrée par défaut. Conforme aux exigences fiscales UEMOA, applicable en un clic.',
  },
  {
    icon: Send,
    title: 'Envoi par email & WhatsApp',
    desc: 'Partagez vos factures PDF directement par email ou WhatsApp. Idéal pour les pratiques commerciales en Afrique de l\'Ouest.',
  },
  {
    icon: Users,
    title: 'Gestion multi-utilisateurs',
    desc: 'Invitez vos collaborateurs dans votre organisation. Gérez les rôles et accès pour votre équipe.',
  },
  {
    icon: Zap,
    title: 'Opérationnel en 2 minutes',
    desc: 'Aucune installation requise. Créez votre compte gratuitement et émettez votre première facture immédiatement.',
  },
  {
    icon: Shield,
    title: 'Données sécurisées',
    desc: 'Vos données financières sont chiffrées et sauvegardées. Accès sécurisé depuis n\'importe quel appareil.',
  },
];

const TESTIMONIALS = [
  {
    initials: 'NS',
    name: 'Ngagne SARR',
    role: 'Directeur — Touba Bélél Multimedia, Thiès',
    text: '"FactureApp nous a permis de professionnaliser notre facturation en moins d\'une semaine. Nos clients reçoivent leurs PDF directement par email — c\'est un gain de temps énorme."',
  },
  {
    initials: 'AF',
    name: 'Abdoulaye Fall',
    role: 'Informaticien freelance — Thiès',
    text: '"En tant que freelance, j\'avais besoin d\'un outil simple pour facturer mes clients en FCFA. FactureApp est exactement ce qu\'il me fallait — rapide à prendre en main et très professionnel."',
  },
  {
    initials: 'MM',
    name: 'Mariama Mbaye',
    role: 'Gérante PME — Dakar',
    text: '"La gestion facturation freelance n\'a jamais été aussi simple. Je crée mes devis en ligne Sénégal en quelques clics et mes clients me paient plus vite."',
  },
];

const BrandLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-10 h-10" aria-hidden="true">
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

export default function LandingPage() {
  return (
    <>
      <SEOHead
        title="Logiciel de Facturation en Ligne pour PME et Freelances en Afrique"
        description="Créez vos factures, devis et proformas en quelques clics. Solution SaaS de facturation conforme TVA Sénégal (18%), pensée pour les PME et freelances de la zone UEMOA."
        canonical="/"
        ogType="website"
        jsonLd={[SOFTWARE_APP_SCHEMA, WEBSITE_SCHEMA]}
      />

      <div className="min-h-screen bg-white">

        {/* ── Navigation ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">
            <Link to="/" className="flex items-center gap-2" aria-label="FactureApp — Accueil">
              <BrandLogo />
              <span className="text-xl font-bold text-gray-900">FactureApp</span>
            </Link>

            <div className="hidden md:flex items-center gap-6">
              <Link to="/fonctionnalites" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                Fonctionnalités
              </Link>
              <Link to="/tarifs" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                Tarifs
              </Link>
              <Link to="/contact" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Connexion
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Essayer gratuitement
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </nav>
        </header>

        {/* ── Hero ────────────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-[#00C8D7] to-[#007a87] text-white py-20 lg:py-28 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/10 rounded-full pointer-events-none" aria-hidden="true" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full pointer-events-none" aria-hidden="true" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 rounded-full px-4 py-1.5 text-sm mb-6">
                <Globe className="w-4 h-4" aria-hidden="true" />
                Logiciel de facturation Sénégal · Côte d'Ivoire · Mali · Burkina Faso
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                La facturation en ligne<br className="hidden sm:block" />
                simple pour les PME<br className="hidden sm:block" />
                <span className="text-white/90">de la zone UEMOA</span>
              </h1>

              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Créez vos factures, devis et proformas en Franc CFA (XOF) en quelques clics.
                Application facturation PME Afrique avec TVA Sénégal 18 % préconfigurée.
                Envoyez par WhatsApp ou email directement à vos clients.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Créer ma première facture
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/tarifs"
                  className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/20 transition-colors"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-8 text-sm text-white/70">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white/90" aria-hidden="true" /> Gratuit pour démarrer</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white/90" aria-hidden="true" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-white/90" aria-hidden="true" /> Conforme UEMOA</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Fonctionnalités ─────────────────────────────────────── */}
        <section className="py-20 bg-gray-50" id="fonctionnalites" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 id="features-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Tout ce qu'il faut pour votre gestion facturation freelance et PME
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Application facturation PME Afrique conçue pour les réalités du marché UEMOA.
                Facture PDF Afrique de l'Ouest en quelques secondes.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <article key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </article>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                to="/fonctionnalites"
                className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:underline"
              >
                Découvrir toutes les fonctionnalités
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Mots-clés longue traîne — section informative ───────── */}
        <section className="py-16 bg-white" aria-labelledby="why-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 id="why-heading" className="text-3xl font-bold text-gray-900 mb-6">
                  Comment créer une facture au Sénégal facilement ?
                </h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    FactureApp est le <strong>logiciel de facturation Sénégal</strong> pensé pour les réalités
                    locales. Que vous soyez PME à Dakar, freelance à Abidjan ou prestataire à Bamako,
                    notre <strong>logiciel facturation conforme UEMOA</strong> vous accompagne.
                  </p>
                  <p>
                    Créez une <strong>facture en ligne gratuit</strong> en quelques secondes :
                    sélectionnez vos produits/services, le taux de <strong>TVA Sénégal 18%</strong>
                    s'applique automatiquement, et votre <strong>facture PDF Afrique de l'Ouest</strong> est
                    prête à envoyer.
                  </p>
                  <p>
                    <strong>Envoyer facture WhatsApp PME Sénégal</strong> ? C'est intégré.
                    Partagez votre <strong>devis en ligne Sénégal</strong> en un clic via WhatsApp
                    ou email — la méthode préférée de vos clients.
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 space-y-4">
                <h3 className="text-xl font-bold text-gray-900">Démarrez en 3 étapes</h3>
                {[
                  { step: '1', title: 'Créez votre compte gratuit', desc: 'Inscription en 2 minutes, sans carte bancaire.' },
                  { step: '2', title: 'Ajoutez vos clients & produits', desc: 'Importez ou saisissez vos données facilement.' },
                  { step: '3', title: 'Émettez votre première facture', desc: 'PDF généré, envoyé par email ou WhatsApp.' },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{title}</p>
                      <p className="text-sm text-gray-600">{desc}</p>
                    </div>
                  </div>
                ))}

                <Link
                  to="/register"
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
                >
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Témoignages ─────────────────────────────────────────── */}
        <section className="py-16 bg-gray-50" aria-labelledby="testimonials-heading">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 id="testimonials-heading" className="text-3xl font-bold text-gray-900 text-center mb-10">
              Ils facturent déjà avec FactureApp
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map(({ initials, name, role, text }) => (
                <article key={name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex gap-1 mb-3" aria-label="5 étoiles sur 5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm italic leading-relaxed mb-4">{text}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{name}</p>
                      <p className="text-xs text-gray-500">{role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA final ───────────────────────────────────────────── */}
        <section className="py-20 bg-gradient-to-br from-[#00C8D7] to-[#007a87] text-white text-center">
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prêt à simplifier votre facturation en ligne UEMOA ?
            </h2>
            <p className="text-lg text-white/80 mb-8">
              Rejoignez des centaines d'entreprises et freelances de la zone UEMOA
              qui font confiance à FactureApp pour leur <strong className="text-white">logiciel comptabilité Dakar</strong> et au-delà.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                Créer ma première facture
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link
                to="/tarifs"
                className="inline-flex items-center justify-center gap-2 bg-white/15 border border-white/30 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-white/20 transition-colors"
              >
                Voir les tarifs
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className="bg-gray-900 text-gray-400 py-12" role="contentinfo">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <BrandLogo />
                  <span className="text-white font-bold text-lg">FactureApp</span>
                </div>
                <p className="text-sm leading-relaxed">
                  Application de facturation en ligne pour les PME et freelances de la zone UEMOA.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-3">Produit</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/fonctionnalites" className="hover:text-white transition-colors">Fonctionnalités</Link></li>
                  <li><Link to="/tarifs" className="hover:text-white transition-colors">Tarifs</Link></li>
                  <li><Link to="/register" className="hover:text-white transition-colors">Essayer gratuitement</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-3">Support</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm mb-3">Légal</h3>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/legal/cgu" className="hover:text-white transition-colors">CGU</Link></li>
                  <li><Link to="/legal/privacy" className="hover:text-white transition-colors">Confidentialité</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <p>© {new Date().getFullYear()} FactureApp by Innosoft. Tous droits réservés.</p>
              <p>Logiciel de facturation Sénégal · Zone UEMOA · Franc CFA (XOF)</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
