import { getSheets, SHEET_ID } from './sheets'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { date, storefront, grab, lineman, total } = req.body

  try {
    const sheets = getSheets()

    // Check if row for today already exists — if so, update it
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Sales!A:E',
    })

    const rows = existing.data.values || []
    const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === date)

    if (rowIndex > 0) {
      // Update existing row (rowIndex is 0-based in array, but sheet is 1-based + 1 header)
      const sheetRow = rowIndex + 1
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `Sales!A${sheetRow}:E${sheetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[date, storefront, grab, lineman, total]]
        }
      })
    } else {
      // Append new row
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'Sales!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[date, storefront, grab, lineman, total]]
        }
      })
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Sales API error:', err)
    res.status(500).json({ error: err.message })
  }
}
