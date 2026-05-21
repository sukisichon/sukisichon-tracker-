import { getSheets, SHEET_ID } from './sheets'

export default async function handler(req, res) {
  const sheets = getSheets()

  // POST: add new expense
  if (req.method === 'POST') {
    const { date, category, amount, note, time } = req.body
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Expenses!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[date, category, amount, note || '', time || '']] }
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // PUT: edit expense row
  if (req.method === 'PUT') {
    const { rowIndex, date, category, amount, note, time } = req.body
    try {
      const sheetRow = rowIndex + 2 // +1 header +1 for 1-based
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Expenses!A${sheetRow}:E${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[date, category, amount, note || '', time || '']] }
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  // DELETE: delete expense row
  if (req.method === 'DELETE') {
    const { rowIndex } = req.body
    try {
      // Get sheet id for Expenses
      const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID })
      const expSheet = meta.data.sheets.find(s => s.properties.title === 'Expenses')
      const sheetId = expSheet.properties.sheetId

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [{
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex + 1, // +1 for header
                endIndex: rowIndex + 2
              }
            }
          }]
        }
      })
      return res.status(200).json({ ok: true })
    } catch (err) {
      return res.status(500).json({ error: err.message })
    }
  }

  res.status(405).end()
}
