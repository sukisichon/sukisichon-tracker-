import { getSheets, SHEET_ID } from './sheets'

export default async function handler(req, res) {
  const { date, range } = req.query
  if (!date) return res.status(400).json({ error: 'date required' })

  const month = date.slice(0, 7)

  try {
    const sheets = getSheets()
    const [salesRes, expRes] = await Promise.all([
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Sales!A:E' }),
      sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: 'Expenses!A:E' }),
    ])

    const salesRows = (salesRes.data.values || []).slice(1)
    const expRows   = (expRes.data.values || []).slice(1)

    // Today's sales
    const todaySalesRow = salesRows.find(r => r[0] === date)
    const sales = todaySalesRow ? {
      storefront: todaySalesRow[1] || '',
      grab: todaySalesRow[2] || '',
      lineman: todaySalesRow[3] || '',
      total: todaySalesRow[4] || 0,
    } : null

    // Today's expenses with rowIndex for edit/delete
    const expenses = expRows
      .map((r, i) => ({ rowIndex: i, date: r[0], category: r[1], amount: Number(r[2]) || 0, note: r[3] || '', time: r[4] || '' }))
      .filter(r => r.date === date)

    // Monthly totals
    const monthSalesRows = salesRows.filter(r => r[0]?.startsWith(month))
    const monthExpRows   = expRows.filter(r => r[0]?.startsWith(month))
    const monthSales    = monthSalesRows.reduce((s, r) => s + (Number(r[4]) || 0), 0)
    const monthExpenses = monthExpRows.reduce((s, r) => s + (Number(r[2]) || 0), 0)

    // Last 7 days for chart
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date + 'T00:00:00+07:00')
      d.setDate(d.getDate() - i)
      const iso = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
      const label = d.toLocaleDateString('th-TH', { weekday: 'short', timeZone: 'Asia/Bangkok' })
      const daySales = salesRows.find(r => r[0] === iso)
      const dayExp = expRows.filter(r => r[0] === iso).reduce((s, r) => s + (Number(r[2]) || 0), 0)
      const s = Number(daySales?.[4] || 0)
      last7.push({ date: iso, label, sales: s, expenses: dayExp, profit: s - dayExp })
    }

    // Yesterday's data for insights
    const yest = new Date(date + 'T00:00:00+07:00')
    yest.setDate(yest.getDate() - 1)
    const yesterdayISO = yest.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' })
    const yesterdaySales = salesRows.find(r => r[0] === yesterdayISO)
    const yesterdayProfit = Number(yesterdaySales?.[4] || 0) -
      expRows.filter(r => r[0] === yesterdayISO).reduce((s, r) => s + (Number(r[2]) || 0), 0)

    // Month category totals for insights
    const catTotals = {}
    monthExpRows.forEach(r => {
      catTotals[r[1]] = (catTotals[r[1]] || 0) + (Number(r[2]) || 0)
    })
    const avgDailyExp = monthExpenses / (new Date(date).getDate())

    res.status(200).json({
      sales, expenses,
      month: { sales: monthSales, expenses: monthExpenses },
      chart: last7,
      insights: { yesterdayProfit, avgDailyExp, catTotals }
    })
  } catch (err) {
    console.error('Data API error:', err)
    res.status(500).json({ error: err.message })
  }
}
