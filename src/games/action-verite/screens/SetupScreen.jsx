import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, UserPlus, X, Play, Heart, HeartOff, Upload, FileDown, Trash2, Users } from 'lucide-react'
import * as XLSX from 'xlsx'
import { MODE_META, GENDER_META } from '../data/questions'

export default function SetupScreen({ onStart, onBack }) {
  const [selectedModes, setSelectedModes] = useState(new Set(['soft', 'hot']))
  const [players, setPlayers] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [genderInput, setGenderInput] = useState('M')
  const [couples, setCouples] = useState([]) // [[id1, id2], ...]
  const [coupleA, setCoupleA] = useState('')
  const [coupleB, setCoupleB] = useState('')
  const [showCoupleForm, setShowCoupleForm] = useState(false)
  const [siblings, setSiblings] = useState([]) // [[id1, id2], ...]
  const [siblingA, setSiblingA] = useState('')
  const [siblingB, setSiblingB] = useState('')
  const [showSiblingForm, setShowSiblingForm] = useState(false)
  const [customQuestions, setCustomQuestions] = useState([])
  const [importError, setImportError] = useState('')
  const fileRef = useRef(null)

  /* ── Mode selection ── */
  const toggleMode = (id) => {
    setSelectedModes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        if (next.size === 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  /* ── Players ── */
  const addPlayer = (e) => {
    e.preventDefault()
    const name = nameInput.trim()
    if (!name) return
    setPlayers((prev) => [...prev, { id: Date.now().toString(), name, gender: genderInput }])
    setNameInput('')
  }

  const removePlayer = (id) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
    setCouples((prev) => prev.filter(([a, b]) => a !== id && b !== id))
    setSiblings((prev) => prev.filter(([a, b]) => a !== id && b !== id))
  }

  /* ── Couples ── */
  const isInCouple = (id) => couples.some(([a, b]) => a === id || b === id)

  const getPartner = (id) => {
    const pair = couples.find(([a, b]) => a === id || b === id)
    if (!pair) return null
    const partnerId = pair[0] === id ? pair[1] : pair[0]
    return players.find((p) => p.id === partnerId)
  }

  const addCouple = () => {
    if (!coupleA || !coupleB || coupleA === coupleB) return
    // remove any existing couple for these players first
    setCouples((prev) => [
      ...prev.filter(([a, b]) => a !== coupleA && b !== coupleA && a !== coupleB && b !== coupleB),
      [coupleA, coupleB],
    ])
    setCoupleA('')
    setCoupleB('')
    setShowCoupleForm(false)
  }

  const removeCouple = (id) => {
    setCouples((prev) => prev.filter(([a, b]) => a !== id && b !== id))
  }

  /* ── Siblings ── */
  const getSibling = (id) => {
    const pair = siblings.find(([a, b]) => a === id || b === id)
    if (!pair) return null
    const sibId = pair[0] === id ? pair[1] : pair[0]
    return players.find((p) => p.id === sibId)
  }

  const addSibling = () => {
    if (!siblingA || !siblingB || siblingA === siblingB) return
    setSiblings((prev) => [
      ...prev.filter(([a, b]) => a !== siblingA && b !== siblingA && a !== siblingB && b !== siblingB),
      [siblingA, siblingB],
    ])
    setSiblingA('')
    setSiblingB('')
    setShowSiblingForm(false)
  }

  const removeSibling = (id) => {
    setSiblings((prev) => prev.filter(([a, b]) => a !== id && b !== id))
  }

  /* ── Import ── */
  function parseQuestionsData(data) {
    if (Array.isArray(data)) {
      return data
        .filter((r) => r.mode && r.type && r.text)
        .map((r) => ({ mode: String(r.mode).toLowerCase(), type: String(r.type).toLowerCase(), text: String(r.text) }))
    }
    const result = []
    for (const [mode, types] of Object.entries(data)) {
      if (typeof types === 'object' && !Array.isArray(types)) {
        for (const [type, texts] of Object.entries(types)) {
          if (Array.isArray(texts)) texts.forEach((t) => result.push({ mode, type, text: String(t) }))
        }
      }
    }
    return result
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportError('')
    try {
      if (file.name.endsWith('.json')) {
        const parsed = parseQuestionsData(JSON.parse(await file.text()))
        setCustomQuestions(parsed)
      } else {
        const wb = XLSX.read(await file.arrayBuffer())
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        setCustomQuestions(
          rows.filter((r) => r.mode && r.type && r.text)
              .map((r) => ({ mode: String(r.mode).toLowerCase(), type: String(r.type).toLowerCase(), text: String(r.text) }))
        )
      }
    } catch {
      setImportError('Fichier invalide. Vérifiez le format.')
    }
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['mode', 'type', 'text'],
      ['hot', 'verite', 'Exemple de vérité chaude'],
      ['hot', 'action', 'Exemple d’action chaude'],
      ['superhot', 'verite', 'Exemple de vérité super hot'],
      ['superhot', 'action', 'Exemple d’action super hot'],
      ['soft', 'verite', 'Exemple de vérité soft'],
      ['soft', 'action', 'Exemple d’action soft'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Questions')
    XLSX.writeFile(wb, 'template_action_verite.xlsx')
  }

  const downloadJsonTemplate = () => {
    const template = {
      soft: {
        verite: ["Exemple de vérité soft"],
        action: ["Exemple d'action soft avec {{joueur}}"]
      },
      hot: {
        verite: ["Exemple de vérité hot"],
        action: ["Exemple d'action hot avec {{joueur}}"]
      },
      superhot: {
        verite: ["Exemple de vérité super hot"],
        action: ["Exemple d'action super hot avec {{joueur}}"]
      }
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'template_action_verite.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /* ── Start ── */
  const canStart = players.length >= 2

  const handleStart = () => {
    onStart({ modes: Array.from(selectedModes), players, couples, siblings, customQuestions })
  }

  return (
    <div className="av-setup-screen">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Accueil
      </button>

      <motion.div
        className="glass av-setup-card"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <div className="jnj-setup-header">
          <span className="jnj-setup-emoji">🎭</span>
          <h1 className="jnj-setup-title">Action ou Vérité</h1>
          <p className="jnj-setup-subtitle">Défie tes amis… ou révèle tes secrets !</p>
        </div>

        {/* Mode selector */}
        <div className="section">
          <p className="jnj-section-label">Intensité du jeu</p>
          <div className="jnj-mode-grid">
            {Object.entries(MODE_META).map(([id, meta]) => {
              const active = selectedModes.has(id)
              return (
                <button
                  key={id}
                  className={`jnj-mode-card ${active ? 'jnj-mode-card--active' : ''}`}
                  style={{ '--mc': meta.color, '--mc-light': meta.colorLight, '--mc-border': meta.colorBorder }}
                  onClick={() => toggleMode(id)}
                >
                  <span className="jnj-mode-emoji">{meta.emoji}</span>
                  <span className="jnj-mode-label">{meta.label}</span>
                  <span className="jnj-mode-desc">{meta.description}</span>
                  {active && <span className="jnj-mode-check">✓</span>}
                </button>
              )
            })}
          </div>
          <p className="jnj-mode-hint">
            {selectedModes.size > 1
              ? `${selectedModes.size} modes mélangés`
              : `Mode ${MODE_META[[...selectedModes][0]].label}`}
          </p>
        </div>

        {/* Players */}
        <div className="section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="jnj-section-label">Joueurs <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 2)</span></p>

          <form onSubmit={addPlayer} className="av-player-form">
            {/* Gender picker */}
            <div className="av-gender-picker">
              {Object.entries(GENDER_META).map(([g, meta]) => (
                <button
                  key={g}
                  type="button"
                  className={`av-gender-btn ${genderInput === g ? 'av-gender-btn--active' : ''}`}
                  style={{ '--gc': meta.color }}
                  onClick={() => setGenderInput(g)}
                >
                  <span className="av-gender-icon">{meta.icon}</span>
                  <span className="av-gender-label">{meta.label}</span>
                </button>
              ))}
            </div>

            <div className="av-name-row">
              <input
                className="input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nom du joueur..."
              />
              <button type="submit" className="btn btn-primary" disabled={!nameInput.trim()}>
                <UserPlus size={16} />
              </button>
            </div>
          </form>

          {players.length > 0 && (
            <div className="av-player-list">
              {players.map((p, i) => {
                const partner = getPartner(p.id)
                const sibling = getSibling(p.id)
                const gMeta = GENDER_META[p.gender]
                return (
                  <div key={p.id} className="av-player-item">
                    <div className="av-player-left">
                      <span className="av-player-num">{i + 1}</span>
                      <span
                        className="av-player-gender"
                        style={{ color: gMeta.color, borderColor: `${gMeta.color}40`, background: `${gMeta.color}15` }}
                      >
                        {gMeta.icon}
                      </span>
                      <span className="av-player-name">{p.name}</span>
                      {partner && (
                        <span className="av-couple-tag">
                          💑 {partner.name}
                        </span>
                      )}
                      {sibling && (
                        <span className="av-sibling-tag">
                          👫 {sibling.name}
                        </span>
                      )}
                    </div>
                    <div className="av-player-actions">
                      {partner && (
                        <button className="av-icon-btn av-icon-btn--danger" onClick={() => removeCouple(p.id)} title="Supprimer le couple">
                          <HeartOff size={14} />
                        </button>
                      )}
                      {sibling && (
                        <button className="av-icon-btn av-icon-btn--sibling" onClick={() => removeSibling(p.id)} title="Supprimer frère/sœur">
                          <Users size={14} />
                        </button>
                      )}
                      <button className="av-icon-btn" onClick={() => removePlayer(p.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Couple section */}
          {players.length >= 2 && (
            <div className="av-couple-section">
              {!showCoupleForm ? (
                <button className="av-couple-add-btn" onClick={() => setShowCoupleForm(true)}>
                  <Heart size={14} /> Marquer un couple
                </button>
              ) : (
                <motion.div
                  className="av-couple-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <p className="av-couple-form-label">💑 Ils sont en couple :</p>
                  <div className="av-couple-selects">
                    <select
                      className="input av-couple-select"
                      value={coupleA}
                      onChange={(e) => setCoupleA(e.target.value)}
                    >
                      <option value="">Joueur A</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <span className="av-couple-heart">💕</span>
                    <select
                      className="input av-couple-select"
                      value={coupleB}
                      onChange={(e) => setCoupleB(e.target.value)}
                    >
                      <option value="">Joueur B</option>
                      {players.filter(p => p.id !== coupleA).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="av-couple-form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={addCouple}
                      disabled={!coupleA || !coupleB || coupleA === coupleB}
                    >
                      Confirmer
                    </button>
                    <button className="btn btn--secondary" onClick={() => { setShowCoupleForm(false); setCoupleA(''); setCoupleB('') }}>
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}

              {couples.length > 0 && (
                <div className="av-couple-list">
                  {couples.map(([aId, bId]) => {
                    const a = players.find(p => p.id === aId)
                    const b = players.find(p => p.id === bId)
                    if (!a || !b) return null
                    return (
                      <div key={`${aId}-${bId}`} className="av-couple-chip">
                        <Heart size={12} fill="currentColor" />
                        {a.name} & {b.name}
                        <button onClick={() => removeCouple(aId)}><X size={10} /></button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Siblings section */}
          {players.length >= 2 && (
            <div className="av-couple-section">
              {!showSiblingForm ? (
                <button className="av-couple-add-btn av-sibling-add-btn" onClick={() => setShowSiblingForm(true)}>
                  <Users size={14} /> Marquer frère / sœur
                </button>
              ) : (
                <motion.div
                  className="av-couple-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <p className="av-couple-form-label">👫 Ils sont frère et sœur :</p>
                  <div className="av-couple-selects">
                    <select
                      className="input av-couple-select"
                      value={siblingA}
                      onChange={(e) => setSiblingA(e.target.value)}
                    >
                      <option value="">Joueur A</option>
                      {players.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <span className="av-couple-heart">👫</span>
                    <select
                      className="input av-couple-select"
                      value={siblingB}
                      onChange={(e) => setSiblingB(e.target.value)}
                    >
                      <option value="">Joueur B</option>
                      {players.filter(p => p.id !== siblingA).map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="av-couple-form-actions">
                    <button
                      className="btn btn-primary"
                      onClick={addSibling}
                      disabled={!siblingA || !siblingB || siblingA === siblingB}
                    >
                      Confirmer
                    </button>
                    <button className="btn btn--secondary" onClick={() => { setShowSiblingForm(false); setSiblingA(''); setSiblingB('') }}>
                      Annuler
                    </button>
                  </div>
                </motion.div>
              )}

              {siblings.length > 0 && (
                <div className="av-couple-list">
                  {siblings.map(([aId, bId]) => {
                    const a = players.find(p => p.id === aId)
                    const b = players.find(p => p.id === bId)
                    if (!a || !b) return null
                    return (
                      <div key={`sib-${aId}-${bId}`} className="av-couple-chip av-sibling-chip">
                        <Users size={12} />
                        {a.name} & {b.name}
                        <button onClick={() => removeSibling(aId)}><X size={10} /></button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info rule */}
        <div className="section av-rule-banner" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="av-rule-text">
            🚫 Pas plus de <strong>3 Vérités d'affilée</strong> — la 4e est forcément une Action !
          </p>
          {couples.length > 0 && (
            <p className="av-rule-text av-rule-text--couple">
              💑 Les actions tombent automatiquement sur le/la partenaire.
            </p>
          )}
          {siblings.length > 0 && (
            <p className="av-rule-text av-rule-text--sibling">
              👫 Les défis entre frères et sœurs seront évités automatiquement.
            </p>
          )}
        </div>

        {/* Import custom questions */}
        <div className="section import-section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="jnj-section-label">Questions personnalisées <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></p>
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Importez un fichier <strong>Excel</strong> ou <strong>JSON</strong> avec vos propres questions.
            Colonnes requises : <code>mode</code>, <code>type</code>, <code>text</code>
          </p>
          <div className="import-actions">
            <input ref={fileRef} type="file" accept=".json,.xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
            <button className="btn import-btn" onClick={() => fileRef.current.click()}>
              <Upload size={15} /> Importer un fichier
            </button>
            <button className="btn import-template-btn" onClick={downloadTemplate}>
              <FileDown size={15} /> Modèle Excel
            </button>
            <button className="btn import-template-btn" onClick={downloadJsonTemplate}>
              <FileDown size={15} /> Modèle JSON
            </button>
          </div>
          {importError && <p className="import-error">{importError}</p>}
          {customQuestions.length > 0 && (
            <div className="import-status">
              <span>✅ <strong>{customQuestions.length}</strong> questions importées</span>
              <button className="import-clear-btn" onClick={() => setCustomQuestions([])}>
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Start */}
        <div className="section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          {!canStart && (
            <p className="text-sm text-muted" style={{ textAlign: 'center', marginBottom: 10 }}>
              Ajoutez au moins 2 joueurs pour commencer.
            </p>
          )}
          <button className="btn btn-primary btn-block" onClick={handleStart} disabled={!canStart}>
            <Play size={18} /> Lancer la partie
          </button>
        </div>
      </motion.div>
    </div>
  )
}
