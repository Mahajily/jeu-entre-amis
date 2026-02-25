import * as XLSX from 'xlsx'

/**
 * Validate and normalize a raw pair object.
 * Returns the pair or null if required fields are missing.
 */
function normalizePair(raw) {
  const civil = String(raw.civil ?? raw.Civil ?? '').trim()
  const undercover = String(raw.undercover ?? raw.Undercover ?? '').trim()
  const civilHint = String(raw.civilHint ?? raw['Civil Hint'] ?? raw.civil_hint ?? '').trim() || null
  const undercoverHint =
    String(raw.undercoverHint ?? raw['Undercover Hint'] ?? raw.undercover_hint ?? '').trim() || null

  if (!civil || !undercover) return null
  return { civil, undercover, civilHint, undercoverHint }
}

/**
 * Parse a JSON file (File object) → { pairs, errors }
 */
export async function parseJSONFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result)
        if (!Array.isArray(raw)) {
          return resolve({ pairs: [], errors: ['Le fichier JSON doit contenir un tableau.'] })
        }
        const pairs = []
        const errors = []
        raw.forEach((item, i) => {
          const pair = normalizePair(item)
          if (pair) pairs.push(pair)
          else errors.push(`Ligne ${i + 1} ignorée : "civil" et "undercover" requis.`)
        })
        resolve({ pairs, errors })
      } catch (err) {
        resolve({ pairs: [], errors: [`JSON invalide : ${err.message}`] })
      }
    }
    reader.readAsText(file, 'UTF-8')
  })
}

/**
 * Parse an Excel file (.xlsx / .xls / .csv) → { pairs, errors }
 * Expected columns (case-insensitive): civil, undercover, civilHint, undercoverHint
 */
export async function parseExcelFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

        if (rows.length === 0) {
          return resolve({ pairs: [], errors: ['Le fichier Excel est vide ou sans en-têtes.'] })
        }

        const pairs = []
        const errors = []
        rows.forEach((row, i) => {
          const pair = normalizePair(row)
          if (pair) pairs.push(pair)
          else errors.push(`Ligne ${i + 2} ignorée : colonnes "civil" et "undercover" requises.`)
        })
        resolve({ pairs, errors })
      } catch (err) {
        resolve({ pairs: [], errors: [`Erreur lecture Excel : ${err.message}`] })
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Dispatch to the right parser based on file extension.
 */
export async function parseWordsFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'json') return parseJSONFile(file)
  if (['xlsx', 'xls', 'csv'].includes(ext)) return parseExcelFile(file)
  return { pairs: [], errors: [`Format non supporté : .${ext} (accepté : .json, .xlsx, .xls, .csv)`] }
}

/**
 * Generate a downloadable Excel template so users know the expected format.
 * Uses Blob + URL.createObjectURL (works in all browsers / PWA).
 */
const TEMPLATE_PAIRS = [
  { civil: 'Café',         undercover: 'Thé',           civilHint: 'Boisson chaude à base de grains torréfiés',          undercoverHint: 'Boisson chaude infusée à partir de feuilles' },
  { civil: 'Chien',        undercover: 'Loup',          civilHint: 'Animal domestique fidèle à l\'homme',                  undercoverHint: 'Canidé sauvage vivant en meute' },
  { civil: 'Pizza',        undercover: 'Tarte flambée', civilHint: 'Spécialité italienne avec tomate et mozzarella',       undercoverHint: 'Spécialité alsacienne avec crème et lardons' },
  { civil: 'Football',     undercover: 'Rugby',         civilHint: 'Sport où l\'on frappe un ballon rond avec les pieds',  undercoverHint: 'Sport où l\'on porte un ballon ovale à la main' },
  { civil: 'Sushi',        undercover: 'Maki',          civilHint: 'Bouchée de riz vinaigré garnie de poisson cru',        undercoverHint: 'Rouleau de riz et poisson enveloppé dans une algue' },
]

export function downloadExcelTemplate() {
  const data = TEMPLATE_PAIRS
  const ws = XLSX.utils.json_to_sheet(data)
  // Largeur des colonnes
  ws['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 45 }, { wch: 45 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Mots')
  // Écriture en ArrayBuffer puis téléchargement via Blob
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modele_mots_undercover.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Generate a downloadable JSON template so users know the expected format.
 */
export function downloadJSONTemplate() {
  const json = JSON.stringify(TEMPLATE_PAIRS, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'modele_mots_undercover.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
