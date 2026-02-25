import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, UserPlus, X, Play, Upload, FileDown, Trash2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { MODE_META } from '../data/statements'

export default function SetupScreen({ onStart, onBack }) {
  const [selectedModes, setSelectedModes] = useState(new Set(['soft']))
  const [players, setPlayers] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [customStatements, setCustomStatements] = useState([])
  const [importError, setImportError] = useState('')
  const fileRef = useRef(null)

  const toggleMode = (id) => {
    setSelectedModes((prev) => {
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

  const addPlayer = (e) => {
    e.preventDefault()
    const name = nameInput.trim()
    if (!name) return
    setPlayers((prev) => [...prev, { id: Date.now(), name }])
    setNameInput('')
  }

  const removePlayer = (id) => setPlayers((prev) => prev.filter((p) => p.id !== id))

  /* ── Import ── */
  function parseStatementsData(data) {
    if (Array.isArray(data)) {
      return data
        .filter((r) => r.mode && r.text)
        .map((r) => ({ mode: String(r.mode).toLowerCase(), text: String(r.text) }))
    }
    const result = []
    for (const [mode, texts] of Object.entries(data)) {
      if (Array.isArray(texts)) texts.forEach((t) => result.push({ mode, text: String(t) }))
    }
    return result
  }

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImportError('')
    try {
      if (file.name.endsWith('.json')) {
        const parsed = parseStatementsData(JSON.parse(await file.text()))
        setCustomStatements(parsed)
      } else {
        const wb = XLSX.read(await file.arrayBuffer())
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        setCustomStatements(
          rows.filter((r) => r.mode && r.text)
              .map((r) => ({ mode: String(r.mode).toLowerCase(), text: String(r.text) }))
        )
      }
    } catch {
      setImportError('Fichier invalide. Vérifiez le format.')
    }
    e.target.value = ''
  }

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['mode', 'text'],
      ['soft', 'Je n’ai jamais mangé du chocolat seul(e) en me cachant'],
      ['hot', 'Je n’ai jamais embrassé quelqu’un dans cette pièce'],
      ['superhot', 'Je n’ai jamais envoyé un message très compromettant'],
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Statements')
    XLSX.writeFile(wb, 'template_je_nai_jamais.xlsx')
  }

  const downloadJsonTemplate = () => {
    const template = {
      soft: [
        "Je n'ai jamais mangé du chocolat seul(e) en me cachant",
        "Je n'ai jamais chanté sous la douche"
      ],
      hot: [
        "Je n'ai jamais embrassé quelqu'un dans cette pièce",
        "Je n'ai jamais eu le béguin pour un(e) ami(e)"
      ],
      superhot: [
        "Je n'ai jamais envoyé un message très compromettant",
        "Je n'ai jamais eu une attirance pour quelqu'un d'interdit"
      ]
    }
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'template_je_nai_jamais.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const handleStart = () => {
    onStart({
      modes: Array.from(selectedModes),
      players,
      customStatements,
    })
  }

  return (
    <div className="jnj-setup-screen">
      <button className="back-btn" onClick={onBack}>
        <ChevronLeft size={18} /> Accueil
      </button>

      <motion.div
        className="glass jnj-setup-card"
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        {/* Header */}
        <div className="jnj-setup-header">
          <span className="jnj-setup-emoji">🍻</span>
          <h1 className="jnj-setup-title">Je n'ai jamais</h1>
          <p className="jnj-setup-subtitle">Révèle tes secrets… ou bois !</p>
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
                  style={{
                    '--mc': meta.color,
                    '--mc-light': meta.colorLight,
                    '--mc-border': meta.colorBorder,
                  }}
                  onClick={() => toggleMode(id)}
                >
                  <span className="jnj-mode-emoji">{meta.emoji}</span>
                  <span className="jnj-mode-label">{meta.label}</span>
                  <span className="jnj-mode-desc">{meta.description}</span>
                  {active && (
                    <span className="jnj-mode-check">✓</span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="jnj-mode-hint">
            {selectedModes.size > 1
              ? `${selectedModes.size} modes mélangés — ${[...selectedModes].map(m => MODE_META[m].label).join(' + ')}`
              : `Mode ${MODE_META[[...selectedModes][0]].label} sélectionné`}
          </p>
        </div>

        {/* Players (optional) */}
        <div className="section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="jnj-section-label">
            Joueurs <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span>
          </p>
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Ajoutez les noms pour savoir qui doit boire 🍺
          </p>

          <form onSubmit={addPlayer} className="flex gap-2" style={{ marginBottom: 12 }}>
            <input
              className="input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nom du joueur..."
            />
            <button type="submit" className="btn btn-primary" disabled={!nameInput.trim()}>
              <UserPlus size={16} />
            </button>
          </form>

          {players.length > 0 && (
            <div className="flex-col gap-2">
              {players.map((p, i) => (
                <div key={p.id} className="player-item">
                  <div className="flex items-center">
                    <div className="number">{i + 1}</div>
                    <span className="name">{p.name}</span>
                  </div>
                  <button className="remove-btn" onClick={() => removePlayer(p.id)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Import custom statements */}
        <div className="section import-section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <p className="jnj-section-label">Statements personnalisés <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optionnel)</span></p>
          <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
            Importez un fichier <strong>Excel</strong> ou <strong>JSON</strong>.
            Colonnes requises : <code>mode</code>, <code>text</code>
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
          {customStatements.length > 0 && (
            <div className="import-status">
              <span>✅ <strong>{customStatements.length}</strong> statements importés</span>
              <button className="import-clear-btn" onClick={() => setCustomStatements([])}>
                <Trash2 size={13} /> Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Start */}
        <div className="section" style={{ borderTop: '1px solid var(--glass-border)' }}>
          <button className="btn btn-primary btn-block" onClick={handleStart}>
            <Play size={18} /> Lancer la partie
          </button>
        </div>
      </motion.div>
    </div>
  )
}
