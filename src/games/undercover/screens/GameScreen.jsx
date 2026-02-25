import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, Vote, ChevronRight, LogOut, Info, Shuffle } from 'lucide-react'
import { assignRoles, checkWin, getInitials, getAvatarGradient } from '../utils/gameLogic'

const fadeIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3 },
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function GameScreen({ config, onEnd, onQuit }) {
  const [players, setPlayers] = useState(() => config.players.map(p => ({ ...p })))
  const [round, setRound] = useState(1)

  // Phase: 'distribute' | 'discuss' | 'eliminate' | 'eliminated'
  const [phase, setPhase] = useState('distribute')

  // Distribution — shuffled order
  const [distributeOrder, setDistributeOrder] = useState(() =>
    shuffle(config.players.map(p => p.id))
  )
  const [viewIndex, setViewIndex] = useState(0)
  const [wordVisible, setWordVisible] = useState(false)

  // Discussion — separate shuffled order shown during discussion phase
  const [speakOrder, setSpeakOrder] = useState([])

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
  // Players in the shuffled distribute order (alive only)
  const orderedPlayers = distributeOrder
    .map(id => alivePlayers.find(p => p.id === id))
    .filter(Boolean)

  /* ─── Distribution ─── */
  function showWord() {
    setWordVisible(true)
  }

  function nextPlayer() {
    setWordVisible(false)
    setShowHint(false)
    if (viewIndex + 1 < orderedPlayers.length) {
      setViewIndex(viewIndex + 1)
    } else {
      // Generate a NEW random speak order for discussion (different shuffle)
      setSpeakOrder(shuffle(alivePlayers.map(p => p.id)))
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
    const nextAlive = updated.filter(p => p.alive).map(p => p.id)
    setRound(r => r + 1)
    setDistributeOrder(shuffle(nextAlive))
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
            <p className="player-turn">Joueur {viewIndex + 1} / {orderedPlayers.length}</p>
            <p className="player-name-big">{orderedPlayers[viewIndex]?.name}</p>

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
                  <span className="word">{assignments[orderedPlayers[viewIndex]?.id]?.word}</span>
                  {assignments[orderedPlayers[viewIndex]?.id]?.hint && (
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
                  {showHint && assignments[orderedPlayers[viewIndex]?.id]?.hint && (
                    <motion.div
                      className="hint-bubble"
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      💡 {assignments[orderedPlayers[viewIndex]?.id]?.hint}
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
          <div style={{ padding: '24px 0' }}>
            <div className="text-center" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '2.4rem', marginBottom: 8 }}>💬</p>
              <h3 style={{ fontWeight: 800, marginBottom: 6 }}>Discussion</h3>
              <p className="text-muted text-sm">
                Chaque joueur donne un indice sur son mot.
              </p>
            </div>

            {/* Speak order */}
            <div className="glass" style={{ padding: '14px 16px', marginBottom: 20 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <Shuffle size={14} style={{ color: 'var(--accent-light)' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Ordre de parole</span>
              </div>
              <div className="flex-col gap-2">
                {speakOrder.map((id, i) => {
                  const p = alivePlayers.find(pl => pl.id === id)
                  if (!p) return null
                  return (
                    <div key={id} className="flex items-center gap-3" style={{ padding: '8px 0' }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: 'var(--accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 800, flexShrink: 0
                      }}>{i + 1}</div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

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
