import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, ArrowRight, RefreshCw } from 'lucide-react'
import { STATEMENTS, MODE_META } from '../data/statements'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function GameScreen({ config, onEnd, onHome }) {
  const { modes, players, customStatements = [] } = config

  const pool = useMemo(() => {
    const base = modes.flatMap((m) =>
      (STATEMENTS[m] || []).map((text) => ({ text, mode: m }))
    )
    const custom = customStatements
      .filter((s) => modes.includes(s.mode))
      .map((s) => ({ text: s.text, mode: s.mode }))
    return shuffle([...base, ...custom])
  }, [modes, customStatements])

  const [index, setIndex] = useState(0)
  const [drunkPlayers, setDrunkPlayers] = useState(new Set())
  const [hasDrunk, setHasDrunk] = useState(false) // for anonymous feedback
  const [finished, setFinished] = useState(false)
  const [direction, setDirection] = useState(1)

  const current = pool[index]
  const total = pool.length
  const progress = ((index + 1) / total) * 100

  const togglePlayer = (name) => {
    setDrunkPlayers((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true)
      return
    }
    setDirection(1)
    setIndex(index + 1)
    setDrunkPlayers(new Set())
    setHasDrunk(false)
  }

  const restart = () => {
    setIndex(0)
    setDrunkPlayers(new Set())
    setHasDrunk(false)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="jnj-game-screen">
        <motion.div
          className="glass jnj-end-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div style={{ fontSize: '4rem', marginBottom: 12 }}>🎉</div>
          <h2 style={{ marginBottom: 8 }}>Partie terminée !</h2>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            {total} questions affrontées
          </p>
          <div className="flex gap-2 justify-center" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={restart}>
              <RefreshCw size={16} /> Rejouer
            </button>
            <button className="btn btn-primary" onClick={onHome}>
              <Home size={16} /> Accueil
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const meta = MODE_META[current.mode]

  return (
    <div className="jnj-game-screen">
      {/* Top bar */}
      <div className="jnj-topbar">
        <button className="icon-btn" onClick={onHome} title="Accueil">
          <Home size={20} />
        </button>
        <span className="jnj-counter">
          {index + 1} / {total}
        </span>
        <div style={{ width: 36 }} />
      </div>

      {/* Progress bar */}
      <div className="jnj-progress-track">
        <motion.div
          className="jnj-progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Mode badge */}
      <div
        className="jnj-mode-badge"
        style={{ background: meta.colorLight, color: meta.color, border: `1px solid ${meta.colorBorder}` }}
      >
        {meta.emoji} {meta.label}
      </div>

      {/* Statement card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="glass jnj-statement-card"
          initial={{ opacity: 0, x: direction * 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -50 }}
          transition={{ duration: 0.25 }}
        >
          <p className="jnj-statement-text">
            Je n'ai jamais…
          </p>
          <p className="jnj-statement-body">{current.text}</p>
        </motion.div>
      </AnimatePresence>

      {/* Player chips or anonymous drink button */}
      {players.length > 0 ? (
        <div className="section" style={{ width: '100%', maxWidth: 460 }}>
          <p className="jnj-section-label" style={{ textAlign: 'center' }}>
            Qui doit boire ? 🍺
          </p>
          <div className="jnj-player-chips">
            {players.map((p) => {
              const drunk = drunkPlayers.has(p.name)
              return (
                <button
                  key={p.id}
                  className={`jnj-player-chip ${drunk ? 'jnj-player-chip--drunk' : ''}`}
                  onClick={() => togglePlayer(p.name)}
                >
                  {drunk ? '🍺' : '😐'} {p.name}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <motion.button
            className={`jnj-drink-btn ${hasDrunk ? 'jnj-drink-btn--active' : ''}`}
            onClick={() => setHasDrunk(!hasDrunk)}
            whileTap={{ scale: 0.93 }}
          >
            {hasDrunk ? '🍺 J\'ai bu !' : '🍻 J\'ai fait ça !'}
          </motion.button>
        </div>
      )}

      {/* Next button */}
      <button className="btn btn-primary jnj-next-btn" onClick={next}>
        {index + 1 >= total ? 'Voir les résultats' : 'Suivant'}
        <ArrowRight size={18} />
      </button>
    </div>
  )
}
