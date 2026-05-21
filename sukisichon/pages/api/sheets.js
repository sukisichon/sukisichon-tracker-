import { google } from 'googleapis'

// Build auth from env
export function getSheetAuth() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return auth
}

export function getSheets() {
  const auth = getSheetAuth()
  return google.sheets({ version: 'v4', auth })
}

export const SHEET_ID = process.env.GOOGLE_SHEET_ID
