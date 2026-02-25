import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import SetupScreen from './games/undercover/screens/SetupScreen'
import GameScreen from './games/undercover/screens/GameScreen'
import ResultScreen from './games/undercover/screens/ResultScreen'

export default function App() {
  const [screen, setScreen] = useState('home')   // 'home' | 'setup' | 'game' | 'result'
  const [activeGame, setActiveGame] = useState(null)
  const [gameConfig, setGameConfig] = useState(null)
  const [result, setResult] = useState(null)
  const [savedPlayers, setSavedPlayers] = useState([])

  function selectGame(gameId) {
    setActiveGame(gameId)
    setScreen('setup')
  }

  function startGame(config) {
    setSavedPlayers(config.players)
    setGameConfig(config)
    setScreen('game')
  }

  function endGame(res) {
    setResult(res)
    setScreen('result')
  }

  function goHome() {
    setGameConfig(null)
    setResult(null)
    setActiveGame(null)
    setScreen('home')
  }

  function replayGame() {
    setResult(null)
    setScreen('setup')
  }

  if (screen === 'home') {
    return <HomeScreen onSelectGame={selectGame} />
  }

  // ── Undercover flow ──
  if (activeGame === 'undercover') {
    return (
      <div className="container">
        <div className="header">
          <h1>UNDERCOVER</h1>
          <p className="subtitle">Le jeu de déduction entre amis</p>
        </div>

        {screen === 'setup' && (
          <SetupScreen onStart={startGame} savedPlayers={savedPlayers} onBack={goHome} />
        )}
        {screen === 'game' && (
          <GameScreen config={gameConfig} onEnd={endGame} onQuit={replayGame} />
        )}
        {screen === 'result' && (
          <ResultScreen result={result} onReplay={replayGame} onHome={goHome} />
        )}
      </div>
    )
  }

  return null
}
