import { Link } from 'react-router-dom';
import {
  FileText, Send, Users, CheckCircle, Download,
  MessageCircle, Building2, BarChart2, ArrowRight,
} from 'lucide-react';
import SEOHead, { SOFTWARE_APP_SCHEMA } from '../../components/SEOHead';

const FEATURE_GROUPS = [
  {
    heading: 'Création de documents commerciaux',
    features: [
      { icon: FileText, title: 'Factures professionnelles', desc: 'Créez des factures conformes UEMOA avec numérotation automatique, TVA Sénégal 18 % préconfigurée et logo de votre entreprise.' },
      { icon: FileText, title: 'Devis en ligne Sénégal', desc: 'Transformez vos devis en factures d\'une simple validation. Vos clients reçoivent un document PDF soigné par email.' },
      { icon: FileText, title: 'Proformas & bons de commande', desc: 'Gérez tous vos documents pré-facture : proformas, acomptes et bons de commande en Franc CFA (XOF).' },
    ],
  },
  {
    heading: 'Envoi & partage',
    features: [
      { icon: Send, title: 'Envoi PDF par email', desc: 'Envoyez votre facture PDF Afrique de l\'Ouest directement à votre client depuis l\'application, sans passer par votre messagerie.' },
      { icon: MessageCircle, title: 'Facture par WhatsApp', desc: 'Partagez vos factures via WhatsApp en un clic — la méthode la plus utilisée pour envoyer facture WhatsApp PME Sénégal.' },
      { icon: Download, title: 'Export PDF instantané', desc: 'Téléchargez vos documents PDF en un clic pour les archiver ou les imprimer.' },
    ],
  },
  {
    heading: 'Gestion clients & produits',
    features: [
      { icon: Users, title: 'Carnet de clients', desc: 'Centralisez toutes les informations de vos clients PME et freelances. Retrouvez l\'historique de facturation par client.' },
      { icon: Building2, title: 'Catalogue de produits & services', desc: 'Créez votre catalogue de produits ou services avec prix unitaires, TVA et descriptions. Ajout en 1 clic sur vos factures.' },
      { icon: BarChart2, title: 'Tableau de bord', desc: 'Suivez votre chiffre d\'affaires, les factures impayées et les statistiques clés de votre activité en temps réel.' },
    ],
  },
  {
    heading: 'Collaboration & organisation',
    features: [
      { icon: Users, title: 'Gestion multi-membres', desc: 'Invitez vos collaborateurs et assignez des rôles (admin, membre). Travail d\'équipe simplifié au sein de votre organisation.' },
      { icon: Building2, title: 'Multi-organisations', desc: 'Gérez plusieurs structures depuis un seul compte FactureApp — idéal pour les consultants ou groupes d\'entreprises.' },
      { icon: CheckCircle, title: 'Conformité fiscale UEMOA', desc: 'Logiciel facturation conforme UEMOA : TVA, numérotation, mentions légales. Respect des réglementations du Sénégal, Côte d\'Ivoire, Mali, Burkina Faso.' },
    ],
  },
];

export default function Features() {
  return (
    <>
      <SEOHead
        title="Fonctionnalités – Facturation, Devis, PDF & WhatsApp"
        description="Gérez vos factures, devis et proformas. Envoyez par email ou WhatsApp, gérez vos clients et produits. TVA Sénégal préconfigurée."
        canonical="/fonctionnalites"
        jsonLd={[SOFTWARE_APP_SCHEMA]}
      />

      <div className="min-h-screen bg-white">

        {/* ── Nav simple ── */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
          <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Navigation principale">
            <Link to="/" className="text-xl font-bold text-gray-900" aria-label="FactureApp — Accueil">
              FactureApp
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/tarifs" className="text-sm text-gray-600 hover:text-primary-600">Tarifs</Link>
              <Link to="/login" className="text-sm text-gray-600 hover:text-primary-600">Connexion</Link>
              <Link to="/register" className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Essayer gratuitement
              </Link>
            </div>
          </nav>
        </header>

        {/* ── Hero ── */}
        <section className="bg-gradient-to-br from-[#00C8D7] to-[#007a87] text-white py-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Toutes les fonctionnalités pour facturer comme un pro
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Application facturation PME Afrique complète : factures, devis, PDF, WhatsApp et gestion d'équipe.
              Conçu pour les PME et freelances de la zone UEMOA.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Créer ma première facture
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* ── Groupes de fonctionnalités ── */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
          {FEATURE_GROUPS.map(({ heading, features }) => (
            <section key={heading} aria-labelledby={`section-${heading.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2
                id={`section-${heading.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-100"
              >
                {heading}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {features.map(({ icon: Icon, title, desc }) => (
                  <article key={title} className="bg-gray-50 rounded-2xl p-6 hover:bg-primary-50 transition-colors">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary-600" aria-hidden="true" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </main>

        {/* ── CTA ── */}
        <section className="bg-primary-50 border-t border-primary-100 py-12 text-center">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Prêt à créer votre première facture en ligne gratuit ?
            </h2>
            <p className="text-gray-600 mb-6">
              Logiciel de facturation Sénégal accessible depuis tout appareil — ordinateur, tablette ou mobile.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
            >
              Essayer gratuitement
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
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
