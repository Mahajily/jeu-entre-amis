import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Plus, CheckCircle, XCircle, ChevronLeft, RefreshCw } from 'lucide-react'
import allCelebrities from '../data/celebrities.json'

function pickRandom(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function filterCelebrities(origins) {
  return allCelebrities.filter((c) => {
    const orig = c.origin.toLowerCase()
    return origins.some((o) => {
      if (o === 'french') return orig.includes('français')
      if (o === 'malagasy') return orig.includes('malgach')
      if (o === 'american') return orig.includes('américain')
      if (o === 'international') return orig.includes('international')
      return false
    })
  })
}

function makeCustomCelebrity(name) {
  return { name, emoji: '🎭', hints: [], origin: '', category: '' }
}

export default function GameScreen({ config, onEnd, onHome }) {
  const { personMode, customName, gameMode, timerSeconds, questionLimit, origins } = config

  const isCustom = personMode === 'custom'
  const pool = isCustom ? [] : filterCelebrities(origins)

  const [celebrity, setCelebrity] = useState(() =>
    isCustom ? makeCustomCelebrity(customName) : pickRandom(pool)
  )
  const [phase, setPhase] = useState('ready') // ready | playing | result
  const [revealedHints, setRevealedHints] = useState(0)
  const [timeLeft, setTimeLeft] = useState(timerSeconds)
  const [questionsLeft, setQuestionsLeft] = useState(questionLimit)
  const [guessed, setGuessed] = useState(null) // null | true | false
  const [timerActive, setTimerActive] = useState(false)
  const intervalRef = useRef(null)

  const showTimer = gameMode === 'timer' || gameMode === 'both'
  const showCounter = gameMode === 'counter' || gameMode === 'both'

  // Timer logic
  useEffect(() => {
    if (timerActive && showTimer) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setTimerActive(false)
            setGuessed(false)
            setPhase('result')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [timerActive, showTimer])

  const startGame = () => {
    setPhase('playing')
    setTimerActive(true)
  }

  const revealHint = () => {
    if (revealedHints < celebrity.hints.length) {
      setRevealedHints((v) => v + 1)
    }
  }

  const addTime = () => {
    setTimeLeft((v) => v + 30)
  }

  const askQuestion = () => {
    if (questionsLeft <= 1) {
      clearInterval(intervalRef.current)
      setTimerActive(false)
      setQuestionsLeft(0)
      setGuessed(false)
      setPhase('result')
    } else {
      setQuestionsLeft((v) => v - 1)
    }
  }

  const handleFound = () => {
    clearInterval(intervalRef.current)
    setTimerActive(false)
    setGuessed(true)
    setPhase('result')
  }

  const handleFailed = () => {
    clearInterval(intervalRef.current)
    setTimerActive(false)
    setGuessed(false)
    setPhase('result')
  }

  const nextCelebrity = () => {
    const next = isCustom ? makeCustomCelebrity(customName) : pickRandom(pool)
    setCelebrity(next)
    setPhase('ready')
    setRevealedHints(0)
    setTimeLeft(timerSeconds)
    setQuestionsLeft(questionLimit)
    setGuessed(null)
    setTimerActive(false)
  }

  const timerPercent = (timeLeft / timerSeconds) * 100
  const timerColor =
    timerPercent > 50 ? '#00b894' : timerPercent > 25 ? '#fdcb6e' : '#d63031'

  return (
    <div className="screen devine-game-screen">
      {/* Back/Home button */}
      <button className="back-btn" onClick={onHome}>
        <ChevronLeft size={20} />
        Accueil
      </button>

      <AnimatePresence mode="wait">
        {/* ─── READY PHASE ─── */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            className="glass-card devine-ready-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35 }}
          >
            <div className="devine-ready-icon">🤔</div>
            <h2 className="devine-ready-title">Devine qui tu es</h2>
            <p className="devine-ready-desc">
              Passez le téléphone au <strong>maître du jeu</strong>.<br />
              Il verra la célébrité et les indices.
            </p>
            <div className="devine-config-badges">
              {showTimer && (
                <span className="config-badge">
                  ⏱️ {timerSeconds}s
                </span>
              )}
              {showCounter && (
                <span className="config-badge">
                  ❓ {questionLimit} questions
                </span>
              )}
            </div>
            <motion.button
              className="btn btn--primary btn--full"
              onClick={startGame}
              whileTap={{ scale: 0.97 }}
            >
              <Eye size={18} />
              Afficher la célébrité
            </motion.button>
          </motion.div>
        )}

        {/* ─── PLAYING PHASE ─── */}
        {phase === 'playing' && (
          <motion.div
            key="playing"
            className="devine-playing-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Timer bar */}
            {showTimer && (
              <div className="timer-bar-container">
                <motion.div
                  className="timer-bar-fill"
                  style={{ backgroundColor: timerColor }}
                  animate={{ width: `${timerPercent}%` }}
                  transition={{ duration: 0.5 }}
                />
                <span className="timer-bar-label">{timeLeft}s</span>
              </div>
            )}

            <div className="devine-playing-content">
              {/* Celebrity card */}
              <div className="glass-card celebrity-card">
                <span className="celebrity-emoji">{celebrity.emoji}</span>
                <h1 className="celebrity-name">{celebrity.name}</h1>
                <div className="celebrity-meta">
                  <span className="celebrity-origin">{celebrity.origin}</span>
                  <span className="celebrity-category">{celebrity.category}</span>
                </div>
              </div>

              {/* Hints — only in celebrity mode */}
              {!isCustom && (
              <div className="hints-section">
                <div className="hints-header">
                  <span className="hints-title">Indices révélés</span>
                  <span className="hints-count">
                    {revealedHints}/{celebrity.hints.length}
                  </span>
                </div>

                <AnimatePresence>
                  {celebrity.hints.slice(0, revealedHints).map((hint, i) => (
                    <motion.div
                      key={i}
                      className="hint-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <span className="hint-number">#{i + 1}</span>
                      <span className="hint-text">{hint}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {revealedHints < celebrity.hints.length && (
                  <button className="btn btn--ghost hint-reveal-btn" onClick={revealHint}>
                    <Eye size={16} />
                    Révéler un indice
                  </button>
                )}
                {revealedHints >= celebrity.hints.length && (
                  <p className="hints-exhausted">Tous les indices ont été révélés</p>
                )}
              </div>
              )}

              {/* Controls row */}
              <div className="devine-controls">
                {showTimer && (
                  <button className="btn btn--secondary add-time-btn" onClick={addTime}>
                    <Plus size={16} />
                    +30s
                  </button>
                )}
                {showCounter && (
                  <button
                    className={`btn btn--secondary question-btn ${questionsLeft <= 3 ? 'question-btn--warning' : ''}`}
                    onClick={askQuestion}
                    disabled={questionsLeft === 0}
                  >
                    ❓ Question posée
                    <span className="question-badge">{questionsLeft}</span>
                  </button>
                )}
              </div>

              {/* Result buttons */}
              <div className="devine-result-btns">
                <motion.button
                  className="btn btn--danger btn--half"
                  onClick={handleFailed}
                  whileTap={{ scale: 0.96 }}
                >
                  <XCircle size={18} />
                  Raté
                </motion.button>
                <motion.button
                  className="btn btn--success btn--half"
                  onClick={handleFound}
                  whileTap={{ scale: 0.96 }}
                >
                  <CheckCircle size={18} />
                  A trouvé !
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── RESULT PHASE ─── */}
        {phase === 'result' && (
          <motion.div
            key="result"
            className="glass-card devine-result-card"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring' }}
          >
            <motion.div
              className={`result-verdict ${guessed ? 'result-verdict--win' : 'result-verdict--lose'}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {guessed ? '🎉' : '😢'}
            </motion.div>

            <h2 className="result-verdict-text">
              {guessed ? 'Bien joué !' : 'Dommage…'}
            </h2>
            <p className="result-verdict-sub">
              {guessed
                ? 'Le joueur a deviné la célébrité !'
                : 'Le joueur n\'a pas deviné la célébrité.'}
            </p>

            <div className="result-celebrity-reveal">
              <span className="celebrity-emoji">{celebrity.emoji}</span>
              <span className="celebrity-name-reveal">{celebrity.name}</span>
              {!isCustom && (
                <span className="celebrity-origin-reveal">{celebrity.origin}</span>
              )}
            </div>

            <div className="devine-end-btns">
              <motion.button
                className="btn btn--ghost"
                onClick={onHome}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 1 }}
              >
                Accueil
              </motion.button>
              <motion.button
                className="btn btn--primary"
                onClick={nextCelebrity}
                whileTap={{ scale: 0.97 }}
                style={{ flex: 2 }}
              >
                <RefreshCw size={16} />
                {isCustom ? 'Rejouer' : 'Célébrité suivante'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
