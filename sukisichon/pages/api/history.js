import { getSheets, SHEET_ID } from './sheets'

export default async function handler(req, res) {
  const { month } = req.query
  if (!month) return res.status(400).json({ error: 'month required' })

  try {
    const sheets = getSheets()
    const [salesRes, expRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Sales!A:E' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Expenses!A:E' }),
    ])

    const salesRows = (salesRes.data.values || []).slice(1)
    const expRows   = (expRes.data.values || []).slice(1)

    const monthSales = salesRows.filter(r => r[0]?.startsWith(month))
    const monthExp   = expRows.filter(r => r[0]?.startsWith(month))

    const daysMap = {}
    monthSales.forEach(r => {
      const date = r[0]
      if (!daysMap[date]) daysMap[date] = { date, storefront: 0, grab: 0, lineman: 0, totalSales: 0, expenses: [] }
      daysMap[date].storefront = Number(r[1]) || 0
      daysMap[date].grab       = Number(r[2]) || 0
      daysMap[date].lineman    = Number(r[3]) || 0
      daysMap[date].totalSales = Number(r[4]) || 0
    })

    // Include rowIndex for edit/delete
    monthExp.forEach((r, i) => {
      const date = r[0]
      if (!daysMap[date]) daysMap[date] = { date, storefront: 0, grab: 0, lineman: 0, totalSales: 0, expenses: [] }
      // Find actual rowIndex in full expRows array
      const fullIdx = expRows.findIndex((er, idx) => er[0] === r[0] && er[1] === r[1] && er[2] === r[2] && er[4] === r[4] && !daysMap[date].expenses.find(e => e.rowIndex === idx))
      daysMap[date].expenses.push({
        rowIndex: fullIdx,
        category: r[1] || '', amount: Number(r[2]) || 0, note: r[3] || '', time: r[4] || ''
      })
    })

    const days = Object.values(daysMap).sort((a, b) => a.date.localeCompare(b.date))
    res.status(200).json({ days })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
