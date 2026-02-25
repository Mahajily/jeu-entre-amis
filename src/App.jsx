import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import SetupScreen from './games/undercover/screens/SetupScreen'
import GameScreen from './games/undercover/screens/GameScreen'
import ResultScreen from './games/undercover/screens/ResultScreen'
import DevineSetupScreen from './games/devine-qui/screens/SetupScreen'
import DevineGameScreen from './games/devine-qui/screens/GameScreen'
import JamaisSetupScreen from './games/je-nai-jamais/screens/SetupScreen'
import JamaisGameScreen from './games/je-nai-jamais/screens/GameScreen'
import AvSetupScreen from './games/action-verite/screens/SetupScreen'
import AvGameScreen from './games/action-verite/screens/GameScreen'

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

  // ── Devine qui tu es flow ──
  if (activeGame === 'devine-qui') {
    if (screen === 'setup') {
      return <DevineSetupScreen onStart={startGame} onBack={goHome} />
    }
    if (screen === 'game') {
      return <DevineGameScreen config={gameConfig} onEnd={endGame} onHome={goHome} />
    }
  }

  // ── Je n'ai jamais flow ──
  if (activeGame === 'je-nai-jamais') {
    if (screen === 'setup') {
      return <JamaisSetupScreen onStart={startGame} onBack={goHome} />
    }
    if (screen === 'game') {
      return <JamaisGameScreen config={gameConfig} onEnd={endGame} onHome={goHome} />
    }
  }

  // ── Action ou Vérité flow ──
  if (activeGame === 'action-verite') {
    if (screen === 'setup') {
      return <AvSetupScreen onStart={startGame} onBack={goHome} />
    }
    if (screen === 'game') {
      return <AvGameScreen config={gameConfig} onHome={goHome} />
    }
  }

  return null
}
