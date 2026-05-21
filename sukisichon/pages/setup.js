import Head from 'next/head'
import Link from 'next/link'

export default function Setup() {
  return (
    <>
      <Head>
        <title>ตั้งค่า — สุกี้สิชล Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen" style={{ background: '#F0F4FF', maxWidth: 480, margin: '0 auto' }}>
        <div className="px-5 py-8">
          <Link href="/" className="text-blue-500 text-sm font-semibold mb-6 block">← กลับหน้าหลัก</Link>

          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">ตั้งค่า Google Sheets</h1>
          <p className="text-gray-500 text-sm mb-6">ทำครั้งเดียวจบ ใช้ได้ตลอด</p>

          <div className="space-y-4">

            <Step n="1" title="สร้าง Google Sheet">
              <p>สร้าง Google Spreadsheet ใหม่ แล้วสร้าง 2 sheets:</p>
              <div className="mt-2 space-y-2">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-bold text-sm mb-1">Sheet: <code className="text-blue-600">Sales</code></p>
                  <p className="text-xs text-gray-500">Header row: <code>Date | Storefront | Grab | Lineman | TotalSales</code></p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="font-bold text-sm mb-1">Sheet: <code className="text-blue-600">Expenses</code></p>
                  <p className="text-xs text-gray-500">Header row: <code>Date | Category | Amount | Note | Time</code></p>
                </div>
              </div>
            </Step>

            <Step n="2" title="สร้าง Service Account">
              <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-4">
                <li>ไปที่ <a href="https://console.cloud.google.com" target="_blank" className="text-blue-500 underline">Google Cloud Console</a></li>
                <li>สร้าง Project ใหม่</li>
                <li>เปิด API: <b>Google Sheets API</b></li>
                <li>IAM & Admin → Service Accounts → Create</li>
                <li>Download JSON key file</li>
              </ol>
            </Step>

            <Step n="3" title="Share Sheet ให้ Service Account">
              <p className="text-sm text-gray-600">
                เปิด Google Sheet → Share → ใส่ email ของ Service Account (<code className="text-xs bg-gray-100 px-1 rounded">xxx@xxx.iam.gserviceaccount.com</code>) → Editor
              </p>
            </Step>

            <Step n="4" title="ตั้งค่า Vercel Environment Variables">
              <p className="text-sm text-gray-600 mb-2">ใน Vercel Project Settings → Environment Variables:</p>
              <div className="space-y-1.5 text-xs font-mono">
                {[
                  ['GOOGLE_SHEET_ID', 'ID ใน URL ของ Sheet'],
                  ['GOOGLE_SERVICE_ACCOUNT_EMAIL', 'email จาก JSON key'],
                  ['GOOGLE_PRIVATE_KEY', 'private_key จาก JSON key (ทั้งหมด)'],
                ].map(([k, v]) => (
                  <div key={k} className="bg-gray-800 text-green-300 rounded-lg p-2.5">
                    <span className="text-yellow-300">{k}</span>
                    <span className="text-gray-400"> = </span>
                    <span className="text-gray-300 text-[11px]">{v}</span>
                  </div>
                ))}
              </div>
            </Step>

            <Step n="5" title="Deploy บน Vercel">
              <div className="space-y-1.5 text-sm text-gray-600">
                <p>1. <code className="text-xs bg-gray-100 px-1 rounded">git push</code> โค้ดขึ้น GitHub</p>
                <p>2. ไปที่ <a href="https://vercel.com" target="_blank" className="text-blue-500 underline">vercel.com</a> → Import Project</p>
                <p>3. เชื่อม GitHub repo</p>
                <p>4. ใส่ Environment Variables จากขั้นตอนที่ 4</p>
                <p>5. Deploy! ✓</p>
              </div>
            </Step>

          </div>

          <div className="mt-6 bg-blue-600 rounded-2xl p-5 text-white">
            <p className="font-bold mb-1">💡 หมายเหตุ</p>
            <p className="text-sm text-blue-100">
              GOOGLE_PRIVATE_KEY ให้ copy ค่า <code>"private_key"</code> จาก JSON file ทั้งหมด รวมถึง <code>\n</code> ด้วย
              ไม่ต้องแก้ไขอะไร Vercel จะจัดการให้เอง
            </p>
          </div>

          <Link href="/" className="mt-6 block w-full py-4 rounded-2xl font-bold text-white text-center"
            style={{ background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </>
  )
}

function Step({ n, title, children }) {
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
        <div className="flex-1">
          <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
          <div className="text-sm text-gray-600">{children}</div>
        </div>
      </div>
    </div>
  )
}
