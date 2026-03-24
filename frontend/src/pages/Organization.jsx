import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Building2, Users, UserPlus, Trash2, Shield, Crown,
  User, Loader2, Mail, ChevronDown, AlertCircle, Pencil, Check, X, Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

const ROLE_LABELS = {
  OWNER: { label: 'Propriétaire', icon: Crown, color: 'text-amber-600 bg-amber-50' },
  ADMIN: { label: 'Admin', icon: Shield, color: 'text-blue-600 bg-blue-50' },
  MEMBER: { label: 'Membre', icon: User, color: 'text-gray-600 bg-gray-100' }
};

const PLAN_LABELS = {
  FREE: { label: 'Gratuit', color: 'bg-gray-100 text-gray-700', maxMembers: 1 },
  STARTER: { label: 'Starter', color: 'bg-blue-100 text-blue-700', maxMembers: 3 },
  PRO: { label: 'Pro', color: 'bg-purple-100 text-purple-700', maxMembers: 10 },
  ENTERPRISE: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700', maxMembers: null }
};

export default function Organization() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviting, setInviting] = useState(false);

  const [removing, setRemoving] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);

  const canInvite = user?.orgRole === 'OWNER' || user?.orgRole === 'ADMIN';
  const canManage = user?.orgRole === 'OWNER';

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue === org?.name) { setEditingName(false); return; }
    setSavingName(true);
    try {
      const { data } = await api.patch('/organizations/me', { name: nameValue.trim() });
      toast.success('Nom mis à jour');
      setOrg(prev => ({ ...prev, name: data.data.organization.name }));
      setEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur mise à jour');
    } finally {
      setSavingName(false);
    }
  };

  const startEditName = () => {
    setNameValue(org?.name || '');
    setEditingName(true);
  };

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/organizations/me');
      setOrg(data.data.organization);
      setMembers(data.data.organization.members || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur chargement organisation');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const { data } = await api.post('/organizations/invite', { email: inviteEmail, role: inviteRole });
      toast.success(data.message);
      setInviteEmail('');
      setInviteRole('MEMBER');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de l\'invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingRole(userId);
    try {
      await api.patch(`/organizations/members/${userId}/role`, { role: newRole });
      toast.success('Rôle mis à jour');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur changement de rôle');
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRemove = async (userId, memberName) => {
    if (!window.confirm(`Retirer ${memberName} de l'organisation ?`)) return;
    setRemoving(userId);
    try {
      await api.delete(`/organizations/members/${userId}`);
      toast.success(`${memberName} retiré`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur suppression');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const plan = org?.plan ? PLAN_LABELS[org.plan] : PLAN_LABELS.FREE;
  const memberCount = members.length;
  const maxMembers = plan.maxMembers;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <h1 className="page-title flex items-center gap-2">
        <Building2 className="w-6 h-6 text-primary-600" />
        Organisation
      </h1>

      {/* Org Info */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="input-field text-lg font-bold py-1"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                  autoFocus
                  disabled={savingName}
                />
                <button onClick={handleSaveName} disabled={savingName}
                  className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button onClick={() => setEditingName(false)}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h2 className="text-xl font-bold text-gray-900 truncate">{org?.name}</h2>
                {canManage && (
                  <button onClick={startEditName}
                    className="p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500 mt-0.5">Slug : {org?.slug}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${plan.color}`}>
            {plan.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{memberCount}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {maxMembers ? `/ ${maxMembers} membres` : 'membres'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{org?._count?.clients ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">clients</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{org?._count?.documents ?? 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">documents</p>
          </div>
        </div>

        {/* Plan limit warning */}
        {maxMembers && memberCount >= maxMembers && (
          <div className="mt-4 flex items-center justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Limite du plan {plan.label} atteinte ({maxMembers} membre{maxMembers > 1 ? 's' : ''} max).
            </div>
            <Link to="/plans" className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0">
              <Zap className="w-3.5 h-3.5" /> Upgrade
            </Link>
          </div>
        )}
      </div>

      {/* Invite */}
      {canInvite && (
        <div className="card p-6">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-primary-600" />
            Inviter un collaborateur
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Entrez l'email du collaborateur — il recevra une invitation par email pour rejoindre votre organisation (ou créer son compte s'il n'en a pas encore).
          </p>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                className="input-field pl-9"
                placeholder="email@collaborateur.sn"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={inviting}
                required
              />
            </div>
            <select
              className="input-field sm:w-36"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              disabled={inviting}
            >
              <option value="MEMBER">Membre</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button type="submit" className="btn-primary" disabled={inviting}>
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Inviter
            </button>
          </form>
        </div>
      )}

      {/* Members list */}
      <div className="card p-6">
        <h2 className="section-title flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-primary-600" />
          Membres ({memberCount})
        </h2>

        <div className="divide-y divide-gray-100">
          {members.map((member) => {
            const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.MEMBER;
            const RoleIcon = roleInfo.icon;
            const isMe = member.userId === user?.id;
            const isOwner = member.role === 'OWNER';

            return (
              <div key={member.userId} className="flex items-center gap-4 py-3">
                {/* Avatar */}
                <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-700 text-sm font-bold">
                    {member.user?.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.user?.name}
                    {isMe && <span className="ml-2 text-xs text-gray-400">(vous)</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{member.user?.email}</p>
                </div>

                {/* Role badge / selector */}
                {canManage && !isMe && !isOwner ? (
                  <div className="relative">
                    <select
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 pr-6 appearance-none bg-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-400"
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.userId, e.target.value)}
                      disabled={updatingRole === member.userId}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MEMBER">Membre</option>
                    </select>
                    {updatingRole === member.userId ? (
                      <Loader2 className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-gray-400" />
                    ) : (
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    )}
                  </div>
                ) : (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                )}

                {/* Remove button */}
                {canManage && !isMe && !isOwner && (
                  <button
                    onClick={() => handleRemove(member.userId, member.user?.name)}
                    disabled={removing === member.userId}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Retirer le membre"
                  >
                    {removing === member.userId
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
