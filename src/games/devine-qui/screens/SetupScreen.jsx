import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, Timer, Hash, Layers, Globe, User, Star } from 'lucide-react'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return { value: `${s}`, unit: 'secondes' }
  if (s === 0) return { value: `${m}`, unit: m === 1 ? 'minute' : 'minutes' }
  return { value: `${m}m ${String(s).padStart(2, '0')}s`, unit: '' }
}

const GAME_MODES = [
  {
    id: 'timer',
    label: 'Minuteur',
    description: 'Course contre la montre',
    icon: '⏱️',
  },
  {
    id: 'counter',
    label: 'Questions',
    description: 'Nombre de questions limité',
    icon: '❓',
  },
  {
    id: 'both',
    label: 'Les deux',
    description: 'Minuteur + Questions',
    icon: '🎯',
  },
]

const ORIGINS = [
  { id: 'french', label: 'Français', emoji: '🇫🇷' },
  { id: 'malagasy', label: 'Malgaches', emoji: '🇲🇬' },
  { id: 'american', label: 'Américains', emoji: '🇺🇸' },
  { id: 'international', label: 'International', emoji: '🌍' },
]

export default function SetupScreen({ onStart, onBack }) {
  const [personMode, setPersonMode] = useState('celebrities') // 'celebrities' | 'custom'
  const [customName, setCustomName] = useState('')
  const [gameMode, setGameMode] = useState('timer')
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [questionLimit, setQuestionLimit] = useState(10)
  const [selectedOrigins, setSelectedOrigins] = useState(
    new Set(['french', 'malagasy', 'american', 'international'])
  )

  const toggleOrigin = (id) => {
    setSelectedOrigins((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev // keep at least one
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleStart = () => {
    onStart({
      personMode,
      customName: customName.trim(),
      gameMode,
      timerSeconds,
      questionLimit,
      origins: personMode === 'celebrities' ? Array.from(selectedOrigins) : [],
    })
  }

  const showTimer = gameMode === 'timer' || gameMode === 'both'
  const showCounter = gameMode === 'counter' || gameMode === 'both'
  const canStart = personMode === 'celebrities' || customName.trim().length > 0

  return (
    <div className="screen devine-setup-screen">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={20} />
        Retour
      </button>

      <motion.div
        className="glass-card devine-setup-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="devine-setup-header">
          <span className="devine-setup-emoji">🤔</span>
          <h1 className="devine-setup-title">Devine qui tu es</h1>
          <p className="devine-setup-subtitle">
            Configure ta partie avant de commencer
          </p>
        </div>

        {/* Person mode toggle */}
        <section className="setup-section">
          <div className="person-mode-toggle">
            <button
              className={`person-mode-btn ${personMode === 'celebrities' ? 'person-mode-btn--active' : ''}`}
              onClick={() => setPersonMode('celebrities')}
            >
              <Star size={15} />
              Célébrité
            </button>
            <button
              className={`person-mode-btn ${personMode === 'custom' ? 'person-mode-btn--active' : ''}`}
              onClick={() => setPersonMode('custom')}
            >
              <User size={15} />
              Personnalisé
            </button>
          </div>
        </section>

        {/* Custom name input */}
        <AnimatePresence>
          {personMode === 'custom' && (
            <motion.section
              className="setup-section"
              key="custom-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="setup-section-title">
                <User size={16} />
                Nom de la personne à deviner
              </h2>
              <input
                className="custom-name-input"
                type="text"
                placeholder="Ex : Cristiano Ronaldo"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={60}
              />
              <p className="custom-name-hint">
                Seul le maître du jeu verra ce nom.
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Game Mode Selection */}
        <section className="setup-section">
          <h2 className="setup-section-title">
            <Layers size={16} />
            Mode de jeu
          </h2>
          <div className="mode-selector">
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                className={`mode-option ${gameMode === m.id ? 'mode-option--active' : ''}`}
                onClick={() => setGameMode(m.id)}
              >
                <span className="mode-option-icon">{m.icon}</span>
                <span className="mode-option-label">{m.label}</span>
                <span className="mode-option-desc">{m.description}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Timer config */}
        {showTimer && (
          <motion.section
            className="setup-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h2 className="setup-section-title">
              <Timer size={16} />
              Durée du minuteur
            </h2>
            <div className="number-control">
              <button
                className="btn-count btn-count--minus"
                onClick={() => setTimerSeconds((v) => Math.max(15, v - 15))}
                disabled={timerSeconds <= 15}
              >
                −
              </button>
              <div className="number-display">
                <span className="number-value">{formatTime(timerSeconds).value}</span>
                {formatTime(timerSeconds).unit && (
                  <span className="number-unit">{formatTime(timerSeconds).unit}</span>
                )}
              </div>
              <button
                className="btn-count btn-count--plus"
                onClick={() => setTimerSeconds((v) => Math.min(300, v + 15))}
                disabled={timerSeconds >= 300}
              >
                +
              </button>
            </div>
          </motion.section>
        )}

        {/* Question counter config */}
        {showCounter && (
          <motion.section
            className="setup-section"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h2 className="setup-section-title">
              <Hash size={16} />
              Nombre de questions
            </h2>
            <div className="number-control">
              <button
                className="btn-count btn-count--minus"
                onClick={() => setQuestionLimit((v) => Math.max(3, v - 1))}
                disabled={questionLimit <= 3}
              >
                −
              </button>
              <div className="number-display">
                <span className="number-value">{questionLimit}</span>
                <span className="number-unit">{questionLimit === 1 ? 'question' : 'questions'}</span>
              </div>
              <button
                className="btn-count btn-count--plus"
                onClick={() => setQuestionLimit((v) => Math.min(30, v + 1))}
                disabled={questionLimit >= 30}
              >
                +
              </button>
            </div>
          </motion.section>
        )}

        {/* Origins — only visible in celebrity mode */}
        <AnimatePresence>
          {personMode === 'celebrities' && (
            <motion.section
              className="setup-section"
              key="origins"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
            >
              <h2 className="setup-section-title">
                <Globe size={16} />
                Célébrités
              </h2>
              <div className="origins-grid">
                {ORIGINS.map((o) => (
                  <button
                    key={o.id}
                    className={`origin-chip ${selectedOrigins.has(o.id) ? 'origin-chip--active' : ''}`}
                    onClick={() => toggleOrigin(o.id)}
                  >
                    <span>{o.emoji}</span>
                    <span>{o.label}</span>
                  </button>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <motion.button
          className="btn btn--primary btn--full devine-start-btn"
          onClick={handleStart}
          whileTap={{ scale: 0.97 }}
          disabled={!canStart}
          style={{ opacity: canStart ? 1 : 0.5 }}
        >
          🎲 Lancer la partie
        </motion.button>
      </motion.div>
    </div>
  )
}
