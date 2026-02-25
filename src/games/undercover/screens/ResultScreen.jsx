import { motion } from 'framer-motion'
import { RotateCcw, Home } from 'lucide-react'
import { getInitials, getAvatarGradient } from '../utils/gameLogic'

export default function ResultScreen({ result, onReplay, onHome }) {
  const { winner, pair, assignments, players } = result
  const isCivilWin = winner === 'civil'

  return (
    <motion.div
      className="glass"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="section result-screen">
        <p className="emoji">{isCivilWin ? '🎉' : '🕵️'}</p>
        <h2>{isCivilWin ? 'Les Civils gagnent !' : 'L\'Undercover gagne !'}</h2>
        <p className="sub">
          {isCivilWin
            ? 'Tous les imposteurs ont été démasqués'
            : 'L\'imposteur a réussi à survivre'}
        </p>

        <div style={{ marginBottom: 20 }}>
          <span className="chip chip-accent">
            Civil : {pair.civil}
          </span>
          <span className="chip" style={{ marginLeft: 8 }}>
            Undercover : {pair.undercover}
          </span>
        </div>

        {/* Reveal all roles */}
        <div className="flex-col gap-2" style={{ textAlign: 'left', marginBottom: 24 }}>
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`player-item ${!p.alive ? 'eliminated' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className="number"
                  style={{
                    background: assignments[p.id].role === 'undercover'
                      ? 'var(--danger)' : 'var(--success)'
                  }}
                >
                  {assignments[p.id].role === 'undercover' ? '🕵️' : '👤'}
                </div>
                <div>
                  <span className="name">{p.name}</span>
                  <br />
                  <span className="text-sm text-muted">
                    {assignments[p.id].role === 'undercover' ? 'Undercover' : 'Civil'}
                    {!p.alive ? ' — éliminé(e)' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3" style={{ marginTop: 4 }}>
          {onHome && (
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onHome}>
              <Home size={16} /> Accueil
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={onReplay}>
            <RotateCcw size={18} /> Nouvelle partie
          </button>
        </div>
      </div>
    </motion.div>
  )
}
