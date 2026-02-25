import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Vote, ChevronRight, LogOut, Info } from 'lucide-react'
import { assignRoles, checkWin, getInitials, getAvatarGradient } from '../utils/gameLogic'

const fadeIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
}

export default function GameScreen({ config, onEnd, onQuit }) {
  const [players, setPlayers] = useState(() => config.players.map(p => ({ ...p })))
  const [round, setRound] = useState(1)

  // Phase: 'distribute' | 'discuss' | 'eliminate' | 'eliminated'
  const [phase, setPhase] = useState('distribute')

  // Distribution
  const [viewIndex, setViewIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(false)

  // Elimination
  const [selectedTarget, setSelectedTarget] = useState(null)
  const [eliminatedId, setEliminatedId] = useState(null)

  // Tooltip
  const [showHint, setShowHint] = useState(false)

  const { pair, assignments } = useMemo(
    () => assignRoles(config.players, config.nbUndercover, config.wordPool),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const alivePlayers = players.filter(p => p.alive)

  /* ─── Distribution ─── */
  function showWord() {
    setWordVisible(true)
  }

  function nextPlayer() {
    setWordVisible(false)
    setShowHint(false)
    if (viewIndex + 1 < alivePlayers.length) {
      setViewIndex(viewIndex + 1)
    } else {
      setPhase('discuss')
    }
  }

  /* ─── Eliminate directly ─── */
  function confirmElimination() {
    if (!selectedTarget) return
    setEliminatedId(selectedTarget)
    setPlayers(prev => prev.map(p => p.id === selectedTarget ? { ...p, alive: false } : p))
    setPhase('eliminated')
  }

  /* ─── After elimination ─── */
  function afterElimination() {
    const updated = players.map(p => p.id === eliminatedId ? { ...p, alive: false } : p)
    const winner = checkWin(updated, assignments)
    if (winner) {
      onEnd({ winner, pair, assignments, players: updated })
      return
    }
    setRound(r => r + 1)
    setViewIndex(0)
    setWordVisible(false)
    setEliminatedId(null)
    setSelectedTarget(null)
    setPhase('distribute')
  }

  /* ─── Render ─── */
  return (
    <motion.div className="glass" {...fadeIn}>
      {/* Status bar */}
      <div className="section flex items-center justify-between">
        <div className="flex gap-2">
          <span className="chip chip-accent">Tour {round}</span>
          <span className="chip">{alivePlayers.length} en vie</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { if (confirm('Quitter la partie ?')) onQuit() }}>
          <LogOut size={14} /> Quitter
        </button>
      </div>

      {/* ─── DISTRIBUTE ─── */}
      {phase === 'distribute' && (
        <AnimatePresence mode="wait">
          <motion.div key={viewIndex} className="section reveal-card" {...fadeIn}>
            <p className="player-turn">Joueur {viewIndex + 1} / {alivePlayers.length}</p>
            <p className="player-name-big">{alivePlayers[viewIndex]?.name}</p>

            {!wordVisible ? (
              <>
                <div className="word-box animate-pulse">
                  <span className="hidden-word">● ● ● ●</span>
                </div>
                <br />
                <button className="btn btn-primary" onClick={showWord}>
                  <Eye size={18} /> Voir mon mot
                </button>
                <p className="text-sm text-muted mt-3">
                  Appuyez pour révéler votre mot secret
                </p>
              </>
            ) : (
              <>
                <div className="word-box">
                  <span className="word">{assignments[alivePlayers[viewIndex]?.id]?.word}</span>
                  {assignments[alivePlayers[viewIndex]?.id]?.hint && (
                    <button
                      className="hint-toggle"
                      onClick={() => setShowHint(h => !h)}
                      title="Voir la définition"
                    >
                      <Info size={18} />
                    </button>
                  )}
                </div>
                <AnimatePresence>
                  {showHint && assignments[alivePlayers[viewIndex]?.id]?.hint && (
                    <motion.div
                      className="hint-bubble"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      💡 {assignments[alivePlayers[viewIndex]?.id]?.hint}
                    </motion.div>
                  )}
                </AnimatePresence>
                <br />
                <button className="btn btn-success" onClick={nextPlayer}>
                  C'est bon <ChevronRight size={18} />
                </button>
                <p className="text-sm text-muted mt-3">
                  Mémorisez votre mot puis passez l'appareil
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* ─── DISCUSS ─── */}
      {phase === 'discuss' && (
        <motion.div className="section" {...fadeIn}>
          <div className="text-center" style={{ padding: '32px 0' }}>
            <p style={{ fontSize: '3rem', marginBottom: 12 }}>💬</p>
            <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Discussion</h3>
            <p className="text-muted text-sm" style={{ maxWidth: 300, margin: '0 auto 24px' }}>
              Chaque joueur donne un indice sur son mot.
              Discutez et débattez pour trouver l'imposteur !
            </p>
            <button className="btn btn-primary btn-block" onClick={() => { setSelectedTarget(null); setPhase('eliminate') }}>
              <Vote size={18} /> Passer à l'élimination
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── ELIMINATE (direct pick) ─── */}
      {phase === 'eliminate' && (
        <motion.div className="section" {...fadeIn}>
          <div className="text-center mb-3">
            <p style={{ fontSize: '2.4rem', marginBottom: 8 }}>🗳️</p>
            <h3 style={{ fontWeight: 800, marginBottom: 4 }}>Élimination</h3>
            <p className="text-sm text-muted">Choisissez le joueur à éliminer</p>
          </div>

          <div className="vote-grid">
            {alivePlayers.map((p, i) => {
              const isSelected = selectedTarget === p.id
              return (
                <motion.div
                  key={p.id}
                  className={`vote-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget(p.id)}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="avatar" style={{ background: getAvatarGradient(i) }}>
                    {getInitials(p.name)}
                  </div>
                  <span className="player-name">{p.name}</span>
                </motion.div>
              )
            })}
          </div>

          <div className="mt-4" style={{ textAlign: 'center' }}>
            <button
              className="btn btn-danger btn-block"
              disabled={!selectedTarget}
              onClick={confirmElimination}
            >
              Éliminer {selectedTarget ? players.find(p => p.id === selectedTarget)?.name : '...'}
            </button>
            <button
              className="btn btn-ghost btn-block mt-2"
              onClick={() => setPhase('discuss')}
            >
              Retour à la discussion
            </button>
          </div>
        </motion.div>
      )}

      {/* ─── ELIMINATED (show role, never the word) ─── */}
      {phase === 'eliminated' && eliminatedId && (() => {
        const elim = players.find(p => p.id === eliminatedId)
        const role = assignments[eliminatedId]?.role
        const isUndercover = role === 'undercover'
        return (
          <motion.div className="section result-screen" {...fadeIn}>
            <p className="emoji">{isUndercover ? '🕵️' : '😇'}</p>
            <h2>{elim?.name}</h2>
            <p className="sub">a été éliminé(e)</p>
            <div className={`role-badge ${isUndercover ? 'role-undercover' : 'role-civil'}`}>
              {isUndercover ? '🔴 C\'était un Imposteur !' : '🟢 C\'était un Civil'}
            </div>

            <button className="btn btn-primary btn-block mt-4" onClick={afterElimination}>
              Continuer <ChevronRight size={18} />
            </button>
          </motion.div>
        )
      })()}
    </motion.div>
  )
}
