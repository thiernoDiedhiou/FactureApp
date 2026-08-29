import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, X, Settings, UserPlus, FileText, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'cfacture_onboarding_dismissed';

const STEPS = [
  {
    id:       'settings',
    icon:     Settings,
    title:    'Paramétrez votre entreprise',
    desc:     'Ajoutez votre logo, nom et adresse pour des documents professionnels.',
    action:   'Configurer',
    href:     '/app/settings',
    // Toujours marqué "fait" après la première visite des settings
    // → vérifié via prop hasSettings
  },
  {
    id:       'client',
    icon:     UserPlus,
    title:    'Ajoutez votre premier client',
    desc:     'Créez votre premier contact pour commencer à facturer.',
    action:   'Ajouter un client',
    href:     '/app/clients/new',
  },
  {
    id:       'document',
    icon:     FileText,
    title:    'Créez votre première facture',
    desc:     'Générez un PDF professionnel en quelques secondes.',
    action:   'Créer une facture',
    href:     '/app/documents/new',
  },
];

/**
 * Props:
 *   hasClients   — true si l'org a au moins 1 client
 *   hasDocuments — true si l'org a au moins 1 document
 *   hasSettings  — true si les paramètres ont été configurés (logo ou companyName renseigné)
 */
export default function OnboardingChecklist({ hasClients, hasDocuments, hasSettings }) {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  );

  const done = {
    settings: hasSettings,
    client:   hasClients,
    document: hasDocuments,
  };

  const completedCount = Object.values(done).filter(Boolean).length;
  const allDone        = completedCount === STEPS.length;

  // Masquer si tout est fait ou si l'utilisateur a ignoré
  if (allDone || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  const progressPct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="card overflow-hidden">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b border-gray-100">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900">
            Bienvenue sur CFActure 👋
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {completedCount}/{STEPS.length} étapes complétées
          </p>
          {/* Barre de progression */}
          <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          aria-label="Ignorer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Étapes */}
      <div className="divide-y divide-gray-50">
        {STEPS.map(step => {
          const isDone = done[step.id];
          const Icon   = step.icon;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-4 sm:px-5 py-4 transition-colors ${
                isDone ? 'opacity-60' : 'hover:bg-gray-50'
              }`}
            >
              {/* Icône état */}
              <div className="flex-shrink-0">
                {isDone
                  ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                  : <Circle      className="w-6 h-6 text-gray-300"   />
                }
              </div>

              {/* Icône étape */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isDone ? 'bg-green-50' : 'bg-primary-50'
              }`}>
                <Icon className={`w-4 h-4 ${isDone ? 'text-green-500' : 'text-primary-600'}`} />
              </div>

              {/* Texte */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {step.title}
                </p>
                {!isDone && (
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{step.desc}</p>
                )}
              </div>

              {/* CTA */}
              {!isDone && (
                <Link
                  to={step.href}
                  className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 whitespace-nowrap"
                >
                  {step.action}
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
