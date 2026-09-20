export const APP_NAME = "RailTogether";

export const DISCLAIMER_SHORT = "Assistive tool for voluntary passenger seat exchanges. Does not modify official railway reservations.";

export const DISCLAIMER_FULL = "RailTogether is an assistive voluntary seat-exchange coordinator between passengers. Any agreement confirmed in this app is strictly based on mutual passenger consent and does not modify the official railway PNR or ticket booking.";

export const BERTH_COLORS = {
  LOWER: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800' },
  MIDDLE: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100 text-indigo-800' },
  UPPER: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  SIDE_LOWER: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800' },
  SIDE_UPPER: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800' },
};

export const SEAT_CATEGORIES = {
  GROUP: { label: 'Group Member', color: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-500' },
  SEPARATED_GROUP: { label: 'Separated Group Member', color: 'bg-rose-500', text: 'text-rose-700', border: 'border-rose-500' },
  RECOMMENDED: { label: 'Recommended Exchange', color: 'bg-amber-400', text: 'text-amber-800', border: 'border-amber-400' },
  OTHER: { label: 'Other Passenger', color: 'bg-slate-300', text: 'text-slate-600', border: 'border-slate-300' },
  EMPTY: { label: 'Available / Unregistered', color: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' },
};
