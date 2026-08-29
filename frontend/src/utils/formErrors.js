// Traductions françaises des messages Zod courants
const ZOD_FR = {
  'Required': 'Champ obligatoire',
  'String must contain at least 1 character(s)': 'Champ obligatoire',
  'Invalid email': 'Adresse e-mail invalide',
  'Expected number, received nan': 'Valeur numérique invalide',
  'Expected number, received string': 'Valeur numérique invalide',
  'Number must be greater than or equal to 0': 'La valeur doit être ≥ 0',
  'Number must be less than or equal to 100': 'La valeur doit être ≤ 100',
  'Number must be greater than 0': 'La valeur doit être > 0',
};

/**
 * Extrait les erreurs de champs depuis une réponse API Zod.
 * Retourne un objet { fieldName: message } ou null si pas d'erreurs structurées.
 */
export function parseApiErrors(err) {
  const apiErrors = err?.response?.data?.errors;
  if (!Array.isArray(apiErrors) || apiErrors.length === 0) return null;

  return apiErrors.reduce((acc, e) => {
    if (e.field) {
      acc[e.field] = ZOD_FR[e.message] ?? e.message;
    }
    return acc;
  }, {});
}

/**
 * Gère une erreur API dans un formulaire :
 * - Si des erreurs de champs sont disponibles → les affiche inline via setErrors
 * - Sinon → toast avec le message générique
 * Retourne le message toast à afficher.
 */
export function handleFormError(err, setErrors) {
  const fieldErrors = parseApiErrors(err);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    setErrors(prev => ({ ...prev, ...fieldErrors }));
    return 'Veuillez corriger les champs en erreur';
  }
  return err?.response?.data?.message || 'Une erreur est survenue';
}
