import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, loadUser } = useAuth();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [orgName, setOrgName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide.');
      return;
    }

    // Décoder le payload pour afficher l'org name
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setOrgName(payload.orgName || '');
    } catch {}

    // Attendre que l'auth soit chargée avant de décider
    if (loading) return;

    if (!user) {
      // Non connecté → rediriger vers inscription avec le token
      navigate(`/register?invite=${token}`, { replace: true });
      return;
    }

    // Connecté → accepter directement via API
    const accept = async () => {
      try {
        const { data } = await api.post('/organizations/accept-invite', { token });
        setOrgName(data.data?.organization?.name || orgName);
        setStatus('success');
        setMessage(data.message);
        await loadUser();
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Lien invalide ou expiré.');
      }
    };

    accept();
  }, [token, user, loading]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Traitement de l'invitation...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation acceptée !</h2>
            <p className="text-gray-500 mb-6">
              Vous avez rejoint <strong>"{orgName}"</strong>.<br />
              Vous pouvez maintenant basculer vers cette organisation depuis le menu.
            </p>
            <button
              onClick={() => navigate('/organization')}
              className="btn-primary w-full justify-center py-3"
            >
              Voir l'organisation
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <XCircle className="w-9 h-9 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h2>
            <p className="text-gray-500 mb-2">{message}</p>
            {user && (
              <p className="text-xs text-gray-400 mb-6">
                Vous êtes connecté en tant que <strong>{user.email}</strong>.<br />
                Ce lien est réservé à la personne invitée. Ouvrez-le depuis le navigateur de cette personne.
              </p>
            )}
            <Link to="/" className="btn-primary w-full justify-center py-3 flex items-center">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
