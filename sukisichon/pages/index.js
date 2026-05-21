import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ── helpers ──
function fmt(n) { return (!n && n !== 0) ? '—' : Number(n).toLocaleString('th-TH') }
function todayISO() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }) }
function todayTH() { return new Date().toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Bangkok' }) }
function nowTime() { return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' }) }
function monthLabel() { return new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }) }

const EXPENSE_CATS = [
  { key: 'ยิงแอด', icon: '📣', color: '#EEF2FF' },
  { key: 'ของสด',  icon: '🥩', color: '#FFF7ED' },
  { key: 'ผัก',    icon: '🥬', color: '#F0FDF4' },
  { key: 'ของใช้ร้าน', icon: '🧹', color: '#FDF4FF' },
  { key: 'น้ำแข็ง', icon: '🧊', color: '#EFF6FF' },
  { key: 'เครื่องดื่ม', icon: '🥤', color: '#FFF1F2' },
  { key: 'ค่าเดินทาง', icon: '🛵', color: '#FFFBEB' },
  { key: 'อื่นๆ', icon: '✏️', color: '#F1F5F9', custom: true },
]
function getIcon(cat) { return EXPENSE_CATS.find(c => c.key === cat)?.icon || '💸' }

// ── Expense Modal (add / edit) ──
function ExpenseModal({ cat, editData, onClose, onSave, saving }) {
  const [amount, setAmount]     = useState(editData?.amount || '')
  const [note, setNote]         = useState(editData?.note || '')
  const [customCat, setCustomCat] = useState(editData?.category || '')
  const isEdit = !!editData
  const isCatCustom = isEdit ? !EXPENSE_CATS.find(c => c.key === editData.category && !c.custom) : cat?.custom

  function handleSave() {
    if (!amount || Number(amount) <= 0) return
    if (isCatCustom && !customCat.trim()) return
    onSave({ category: isCatCustom ? customCat.trim() : (isEdit ? editData.category : cat.key), amount: Number(amount), note, rowIndex: editData?.rowIndex, date: editData?.date })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up" style={{ maxWidth: 480, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{isEdit ? getIcon(editData.category) : cat?.icon}</span>
          <div>
            <p className="text-xs text-gray-400 font-medium">{isEdit ? 'แก้ไขรายการ' : 'บันทึกค่าใช้จ่าย'}</p>
            <h3 className="text-lg font-bold text-gray-800">{isEdit ? editData.category : (cat?.custom ? 'อื่นๆ (ระบุเอง)' : cat?.key)}</h3>
          </div>
        </div>
        {isCatCustom && (
          <>
            <label className="block text-sm font-semibold text-gray-500 mb-2">หมวดหมู่</label>
            <input type="text" placeholder="เช่น ค่าแก๊ส, ค่าซ่อม..." value={customCat} onChange={e => setCustomCat(e.target.value)} autoFocus className="w-full text-base text-gray-700 bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-blue-500 mb-4 transition-colors" />
          </>
        )}
        <label className="block text-sm font-semibold text-gray-500 mb-2">จำนวนเงิน (บาท)</label>
        <input type="number" inputMode="decimal" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} autoFocus={!isCatCustom} className="w-full text-4xl font-bold text-gray-800 bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-blue-500 mb-4 transition-colors" />
        <label className="block text-sm font-semibold text-gray-500 mb-2">หมายเหตุ (ไม่บังคับ)</label>
        <input type="text" placeholder="รายละเอียด..." value={note} onChange={e => setNote(e.target.value)} className="w-full text-base text-gray-700 bg-gray-50 rounded-2xl px-5 py-4 outline-none border-2 border-transparent focus:border-blue-500 mb-6 transition-colors" />
        <button onClick={handleSave} disabled={saving || !amount || (isCatCustom && !customCat.trim())} className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all disabled:opacity-50" style={{ background: saving ? '#93c5fd' : 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
          {saving ? 'กำลังบันทึก…' : (isEdit ? '✓ บันทึกการแก้ไข' : '✓ บันทึก')}
        </button>
      </div>
    </div>
  )
}

// ── Confirm Delete Modal ──
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={onCancel}>
      <div className="bg-white rounded-3xl p-6 w-full animate-slide-up" style={{ maxWidth: 360 }} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <span className="text-4xl">🗑️</span>
          <h3 className="font-bold text-gray-800 text-lg mt-2">ลบรายการนี้ใช่ไหม?</h3>
          <p className="text-gray-400 text-sm mt-1">ข้อมูลจะถูกลบออกจาก Google Sheets</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-semibold text-gray-600 bg-gray-100">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500">Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── Insight Cards ──
function InsightCards({ insights, expenses, sales }) {
  if (!insights) return null
  const cards = []
  const totalSales = (Number(sales?.storefront)||0) + (Number(sales?.grab)||0) + (Number(sales?.lineman)||0)
  const totalExp = expenses.reduce((s,e) => s + Number(e.amount||0), 0)
  const profit = totalSales - totalExp

  if (sales?.grab > sales?.storefront && sales?.grab > sales?.lineman)
    cards.push({ icon: '🟢', text: 'Grab ขายดีที่สุดวันนี้', color: '#F0FDF4' })
  if (sales?.storefront > sales?.grab && sales?.storefront > sales?.lineman)
    cards.push({ icon: '🏠', text: 'หน้าร้านขายดีที่สุดวันนี้', color: '#EFF6FF' })
  if (insights.avgDailyExp > 0 && totalExp > insights.avgDailyExp * 1.2)
    cards.push({ icon: '⚠️', text: 'ค่าใช้จ่ายสูงกว่าค่าเฉลี่ย', color: '#FFF7ED' })
  if (insights.catTotals?.['ยิงแอด'] > 0)
    cards.push({ icon: '📣', text: `ยิงแอดเดือนนี้ ฿${fmt(insights.catTotals['ยิงแอด'])}`, color: '#EEF2FF' })
  if (profit > 0 && profit > insights.yesterdayProfit)
    cards.push({ icon: '📈', text: 'วันนี้กำไรดีกว่าเมื่อวาน!', color: '#F0FDF4' })
  if (profit < insights.yesterdayProfit && insights.yesterdayProfit > 0)
    cards.push({ icon: '📉', text: 'กำไรลดลงจากเมื่อวาน', color: '#FFF1F2' })
  if (totalSales === 0)
    cards.push({ icon: '☀️', text: 'เริ่มกรอกยอดขายวันนี้ได้เลย!', color: '#EFF6FF' })

  if (cards.length === 0) return null

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex gap-3 pb-2" style={{ width: 'max-content' }}>
        {cards.map((c, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-3 rounded-2xl shrink-0" style={{ background: c.color, minWidth: 180 }}>
            <span className="text-lg">{c.icon}</span>
            <span className="text-xs font-semibold text-gray-700">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Mini Chart ──
function MiniChart({ data }) {
  if (!data || data.length === 0) return null
  const hasSales = data.some(d => d.sales > 0)
  if (!hasSales) return null
  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-800 text-base mb-4">ยอดขาย 7 วัน</h2>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v/1000}k` : v} />
          <Tooltip formatter={(v, n) => [`฿${fmt(v)}`, n === 'sales' ? 'ยอดขาย' : n === 'expenses' ? 'ค่าใช้จ่าย' : 'กำไร']} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <Line type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} strokeDasharray="4 2" />
          <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-center">
        {[['#2563EB','ยอดขาย'],['#f87171','ค่าใช้จ่าย'],['#22c55e','กำไร']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded" style={{ background: c }} />
            <span className="text-[10px] text-gray-400">{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Calendar Card ──
function CalendarCard({ month, data }) {
  const [year, mon] = month.split('-').map(Number)
  const firstDay = new Date(year, mon - 1, 1).getDay()
  const daysInMonth = new Date(year, mon, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function getColor(d) {
    if (!d) return ''
    const iso = `${year}-${String(mon).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    const day = data?.find(x => x.date === iso)
    if (!day) return '#F8FAFF'
    const profit = Number(day.totalSales||0) - (day.expenses?.reduce((s,e)=>s+Number(e.amount||0),0)||0)
    if (profit > 1000) return '#bbf7d0'
    if (profit > 0) return '#fef9c3'
    if (profit < 0) return '#fecaca'
    return '#F8FAFF'
  }

  return (
    <div className="card p-5">
      <h2 className="font-bold text-gray-800 text-base mb-3">ปฏิทิน {new Date(year, mon-1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</h2>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => (
          <div key={i} className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium text-gray-700" style={{ background: getColor(d) }}>
            {d || ''}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-3 justify-center">
        {[['#bbf7d0','กำไรดี'],['#fef9c3','พอดี'],['#fecaca','ขาดทุน']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ background: c }} /><span className="text-[10px] text-gray-400">{l}</span></div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ──
export default function Home() {
  const [storefront, setStorefront] = useState('')
  const [grab, setGrab]             = useState('')
  const [lineman, setLineman]       = useState('')
  const [savingSales, setSavingSales] = useState(false)
  const [salesSaved, setSalesSaved]   = useState(false)
  const [modal, setModal]     = useState(null)  // { type: 'add', cat } or { type: 'edit', data } or { type: 'delete', data }
  const [savingExp, setSavingExp] = useState(false)
  const [expenses, setExpenses]   = useState([])
  const [monthData, setMonthData] = useState({ sales: 0, expenses: 0 })
  const [chartData, setChartData] = useState([])
  const [insights, setInsights]   = useState(null)
  const [salesData, setSalesData] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [dateFilter, setDateFilter]   = useState('today')
  const [loading, setLoading]         = useState(true)

  const totalSales  = (Number(storefront)||0) + (Number(grab)||0) + (Number(lineman)||0)
  const totalExpDay = expenses.reduce((s,e) => s + Number(e.amount||0), 0)
  const profit      = totalSales - totalExpDay
  const currentMonth = todayISO().slice(0, 7)

  const loadData = useCallback(async () => {
    try {
      const [dataRes, histRes] = await Promise.all([
        fetch('/api/data?date=' + todayISO()),
        fetch('/api/history?month=' + currentMonth),
      ])
      const json    = await dataRes.json()
      const histJson = await histRes.json()

      if (json.expenses) setExpenses(json.expenses)
      if (json.sales) {
        setSalesData(json.sales)
        setStorefront(json.sales.storefront || '')
        setGrab(json.sales.grab || '')
        setLineman(json.sales.lineman || '')
        if (json.sales.storefront || json.sales.grab || json.sales.lineman) setSalesSaved(true)
      }
      if (json.month)   setMonthData(json.month)
      if (json.chart)   setChartData(json.chart)
      if (json.insights) setInsights(json.insights)
      if (histJson.days) setHistoryData(histJson.days)
    } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function saveSales() {
    if (savingSales) return
    setSavingSales(true)
    try {
      await fetch('/api/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: todayISO(), storefront: Number(storefront)||0, grab: Number(grab)||0, lineman: Number(lineman)||0, total: totalSales })
      })
      setSalesSaved(true)
      loadData()
    } catch (_) {}
    setSavingSales(false)
  }

  async function saveExpense({ category, amount, note, rowIndex, date }) {
    setSavingExp(true)
    try {
      if (rowIndex !== undefined && rowIndex >= 0) {
        // Edit
        await fetch('/api/expense', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rowIndex, date: date || todayISO(), category, amount, note, time: nowTime() })
        })
      } else {
        // Add new
        await fetch('/api/expense', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: todayISO(), category, amount, note, time: nowTime() })
        })
      }
      setModal(null)
      loadData()
    } catch (_) {}
    setSavingExp(false)
  }

  async function deleteExpense(rowIndex) {
    try {
      await fetch('/api/expense', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex })
      })
      setModal(null)
      loadData()
    } catch (_) {}
  }

  // Filter expenses for display
  const displayExpenses = (() => {
    if (dateFilter === 'today') return expenses
    if (dateFilter === '7days') {
      const all = []
      historyData.forEach(d => all.push(...(d.expenses||[]).map(e => ({ ...e, date: d.date }))))
      return all
    }
    const all = []
    historyData.forEach(d => all.push(...(d.expenses||[]).map(e => ({ ...e, date: d.date }))))
    return all
  })()

  const displaySales = (() => {
    if (dateFilter === 'today') return { sales: totalSales, expenses: totalExpDay, profit }
    if (dateFilter === '7days') {
      const last7 = chartData
      const s = last7.reduce((a,d)=>a+d.sales,0)
      const e = last7.reduce((a,d)=>a+d.expenses,0)
      return { sales: s, expenses: e, profit: s-e }
    }
    return { sales: monthData.sales, expenses: monthData.expenses, profit: monthData.sales - monthData.expenses }
  })()

  return (
    <>
      <Head>
        <title>สุกี้สิชล — Daily Tracker</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {/* Modals */}
      {modal?.type === 'add' && <ExpenseModal cat={modal.cat} onClose={() => setModal(null)} onSave={saveExpense} saving={savingExp} />}
      {modal?.type === 'edit' && <ExpenseModal editData={modal.data} onClose={() => setModal(null)} onSave={saveExpense} saving={savingExp} />}
      {modal?.type === 'delete' && <ConfirmModal onCancel={() => setModal(null)} onConfirm={() => deleteExpense(modal.data.rowIndex)} />}

      <div className="min-h-screen" style={{ background: '#F0F4FF', maxWidth: 480, margin: '0 auto' }}>
        {/* Header */}
        <div className="safe-top px-5 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">{todayTH()}</p>
              <h1 className="text-xl font-extrabold text-gray-900 leading-tight">สวัสดี Panachai 👋</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/history" className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-sm">
                <span className="text-sm">📋</span>
                <span className="text-xs font-semibold text-blue-600">ประวัติ</span>
              </Link>
              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 pulse" />
                <span className="text-xs font-semibold text-gray-500">สุกี้สิชล</span>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-4 pb-12">

          {/* Date Filter */}
          <div className="flex gap-2 pt-1">
            {[['today','วันนี้'],['7days','7 วัน'],['month','เดือนนี้']].map(([v,l]) => (
              <button key={v} onClick={() => setDateFilter(v)}
                className={`flex-1 py-2 rounded-2xl text-xs font-bold transition-all ${dateFilter===v ? 'text-white shadow-md' : 'bg-white text-gray-500'}`}
                style={dateFilter===v ? { background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' } : {}}>
                {l}
              </button>
            ))}
          </div>

          {/* Insights */}
          {!loading && <InsightCards insights={insights} expenses={expenses} sales={salesData} />}

          {/* Profit Card */}
          <div className="card-blue p-5 text-white">
            <p className="text-blue-200 text-xs font-medium mb-0.5">
              {dateFilter === 'today' ? 'กำไรวันนี้' : dateFilter === '7days' ? 'กำไร 7 วัน' : 'กำไรเดือนนี้'}
            </p>
            <p className="text-4xl font-extrabold tracking-tight font-mono">฿{fmt(displaySales.profit)}</p>
            <div className="flex gap-4 mt-3 pt-3 border-t border-blue-400/30">
              <div><p className="text-blue-200 text-xs">ยอดขาย</p><p className="font-bold text-sm">฿{fmt(displaySales.sales)}</p></div>
              <div className="w-px bg-blue-400/30" />
              <div><p className="text-blue-200 text-xs">ค่าใช้จ่าย</p><p className="font-bold text-sm">฿{fmt(displaySales.expenses)}</p></div>
            </div>
          </div>

          {/* Sales Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-base">ยอดขายวันนี้</h2>
              {salesSaved && <span className="text-xs bg-green-50 text-green-600 font-semibold px-2.5 py-1 rounded-full">✓ บันทึกแล้ว</span>}
            </div>
            <div className="space-y-3 mb-4">
              {[{label:'หน้าร้าน',val:storefront,set:setStorefront,icon:'🏠'},{label:'Grab',val:grab,set:setGrab,icon:'🟢'},{label:'LINE MAN',val:lineman,set:setLineman,icon:'🟡'}].map(({label,val,set,icon}) => (
                <div key={label} className="flex items-center gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                  <span className="text-xl w-7 text-center">{icon}</span>
                  <span className="text-sm font-semibold text-gray-500 w-20 shrink-0">{label}</span>
                  <input type="number" inputMode="decimal" placeholder="0" value={val} onChange={e => { set(e.target.value); setSalesSaved(false) }} className="flex-1 text-right text-xl font-bold text-gray-800 bg-transparent outline-none placeholder:text-gray-300" />
                  <span className="text-gray-400 text-sm">฿</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between bg-blue-50 rounded-2xl px-4 py-3 mb-4">
              <span className="text-sm font-bold text-blue-700">ยอดขายรวม</span>
              <span className="text-2xl font-extrabold text-blue-700 font-mono">฿{fmt(totalSales)}</span>
            </div>
            <button onClick={saveSales} disabled={savingSales||totalSales===0} className="w-full py-3.5 rounded-2xl font-bold text-white text-base transition-all disabled:opacity-40" style={{ background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
              {savingSales ? 'กำลังบันทึก…' : '💾 บันทึกยอดขาย'}
            </button>
          </div>

          {/* Chart */}
          <MiniChart data={chartData} />

          {/* Expense Grid */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 text-base mb-4">เพิ่มค่าใช้จ่าย</h2>
            <div className="grid grid-cols-4 gap-2.5">
              {EXPENSE_CATS.map(cat => (
                <button key={cat.key} onClick={() => setModal({ type: 'add', cat })} className="expense-btn flex flex-col items-center justify-center gap-1 rounded-2xl py-3 px-1" style={{ background: cat.color }}>
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[11px] font-semibold text-gray-600 text-center leading-tight">{cat.key}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          {displayExpenses.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-800 text-base">รายการ{dateFilter==='today'?'วันนี้':dateFilter==='7days'?'7 วัน':'เดือนนี้'}</h2>
                <Link href="/history" className="text-xs text-blue-500 font-semibold">ดูทั้งหมด →</Link>
              </div>
              <div className="space-y-1">
                {[...displayExpenses].reverse().slice(0, 10).map((exp, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 group">
                    <span className="text-xl w-8 text-center">{getIcon(exp.category)}</span>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setModal({ type: 'edit', data: exp })}>
                      <p className="font-semibold text-gray-700 text-sm">{exp.category}</p>
                      {exp.note && <p className="text-xs text-gray-400 truncate">{exp.note}</p>}
                      {exp.date && exp.date !== todayISO() && <p className="text-xs text-blue-400">{exp.date}</p>}
                    </div>
                    <div className="text-right shrink-0" onClick={() => setModal({ type: 'edit', data: exp })}>
                      <p className="font-bold text-gray-800 text-sm font-mono">-฿{fmt(exp.amount)}</p>
                      {exp.time && <p className="text-xs text-gray-400">{exp.time}</p>}
                    </div>
                    <button onClick={() => setModal({ type: 'delete', data: exp })} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-400 transition-colors shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <CalendarCard month={currentMonth} data={historyData} />

          {/* Monthly Summary */}
          <div className="card p-5">
            <h2 className="font-bold text-gray-800 text-base mb-1">สรุปเดือน</h2>
            <p className="text-xs text-gray-400 mb-4">{monthLabel()}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-[11px] font-medium text-blue-500 mb-1">ยอดขาย</p>
                <p className="font-extrabold text-blue-700 text-sm font-mono">{fmt(monthData.sales)}</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-3 text-center">
                <p className="text-[11px] font-medium text-red-400 mb-1">ค่าใช้จ่าย</p>
                <p className="font-extrabold text-red-600 text-sm font-mono">{fmt(monthData.expenses)}</p>
              </div>
              <div className={`rounded-2xl p-3 text-center ${(monthData.sales-monthData.expenses)>=0?'bg-green-50':'bg-orange-50'}`}>
                <p className={`text-[11px] font-medium mb-1 ${(monthData.sales-monthData.expenses)>=0?'text-green-500':'text-orange-400'}`}>กำไร</p>
                <p className={`font-extrabold text-sm font-mono ${(monthData.sales-monthData.expenses)>=0?'text-green-700':'text-orange-600'}`}>{fmt(monthData.sales-monthData.expenses)}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
