import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, ChevronRight, RotateCcw } from 'lucide-react'
import { QUESTIONS, MODE_META, GENDER_META } from '../data/questions'

/* ─── helpers ─────────────────────────────────────────── */

function pickTarget(players, currentId, currentGender, couples, gender = null) {
  const partnerPair = couples.find(([a, b]) => a === currentId || b === currentId)
  const partnerId = partnerPair
    ? partnerPair[0] === currentId ? partnerPair[1] : partnerPair[0]
    : null

  let pool = players.filter((p) => p.id !== currentId && p.id !== partnerId)
  if (pool.length === 0) pool = players.filter((p) => p.id !== currentId)
  if (pool.length === 0) pool = players

  // Actions entre hommes interdites : un joueur masculin ne cible que les femmes
  if (!gender && currentGender === 'M') {
    const fPool = pool.filter((p) => p.gender === 'F')
    if (fPool.length > 0) pool = fPool
  }

  if (gender) {
    const gPool = pool.filter((p) => p.gender === gender)
    if (gPool.length > 0) pool = gPool
  }
  return pool[Math.floor(Math.random() * pool.length)]
}

function resolveText(template, players, currentPlayer, couples) {
  let text = template
  const patterns = [
    { key: '{{joueur}}', gender: null },
    { key: '{{joueur_m}}', gender: 'M' },
    { key: '{{joueur_f}}', gender: 'F' },
  ]
  for (const { key, gender } of patterns) {
    if (text.includes(key)) {
      const t = pickTarget(players, currentPlayer.id, currentPlayer.gender, couples, gender)
      const escaped = key.replace(/[{}]/g, '\\$&')
      text = text.replace(new RegExp(escaped, 'g'), t ? t.name : 'quelqu\'un')
    }
  }
  return text
}

const usedIds = new Set()

function pickQuestion(modes, type, customExtras = []) {
  const pool = []
  for (const mode of modes) {
    const qs = QUESTIONS[mode]?.[type] || []
    qs.forEach((text, i) => pool.push({ text, id: `${mode}-${type}-${i}`, mode }))
  }
  customExtras
    .filter((q) => modes.includes(q.mode) && q.type === type)
    .forEach((q, i) => pool.push({ text: q.text, id: `custom-${type}-${i}`, mode: q.mode }))
  const available = pool.filter((q) => !usedIds.has(q.id))
  const source = available.length > 0 ? available : pool
  if (pool.length > 0 && available.length === 0) usedIds.clear()
  const q = source[Math.floor(Math.random() * source.length)]
  if (q) usedIds.add(q.id)
  return q || null
}

/* ─── component ───────────────────────────────────────── */

export default function GameScreen({ config, onHome }) {
  const { modes, players, couples, customQuestions = [] } = config

  // phases: 'who' | 'choice' | 'question' | 'end'
  const [phase, setPhase] = useState('who')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [truthStreaks, setTruthStreaks] = useState({}) // { playerId: number }
  const [currentQ, setCurrentQ] = useState(null)
  const [choiceType, setChoiceType] = useState(null) // 'action' | 'verite'
  const [forceAction, setForceAction] = useState(false)
  const [roundCount, setRoundCount] = useState(0)

  const currentPlayer = players[currentIndex]
  const streak = truthStreaks[currentPlayer?.id] || 0

  /* ── choice handler ── */
  const handleChoice = useCallback((type) => {
    const actualType = forceAction ? 'action' : type
    const q = pickQuestion(modes, actualType, customQuestions)
    if (!q) return
    q.resolvedText = resolveText(q.text, players, currentPlayer, couples)
    setChoiceType(actualType)
    setCurrentQ(q)
    setPhase('question')
  }, [forceAction, modes, players, currentPlayer, couples])

  /* ── after question done ── */
  const handleDone = () => {
    // update streak
    if (choiceType === 'verite') {
      setTruthStreaks((prev) => ({ ...prev, [currentPlayer.id]: (prev[currentPlayer.id] || 0) + 1 }))
    } else {
      setTruthStreaks((prev) => ({ ...prev, [currentPlayer.id]: 0 }))
    }

    const nextIndex = (currentIndex + 1) % players.length
    const nextStreak = choiceType === 'action'
      ? 0
      : (truthStreaks[currentPlayer.id] || 0) + 1
    // check if next player will be forced
    const nextPlayer = players[nextIndex]
    const nextPlayerStreak = truthStreaks[nextPlayer?.id] || 0

    setCurrentIndex(nextIndex)
    setRoundCount((r) => r + 1)
    setCurrentQ(null)
    setChoiceType(null)
    setForceAction(nextPlayerStreak >= 3)
    setPhase('who')
  }

  /* ── phases ── */
  if (phase === 'who') {
    const thisStreak = truthStreaks[currentPlayer?.id] || 0
    const willForce = thisStreak >= 3

    return (
      <div className="av-game-screen">
        <div className="av-topbar">
          <span className="av-round-counter">Tour {roundCount + 1}</span>
          <button className="av-home-btn" onClick={onHome}>
            <Home size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="glass av-who-card"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -20 }}
            transition={{ duration: 0.35 }}
          >
            <p className="av-who-label">C'est le tour de</p>
            <div className="av-who-player">
              <span
                className="av-who-gender"
                style={{
                  color: GENDER_META[currentPlayer.gender].color,
                  background: `${GENDER_META[currentPlayer.gender].color}20`,
                }}
              >
                {GENDER_META[currentPlayer.gender].icon}
              </span>
              <span className="av-who-name">{currentPlayer.name}</span>
            </div>

            {/* streak indicator */}
            <div className="av-streak-row">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`av-streak-dot ${thisStreak >= n ? 'av-streak-dot--active' : ''}`}
                  title={`${n} vérité(s) d'affilée`}
                />
              ))}
              <span className="av-streak-label">
                {willForce
                  ? '⚡ Tu dois choisir Action !'
                  : thisStreak > 0
                  ? `${thisStreak}/3 vérité${thisStreak > 1 ? 's' : ''} d'affilée`
                  : 'Vérités consécutives'}
              </span>
            </div>

            {willForce && (
              <div className="av-force-banner">
                🚫 3 vérités d'affilée — cette fois c'est Action !
              </div>
            )}

            <button
              className="btn btn-primary btn-block av-who-btn"
              onClick={() => { setForceAction(willForce); setPhase('choice') }}
            >
              C'est parti ! <ChevronRight size={18} />
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'choice') {
    return (
      <div className="av-game-screen">
        <div className="av-topbar">
          <span className="av-round-counter">Tour {roundCount + 1}</span>
          <button className="av-home-btn" onClick={onHome}>
            <Home size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="choice"
            className="av-choice-area"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="av-choice-title">{currentPlayer.name}, tu choisis…</p>

            {forceAction && (
              <motion.div
                className="av-force-banner av-force-banner--big"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
              >
                🚫 Tu as déjà choisi Vérité 3 fois — c'est obligatoirement Action !
              </motion.div>
            )}

            <div className="av-choice-btns">
              <motion.button
                className="av-choice-btn av-choice-btn--action"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleChoice('action')}
              >
                <span className="av-choice-icon">⚡</span>
                <span className="av-choice-label">Action</span>
                <span className="av-choice-sub">Ose relever le défi</span>
              </motion.button>

              <motion.button
                className={`av-choice-btn av-choice-btn--verite ${forceAction ? 'av-choice-btn--disabled' : ''}`}
                whileHover={!forceAction ? { scale: 1.04 } : {}}
                whileTap={!forceAction ? { scale: 0.97 } : {}}
                onClick={() => !forceAction && handleChoice('verite')}
                disabled={forceAction}
              >
                <span className="av-choice-icon">🤫</span>
                <span className="av-choice-label">Vérité</span>
                <span className="av-choice-sub">Dis toute la vérité</span>
                {forceAction && <span className="av-choice-lock">🔒</span>}
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  if (phase === 'question' && currentQ) {
    const modeMeta = MODE_META[currentQ.mode]
    const isAction = choiceType === 'action'

    return (
      <div className="av-game-screen">
        <div className="av-topbar">
          <span className="av-round-counter">Tour {roundCount + 1}</span>
          <button className="av-home-btn" onClick={onHome}>
            <Home size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="question"
            className="av-question-wrap"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Type badge */}
            <div className={`av-type-badge ${isAction ? 'av-type-badge--action' : 'av-type-badge--verite'}`}>
              {isAction ? '⚡ Action' : '🤫 Vérité'}
            </div>

            {/* Mode badge */}
            <div
              className="av-mode-badge"
              style={{ background: modeMeta.colorLight, color: modeMeta.color, border: `1px solid ${modeMeta.colorBorder}` }}
            >
              {modeMeta.emoji} {modeMeta.label}
            </div>

            {/* Player */}
            <p className="av-q-player">{currentPlayer.name}</p>

            {/* Question card */}
            <motion.div
              className="glass av-question-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <p
                className="av-question-text"
                dangerouslySetInnerHTML={{ __html: currentQ.resolvedText }}
              />
            </motion.div>

            <motion.button
              className="btn btn-primary btn-block av-done-btn"
              onClick={handleDone}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Fait ! Joueur suivant <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return null
}
