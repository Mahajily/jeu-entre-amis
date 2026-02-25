import { ChevronRight, Lock } from 'lucide-react'

const GAMES = [
  {
    id: 'undercover',
    title: 'Undercover',
    emoji: '🕵️',
    description: 'Trouve l\'espion caché parmi les joueurs avant qu\'il ne t\'élimine.',
    color: '#6c5ce7',
    colorLight: 'rgba(108, 92, 231, 0.15)',
    colorBorder: 'rgba(108, 92, 231, 0.35)',
    available: true,
    modes: null,
  },
  {
    id: 'action-verite',
    title: 'Action ou Vérité',
    emoji: '🎭',
    description: 'Défis osés ou questions révélatrices — jusqu\'où iras-tu ?',
    color: '#e84393',
    colorLight: 'rgba(232, 67, 147, 0.12)',
    colorBorder: 'rgba(232, 67, 147, 0.3)',
    available: false,
    modes: [
      { label: 'Soft', emoji: '🌸', color: '#00b894' },
      { label: 'Hot', emoji: '🔥', color: '#e17055' },
      { label: 'Super Hot', emoji: '💥', color: '#d63031' },
    ],
  },
  {
    id: 'je-nai-jamais',
    title: "Je n'ai jamais",
    emoji: '🍻',
    description: 'Révèle tes secrets inavouables… ou bois !',
    color: '#00cec9',
    colorLight: 'rgba(0, 206, 201, 0.12)',
    colorBorder: 'rgba(0, 206, 201, 0.3)',
    available: false,
    modes: [
      { label: 'Soft', emoji: '🌸', color: '#00b894' },
      { label: 'Hot', emoji: '🔥', color: '#e17055' },
      { label: 'Super Hot', emoji: '💥', color: '#d63031' },
    ],
  },
]

export default function HomeScreen({ onSelectGame }) {
  return (
    <div className="home-screen">
      <div className="home-header">
        <div className="home-logo">🎮</div>
        <h1 className="home-title">Party Games</h1>
        <p className="home-subtitle">Choisis ton jeu et c'est parti !</p>
      </div>

      <div className="game-list">
        {GAMES.map((game) => (
          <div
            key={game.id}
            className={`game-card ${!game.available ? 'game-card--soon' : ''}`}
            style={{ '--card-color': game.color, '--card-light': game.colorLight, '--card-border': game.colorBorder }}
            onClick={() => game.available && onSelectGame(game.id)}
          >
            {/* Glow BG */}
            <div className="game-card__glow" />

            <div className="game-card__inner">
              <div className="game-card__left">
                <div className="game-card__emoji">{game.emoji}</div>
                <div className="game-card__info">
                  <div className="game-card__title-row">
                    <span className="game-card__title">{game.title}</span>
                    {!game.available && (
                      <span className="game-card__badge">
                        <Lock size={10} /> Bientôt
                      </span>
                    )}
                  </div>
                  <p className="game-card__desc">{game.description}</p>
                  {game.modes && (
                    <div className="game-card__modes">
                      {game.modes.map((m) => (
                        <span key={m.label} className="mode-chip" style={{ '--mc': m.color }}>
                          {m.emoji} {m.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {game.available && (
                <div className="game-card__arrow">
                  <ChevronRight size={20} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="home-footer">D'autres jeux arrivent bientôt ✨</p>
    </div>
  )
}
