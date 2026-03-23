import { format, formatDistance, isAfter, isBefore, parseISO } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';

const getLocale = () => {
  const lang = localStorage.getItem('i18nextLng') || 'fr';
  return lang.startsWith('en') ? enUS : fr;
};

export const formatDate = (date, fmt = 'dd/MM/yyyy') => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(d, fmt, { locale: getLocale() });
  } catch {
    return '-';
  }
};

export const formatDateLong = (date) => {
  return formatDate(date, 'd MMMM yyyy');
};

export const formatRelative = (date) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return formatDistance(d, new Date(), { addSuffix: true, locale: getLocale() });
  } catch {
    return '-';
  }
};

export const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  try {
    const d = typeof dueDate === 'string' ? parseISO(dueDate) : new Date(dueDate);
    return isBefore(d, new Date());
  } catch {
    return false;
  }
};

export const toInputDate = (date) => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(d, 'yyyy-MM-dd');
  } catch {
    return '';
  }
};

export const today = () => format(new Date(), 'yyyy-MM-dd');

export const addDays = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy-MM-dd');
};
