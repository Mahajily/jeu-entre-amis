/** Métadonnées de chaque catégorie de mots. */
export const CATEGORIES = [
  { id: 'animaux',     label: 'Animaux',              emoji: '🐾', color: '#00b894' },
  { id: 'nourriture',  label: 'Nourriture',           emoji: '🍕', color: '#fdcb6e' },
  { id: 'sports',      label: 'Sports',               emoji: '⚽', color: '#0984e3' },
  { id: 'voyage',      label: 'Voyage',               emoji: '✈️', color: '#6c5ce7' },
  { id: 'technologie', label: 'Technologie',          emoji: '💻', color: '#00cec9' },
  { id: 'culture',     label: 'Arts & Culture',       emoji: '🎭', color: '#e84393' },
  { id: 'nature',      label: 'Nature',               emoji: '🌿', color: '#55efc4' },
  { id: 'mode',        label: 'Mode',                 emoji: '👗', color: '#fd79a8' },
  { id: 'metiers',     label: 'Métiers',              emoji: '💼', color: '#e17055' },
  { id: 'histoire',    label: 'Histoire & Mythologie',emoji: '🏛️', color: '#a29bfe' },
  { id: 'quotidien',   label: 'Vie Quotidienne',      emoji: '🏠', color: '#74b9ff' },
  { id: 'manga',       label: 'Manga & Anime',        emoji: '⛩️', color: '#e84393' },
  { id: 'film',        label: 'Films',                emoji: '🎬', color: '#f39c12' },
  { id: 'serie',       label: 'Séries TV',            emoji: '📺', color: '#8e44ad' },
  { id: 'cultureg',    label: 'Culture Générale',     emoji: '🧠', color: '#16a085' },
]

export const ALL_CATEGORY_IDS = CATEGORIES.map(c => c.id)
