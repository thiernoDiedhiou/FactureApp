import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://facture.innosft.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

/**
 * SEOHead — composant de gestion des métadonnées SEO par page.
 *
 * Props :
 *  title        — titre de la page (sans suffixe, le suffixe est ajouté automatiquement)
 *  description  — meta description (155 caractères max)
 *  canonical    — chemin canonique, ex: "/fonctionnalites" (sans domaine)
 *  noindex      — true pour les pages privées (dashboard, admin, login…)
 *  ogType       — "website" | "article" (défaut: "website")
 *  ogImage      — URL complète de l'image OG (défaut: og-image.png)
 *  jsonLd       — tableau d'objets JSON-LD à injecter dans le <head>
 */
export default function SEOHead({
  title,
  description,
  canonical,
  noindex = false,
  ogType = 'website',
  ogImage = DEFAULT_OG_IMAGE,
  jsonLd = [],
}) {
  const fullTitle = title
    ? `${title} | FactureApp`
    : 'FactureApp – Logiciel de Facturation en Ligne pour PME et Freelances en Afrique';

  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : null;

  return (
    <Helmet>
      {/* ── Titre & description ── */}
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}

      {/* ── Robots ── */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* ── Canonical ── */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* ── Open Graph ── */}
      {!noindex && (
        <>
          <meta property="og:type" content={ogType} />
          <meta property="og:site_name" content="FactureApp" />
          <meta property="og:title" content={fullTitle} />
          {description && <meta property="og:description" content={description} />}
          <meta property="og:image" content={ogImage} />
          {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        </>
      )}

      {/* ── Twitter Card ── */}
      {!noindex && (
        <>
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={fullTitle} />
          {description && <meta name="twitter:description" content={description} />}
          <meta name="twitter:image" content={ogImage} />
        </>
      )}

      {/* ── JSON-LD structured data ── */}
      {jsonLd.map((schema, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}

/* ────────────────────────────────────────────────────────────
   Données structurées réutilisables
   ──────────────────────────────────────────────────────────── */

/** Schema.org SoftwareApplication — à inclure sur toutes les pages publiques */
export const SOFTWARE_APP_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FactureApp',
  url: SITE_URL,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    priceCurrency: 'XOF',
    availability: 'https://schema.org/InStock',
  },
  description:
    'Logiciel de facturation en ligne pour PME et freelances de la zone UEMOA.',
  provider: {
    '@type': 'Organization',
    name: 'Innosoft',
    url: SITE_URL,
  },
};

/** Schema.org WebSite avec SearchAction — page d'accueil uniquement */
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'FactureApp',
  url: SITE_URL,
  inLanguage: 'fr-SN',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

/** Schema.org FAQPage — page Tarifs */
export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: "Qu'est-ce que FactureApp ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "FactureApp est un logiciel de facturation en ligne conçu pour les PME, freelances et entreprises de la zone UEMOA. Il permet de créer, envoyer et gérer des factures, devis et proformas en Franc CFA (XOF) en quelques clics, depuis n'importe quel appareil.",
      },
    },
    {
      '@type': 'Question',
      name: 'FactureApp est-il compatible avec la TVA au Sénégal ?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. FactureApp intègre nativement le taux de TVA au Sénégal (18 %), préconfigurée et applicable automatiquement sur vos factures. Vous pouvez également personnaliser les taux pour d'autres pays de la zone UEMOA.",
      },
    },
    {
      '@type': 'Question',
      name: "Puis-je envoyer des factures par WhatsApp ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Oui. FactureApp génère un PDF de votre facture en un clic que vous pouvez envoyer directement par WhatsApp, email ou tout autre canal de votre choix. C'est particulièrement adapté aux pratiques commerciales en Afrique de l'Ouest.",
      },
    },
    {
      '@type': 'Question',
      name: "Combien d'organisations puis-je gérer ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Selon votre plan, vous pouvez gérer une ou plusieurs organisations depuis un seul compte FactureApp. Les plans supérieurs permettent la gestion multi-organisations idéale pour les cabinets comptables ou groupes d'entreprises.",
      },
    },
    {
      '@type': 'Question',
      name: "Comment inviter un membre dans mon organisation ?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Depuis votre espace Organisation, cliquez sur « Inviter un membre », saisissez l'adresse email de votre collaborateur et choisissez son rôle. Il recevra un email d'invitation pour rejoindre votre organisation sur FactureApp.",
      },
    },
  ],
};
