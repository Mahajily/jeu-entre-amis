import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, X, Play, Users, ShieldAlert, FileUp, Download, CheckCircle, AlertCircle, Tag, ChevronLeft } from 'lucide-react'
import { parseWordsFile, downloadExcelTemplate, downloadJSONTemplate } from '../utils/importWords'
import WORDS_BY_CATEGORY from '../data/wordsByCategory.json'
import { CATEGORIES, ALL_CATEGORY_IDS } from '../data/categories.js'

const anim = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.25 },
}

export default function SetupScreen({ onStart, savedPlayers = [], onBack }) {
  const [players, setPlayers] = useState([])
  const [name, setName] = useState('')
  const [nbUndercover, setNbUndercover] = useState(1)
  const [selectedCategories, setSelectedCategories] = useState(new Set(ALL_CATEGORY_IDS))
  const [customWords, setCustomWords] = useState([])
  const [importStatus, setImportStatus] = useState(null) // null | 'loading' | { count, errors }
  const fileInputRef = useRef(null)

  // ── Back to home button (rendered above the glass card via a portal-like wrapper)
  // We render it as the first element inside the returned JSX below.

  // Categories visibles = built-in + 'custom' si import
  const visibleCategories = [
    ...CATEGORIES,
    ...(customWords.length > 0
      ? [{ id: 'custom', label: 'Mots importés', emoji: '📂', color: '#b2bec3' }]
      : []),
  ]

  function toggleCategory(id) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        // Garder au moins 1 catégorie active
        if (next.size <= 1) return prev
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function selectAll() {
    const ids = visibleCategories.map(c => c.id)
    setSelectedCategories(new Set(ids))
  }

  function selectNone() {
    // Garde uniquement la première catégorie (au minimum 1)
    setSelectedCategories(new Set([visibleCategories[0].id]))
  }

  /** Construit le pool de mots à partir des catégories sélectionnées */
  function buildWordPool() {
    let pool = []
    selectedCategories.forEach(id => {
      if (id === 'custom') pool = [...pool, ...customWords]
      else pool = [...pool, ...(WORDS_BY_CATEGORY[id] || [])]
    })
    return pool
  }

  // Restore players from previous game (reset alive status)
  useEffect(() => {
    if (savedPlayers.length > 0) {
      setPlayers(savedPlayers.map(p => ({ ...p, alive: true })))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function addPlayer(e) {
    e?.preventDefault()
    const n = name.trim()
    if (!n) return
    if (players.some(p => p.name.toLowerCase() === n.toLowerCase())) return
    setPlayers(prev => [...prev, { id: crypto.randomUUID(), name: n, alive: true }])
    setName('')
  }

  function removePlayer(id) {
    setPlayers(prev => prev.filter(p => p.id !== id))
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportStatus('loading')
    const { pairs, errors } = await parseWordsFile(file)
    setCustomWords(pairs)
    if (pairs.length > 0) {
      // Ajouter automatiquement la catégorie 'custom'
      setSelectedCategories(prev => new Set([...prev, 'custom']))
    }
    setImportStatus({ count: pairs.length, errors })
    e.target.value = ''
  }

  function clearImport() {
    setCustomWords([])
    setImportStatus(null)
    setSelectedCategories(prev => {
      const next = new Set(prev)
      next.delete('custom')
      return next.size > 0 ? next : new Set(ALL_CATEGORY_IDS)
    })
  }

  function handleStart() {
    if (players.length < 4) return
    onStart({ players, nbUndercover, wordPool: buildWordPool() })
  }

  return (
    <>
      {onBack && (
        <button className="back-btn" onClick={onBack}>
          <ChevronLeft size={18} /> Accueil
        </button>
      )}
      <motion.div className="glass" {...anim}>
      {/* Add players */}
      <div className="section">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} />
          <span style={{ fontWeight: 700 }}>Joueurs ({players.length})</span>
        </div>

        <form onSubmit={addPlayer} className="flex gap-2">
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Entrer un nom..."
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            <UserPlus size={18} />
          </button>
        </form>

        <div className="flex-col gap-2 mt-3">
          <AnimatePresence mode="popLayout">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                className="player-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                layout
              >
                <div className="flex items-center">
                  <span className="number">{i + 1}</span>
                  <span className="name">{p.name}</span>
                </div>
                <button className="remove-btn" onClick={() => removePlayer(p.id)}>
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Settings — Nombre d'Undercover */}
      <div className="section">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert size={18} />
          <span style={{ fontWeight: 700 }}>Réglages</span>
        </div>

        <div className="undercover-selector">
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
            Nombre d'imposteurs
          </p>
          <div className="flex gap-2">
            {[1, 2, 3].map(n => (
              <button
                key={n}
                className={`btn-count ${nbUndercover === n ? 'active' : ''}`}
                onClick={() => setNbUndercover(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {players.length > 0 && players.length < 4 && (
          <p className="text-sm mt-2" style={{ color: 'var(--warning)' }}>
            Il faut au moins 4 joueurs pour commencer
          </p>
        )}
      </div>

      {/* Thèmes de mots */}
      <div className="section">
        <div className="flex items-center gap-2 mb-2">
          <Tag size={18} />
          <span style={{ fontWeight: 700 }}>Thèmes de mots</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {selectedCategories.size}/{visibleCategories.length} sélectionné{selectedCategories.size > 1 ? 's' : ''}
          </span>
        </div>

        {/* Chips catégories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {visibleCategories.map(cat => {
            const active = selectedCategories.has(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 12px',
                  borderRadius: 20,
                  border: `2px solid ${active ? cat.color : 'var(--glass-border)'}`,
                  background: active ? `${cat.color}22` : 'transparent',
                  color: active ? cat.color : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: active ? 700 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tout / Aucun */}
        <div className="flex gap-2">
          <button
            className="btn"
            style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'var(--glass-border)', color: 'var(--text-secondary)' }}
            onClick={selectAll}
          >
            Tout sélectionner
          </button>
          <button
            className="btn"
            style={{ fontSize: '0.78rem', padding: '4px 10px', background: 'var(--glass-border)', color: 'var(--text-secondary)' }}
            onClick={selectNone}
          >
            Tout désélectionner
          </button>
        </div>
      </div>

      {/* Import de mots personnalisés */}
      <div className="section">
        <div className="flex items-center gap-2 mb-2">
          <FileUp size={18} />
          <span style={{ fontWeight: 700 }}>Mots personnalisés</span>
        </div>

        <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: 10 }}>
          Importez vos propres paires via <strong>.json</strong>, <strong>.xlsx</strong> ou <strong>.csv</strong>.
          Les mots importés apparaissent comme thème <strong>📂 Mots importés</strong> ci-dessus.
        </p>

        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={16} />
            Importer un fichier
          </button>
          <button
            className="btn"
            style={{ background: 'var(--glass-border)', color: 'var(--text-primary)' }}
            onClick={downloadExcelTemplate}
            title="Télécharger le modèle Excel"
          >
            <Download size={16} />
            Modèle Excel
          </button>
          <button
            className="btn"
            style={{ background: 'var(--glass-border)', color: 'var(--text-primary)' }}
            onClick={downloadJSONTemplate}
            title="Télécharger le modèle JSON"
          >
            <Download size={16} />
            Modèle JSON
          </button>
          {customWords.length > 0 && (
            <button className="remove-btn" onClick={clearImport} title="Supprimer l'import">
              <X size={16} />
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {importStatus === 'loading' && (
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>Chargement…</p>
        )}

        {importStatus && importStatus !== 'loading' && (
          <div className="mt-2">
            {importStatus.count > 0 && (
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--success)' }}>
                <CheckCircle size={14} />
                {importStatus.count} paire{importStatus.count > 1 ? 's' : ''} importée{importStatus.count > 1 ? 's' : ''} avec succès
              </div>
            )}
            {importStatus.errors.length > 0 && (
              <div className="mt-1">
                {importStatus.errors.slice(0, 3).map((err, i) => (
                  <div key={i} className="flex items-center gap-1 text-sm" style={{ color: 'var(--warning)' }}>
                    <AlertCircle size={14} />
                    {err}
                  </div>
                ))}
                {importStatus.errors.length > 3 && (
                  <p className="text-sm" style={{ color: 'var(--warning)' }}>
                    …et {importStatus.errors.length - 3} autre(s) erreur(s).
                  </p>
                )}
              </div>
            )}
            {importStatus.count === 0 && (
              <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--danger, #e74c3c)' }}>
                <AlertCircle size={14} />
                Aucune paire valide trouvée.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Start */}
      <div className="section">
        <button
          className="btn btn-success btn-block"
          onClick={handleStart}
          disabled={players.length < 4}
        >
          <Play size={18} />
          Lancer la partie
        </button>
      </div>
    </motion.div>
    </>
  )
}
