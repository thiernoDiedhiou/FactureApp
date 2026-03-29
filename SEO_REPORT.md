# Rapport SEO — FactureApp
_Généré le 2026-03-29_

---

## ✅ Implémenté

### 1. Package & Infrastructure

| Élément | Fichier | Détail |
|---|---|---|
| `react-helmet-async` installé | `frontend/package.json` | Gestion dynamique des balises `<head>` par page |
| `HelmetProvider` ajouté | `frontend/src/main.jsx` | Enveloppe toute l'app pour activer Helmet |

---

### 2. Composant `SEOHead`

**Fichier** : `frontend/src/components/SEOHead.jsx`

- Props : `title`, `description`, `canonical`, `noindex`, `ogType`, `ogImage`, `jsonLd[]`
- Injecte automatiquement : `<title>`, `meta description`, `meta robots`, `link canonical`, balises Open Graph, Twitter Card
- Exports nommés des schémas JSON-LD réutilisables :
  - `SOFTWARE_APP_SCHEMA` — Schema.org `SoftwareApplication`
  - `WEBSITE_SCHEMA` — Schema.org `WebSite` + `SearchAction`
  - `FAQ_SCHEMA` — Schema.org `FAQPage` (5 questions/réponses)

---

### 3. Métadonnées par page

| Page | Route | Title | noindex | Canonical | JSON-LD |
|---|---|---|---|---|---|
| Landing | `/` | "Logiciel de Facturation en Ligne pour PME…" | Non | `/` | SoftwareApplication + WebSite |
| Fonctionnalités | `/fonctionnalites` | "Fonctionnalités – Facturation, Devis, PDF & WhatsApp" | Non | `/fonctionnalites` | SoftwareApplication |
| Tarifs | `/tarifs` | "Tarifs – Plans d'abonnement FactureApp…" | Non | `/tarifs` | SoftwareApplication + FAQPage |
| Contact | `/contact` | "Contact – FactureApp" | Non | `/contact` | SoftwareApplication |
| CGU | `/legal/cgu` | "Conditions Générales d'Utilisation" | Non | `/legal/cgu` | — |
| Confidentialité | `/legal/privacy` | "Politique de Confidentialité" | Non | `/legal/privacy` | — |
| Connexion | `/login` | "Connexion" | **Oui** (noindex) | — | — |
| Inscription | `/register` | "Créer un compte" | Non | `/register` | — |
| App (`/app/*`) | `/app/**` | — | **Oui** (noindex via Helmet) | — | — |
| Admin (`/admin/*`) | `/admin/**` | — | **Oui** (noindex via Helmet) | — | — |

---

### 4. Données structurées JSON-LD

**`SoftwareApplication`** (toutes pages publiques) :
```json
{
  "@type": "SoftwareApplication",
  "name": "FactureApp",
  "applicationCategory": "BusinessApplication",
  "offers": { "priceCurrency": "XOF" },
  "provider": { "name": "Innosoft" }
}
```

**`WebSite` + `SearchAction`** (page d'accueil) :
```json
{
  "@type": "WebSite",
  "name": "FactureApp",
  "inLanguage": "fr-SN",
  "potentialAction": { "@type": "SearchAction" }
}
```

**`FAQPage`** (page Tarifs) — 5 questions :
- Qu'est-ce que FactureApp ?
- Compatible TVA Sénégal ?
- Envoi par WhatsApp ?
- Combien d'organisations ?
- Comment inviter un membre ?

---

### 5. Performance & Core Web Vitals

| Optimisation | Fichier | Statut |
|---|---|---|
| `<link rel="preconnect" href="https://fonts.googleapis.com">` | `index.html` | ✅ |
| `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` | `index.html` | ✅ |
| `<meta name="theme-color" content="#00C8D7">` | `index.html` | ✅ |
| `<link rel="apple-touch-icon">` | `index.html` | ✅ |
| `<link rel="icon" type="image/png">` | `index.html` | ✅ |
| OG / Twitter Card par défaut dans le `<head>` | `index.html` | ✅ |
| **Lazy loading** de tous les composants `/app/*` et `/admin/*` | `App.jsx` | ✅ `React.lazy()` + `<Suspense>` |
| Code splitting actif sur routes protégées | `App.jsx` | ✅ |
| `html lang="fr"` | `index.html` | ✅ (déjà présent, conservé) |

---

### 6. Sitemap XML

| Fichier | URL servie | Type |
|---|---|---|
| `frontend/public/sitemap.xml` | `/sitemap.xml` (statique) | Fichier statique servi par Vite/nginx |
| `backend/src/app.js` — route `GET /sitemap.xml` | `/sitemap.xml` (dynamique) | `lastmod` = date du jour automatique |

**URLs indexées** (7 URLs) :

| URL | Priority | Changefreq |
|---|---|---|
| `https://facture.innosft.com/` | 1.0 | weekly |
| `https://facture.innosft.com/fonctionnalites` | 0.9 | monthly |
| `https://facture.innosft.com/tarifs` | 0.9 | weekly |
| `https://facture.innosft.com/register` | 0.8 | monthly |
| `https://facture.innosft.com/contact` | 0.6 | monthly |
| `https://facture.innosft.com/legal/cgu` | 0.3 | yearly |
| `https://facture.innosft.com/legal/privacy` | 0.3 | yearly |

**Exclusions** : `/app/*`, `/admin/*`, `/api/*`, `/login`

---

### 7. Robots.txt

**Fichier** : `frontend/public/robots.txt` (+ route fallback backend)

```
User-agent: *
Allow: /, /fonctionnalites, /tarifs, /register, /contact, /legal/
Disallow: /app/, /admin/, /api/, /login, /settings/, /*.json$
Sitemap: https://facture.innosft.com/sitemap.xml
```

---

### 8. Architecture de routage refactorisée

**Avant** : `/` = dashboard protégé (invisible aux moteurs de recherche)
**Après** :
- `/` → `LandingPage` publique (indexable) — redirige vers `/app` si connecté
- `/fonctionnalites`, `/tarifs`, `/contact`, `/legal/*` → pages marketing publiques
- `/app/*` → application protégée (noindex, lazy-loaded)
- `/admin/*` → administration protégée (noindex, lazy-loaded)

**Fichier modifié** : `frontend/src/App.jsx`
**Redirect login success** : `/` → `/app` (`Login.jsx` mis à jour)

---

### 9. Mots-clés intégrés

**Principaux** (dans H1, H2, meta) :
- ✅ logiciel de facturation Sénégal
- ✅ application facturation PME Afrique
- ✅ facturation en ligne UEMOA
- ✅ créer facture en ligne gratuit

**Secondaires** (dans H2/H3 et corps de texte) :
- ✅ devis en ligne Sénégal
- ✅ facture PDF Afrique de l'Ouest
- ✅ gestion facturation freelance
- ✅ TVA Sénégal 18%
- ✅ facture par WhatsApp
- ✅ logiciel comptabilité Dakar

**Longue traîne** (dans paragraphes) :
- ✅ "comment créer une facture au Sénégal"
- ✅ "logiciel facturation conforme UEMOA"
- ✅ "envoyer facture WhatsApp PME Sénégal"

---

### 10. Accessibilité & Structure HTML

| Règle | Statut |
|---|---|
| Un seul `<h1>` par page contenant le mot-clé | ✅ Implémenté sur toutes les nouvelles pages |
| Ordre H1 → H2 → H3 respecté | ✅ |
| `alt=""` ou `aria-hidden="true"` sur icônes décoratives | ✅ (toutes les icônes Lucide ont `aria-hidden="true"`) |
| `alt="Logo FactureApp"` ou `aria-label` sur logos | ✅ |
| Liens avec texte ancre explicite | ✅ (CTA précis : "Créer ma première facture", "Essayer gratuitement", "Voir les tarifs") |
| `aria-label` sur éléments de navigation | ✅ (`aria-label="Navigation principale"`) |
| `role="contentinfo"` sur `<footer>` | ✅ |
| `aria-labelledby` sur sections | ✅ |

---

### 11. Fichiers créés/modifiés

**Créés** :
- `frontend/src/components/SEOHead.jsx`
- `frontend/src/pages/public/LandingPage.jsx`
- `frontend/src/pages/public/Features.jsx`
- `frontend/src/pages/public/Pricing.jsx`
- `frontend/src/pages/public/Contact.jsx`
- `frontend/src/pages/public/CGU.jsx`
- `frontend/src/pages/public/Privacy.jsx`
- `frontend/public/robots.txt`
- `frontend/public/sitemap.xml`
- `frontend/public/og-image.svg`

**Modifiés** :
- `frontend/index.html` — meta OG/Twitter, icons, preconnect
- `frontend/public/manifest.json` — rebranding FactureApp
- `frontend/src/main.jsx` — `HelmetProvider` ajouté
- `frontend/src/App.jsx` — refactorisation complète du routage + lazy loading
- `frontend/src/pages/auth/Login.jsx` — `SEOHead` noindex + redirect `/app`
- `frontend/src/pages/auth/Register.jsx` — `SEOHead` avec description
- `backend/src/app.js` — routes `GET /sitemap.xml` et `GET /robots.txt`

---

## ⚠️ À compléter manuellement

### Priorité haute
- [ ] **Créer `og-image.png`** (1200×630 px PNG) — un placeholder SVG existe à `frontend/public/og-image.svg` mais les réseaux sociaux (Facebook, Twitter) requièrent un PNG/JPG. Exporter le SVG avec Figma, Canva ou `sharp` en PNG.
- [ ] **Créer `favicon.png`** (32×32 px) et **`apple-touch-icon.png`** (180×180 px) — référencés dans `index.html` mais seul `favicon.svg` existe actuellement.
- [ ] **Mettre à jour `og:image`** dans `SEOHead.jsx` si l'URL change.

### Priorité moyenne
- [ ] **Contenu réel** — Les pages marketing (LandingPage, Features, Pricing) contiennent du contenu fonctionnel mais doivent être enrichies avec les vrais textes, visuels de l'app et témoignages clients réels.
- [ ] **Page 404** — Créer une page d'erreur 404 avec `<meta name="robots" content="noindex">`.
- [ ] **Sitemap dynamique** — Configurer nginx pour que `/sitemap.xml` soit proxié vers le backend (pour la date `lastmod` toujours à jour), ou mettre à jour le fichier statique à chaque déploiement.

### Google Search Console
- [ ] Ajouter la propriété `https://facture.innosft.com` dans Google Search Console
- [ ] Soumettre le sitemap : `https://facture.innosft.com/sitemap.xml`
- [ ] Vérifier la couverture d'index après 7–14 jours

---

## 📊 Prochaines étapes recommandées

### Court terme (1–4 semaines)
1. **Google Search Console** — Configurer et soumettre le sitemap
2. **Google Analytics 4** — Intégrer le script GA4 dans `index.html` ou via `react-ga4`
3. **Test Rich Results** — Valider les JSON-LD : https://search.google.com/test/rich-results
4. **PageSpeed Insights** — Auditer les Core Web Vitals : https://pagespeed.web.dev/

### Moyen terme (1–3 mois)
5. **Blog `/blog`** — Créer des articles sur la facturation en Afrique :
   - "Comment créer une facture légale au Sénégal en 2025"
   - "TVA Sénégal : guide complet pour les PME"
   - "Facturation en FCFA : outils et bonnes pratiques UEMOA"
6. **Backlinks locaux** — Référencer sur des annuaires PME sénégalais, APIX, CCIAD
7. **Hreflang** — Si expansion vers d'autres langues (anglais pour Liberia/Ghana)

### Long terme (3–6 mois)
8. **Schema.org Review** — Ajouter des avis clients vérifiés (AggregateRating)
9. **AMP** — Envisager des pages AMP pour les articles de blog
10. **Performances images** — Utiliser WebP pour les screenshots de l'app

---

## ❌ Non applicable / Hors périmètre

| Élément | Justification |
|---|---|
| `fetchpriority="high"` sur l'image hero | La page hero utilise un dégradé CSS pur, pas d'image `<img>` — pas applicable |
| `loading="lazy"` sur les images | Les pages marketing actuelles utilisent des icônes SVG (Lucide React), pas d'`<img>` externe — à ajouter lors de l'ajout de screenshots réels |
| `width`/`height` explicites sur `<img>` | Idem — pas d'images raster actuellement dans les composants créés |
| Vérification `NODE_ENV=production` | Géré par Docker et le build Vite (`vite build` produit toujours du code optimisé) |

---

_Rapport généré automatiquement — FactureApp SEO Implementation v1.0_
