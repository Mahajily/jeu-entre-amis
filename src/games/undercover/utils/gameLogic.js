import WORDS_BY_CATEGORY from '../data/wordsByCategory.json'
const ALL_WORDS = Object.values(WORDS_BY_CATEGORY).flat()

/** Mélanger un tableau en place (Fisher-Yates) */
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Choisir un mot au hasard dans une liste */
export function pickPair(wordPool) {
  const list = wordPool && wordPool.length > 0 ? wordPool : ALL_WORDS
  return list[Math.floor(Math.random() * list.length)]
}

/** Assignation des rôles et des mots */
export function assignRoles(players, nbUndercover, wordPool) {
  const pair = pickPair(wordPool)
  const ids = shuffle(players.map((p) => p.id))
  const undercoverIds = new Set(ids.slice(0, nbUndercover))

  const assignments = {}
  players.forEach(p => {
    assignments[p.id] = undercoverIds.has(p.id)
      ? { role: 'undercover', word: pair.undercover, hint: pair.undercoverHint || null }
      : { role: 'civil', word: pair.civil, hint: pair.civilHint || null }
  })

  return { pair, assignments }
}

/** Compter les votes et retourner l'id du joueur éliminé (ou null en cas d'égalité) */
export function tallyVotes(votes) {
  const counts = {}
  Object.values(votes).forEach(target => {
    if (target) counts[target] = (counts[target] || 0) + 1
  })

  let max = 0
  let candidates = []
  for (const id in counts) {
    if (counts[id] > max) {
      max = counts[id]
      candidates = [id]
    } else if (counts[id] === max) {
      candidates.push(id)
    }
  }

  return candidates.length === 1 ? candidates[0] : null
}

/** Vérifier la condition de victoire. Retourne null | 'civil' | 'undercover' */
export function checkWin(players, assignments) {
  const alive = players.filter(p => p.alive)
  const aliveUnder = alive.filter(p => assignments[p.id].role === 'undercover')
  const aliveCivil = alive.filter(p => assignments[p.id].role === 'civil')

  if (aliveUnder.length === 0) return 'civil'
  if (aliveUnder.length >= aliveCivil.length) return 'undercover'
  return null
}

/** Récupérer les initiales d'un nom */
export function getInitials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

/** Couleurs dégradées pour les avatars */
const GRADIENTS = [
  'linear-gradient(135deg, #6c5ce7, #a29bfe)',
  'linear-gradient(135deg, #00b894, #55efc4)',
  'linear-gradient(135deg, #e74c3c, #fd79a8)',
  'linear-gradient(135deg, #fdcb6e, #e17055)',
  'linear-gradient(135deg, #0984e3, #74b9ff)',
  'linear-gradient(135deg, #e84393, #fd79a8)',
  'linear-gradient(135deg, #00cec9, #81ecec)',
  'linear-gradient(135deg, #6c5ce7, #fd79a8)',
]

export function getAvatarGradient(index) {
  return GRADIENTS[index % GRADIENTS.length]
}
