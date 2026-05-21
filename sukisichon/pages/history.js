import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

function fmt(n) { return (!n && n !== 0) ? '—' : Number(n).toLocaleString('th-TH') }
function toThaiDate(iso) {
  if (!iso) return ''
  return new Date(iso + 'T00:00:00+07:00').toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function thisMonthISO() {
  const now = new Date()
  return `${now.toLocaleString('en-CA',{year:'numeric',timeZone:'Asia/Bangkok'})}-${now.toLocaleString('en-CA',{month:'2-digit',timeZone:'Asia/Bangkok'})}`
}
const EXPENSE_CATS = [
  {key:'ยิงแอด',icon:'📣'},{key:'ของสด',icon:'🥩'},{key:'ผัก',icon:'🥬'},
  {key:'ของใช้ร้าน',icon:'🧹'},{key:'น้ำแข็ง',icon:'🧊'},{key:'เครื่องดื่ม',icon:'🥤'},{key:'ค่าเดินทาง',icon:'🛵'},
]
function getIcon(cat) { return EXPENSE_CATS.find(c => c.key === cat)?.icon || '💸' }

function ExpenseEditModal({ data, onClose, onSave, onDelete, saving }) {
  const [amount, setAmount] = useState(data.amount || '')
  const [note, setNote]     = useState(data.note || '')
  const [category, setCat]  = useState(data.category || '')
  const [showDel, setShowDel] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-white rounded-t-3xl p-6 pb-10 animate-slide-up" style={{ maxWidth: 480, margin: '0 auto' }} onClick={e => e.stopPropagation()}>
        {showDel ? (
          <>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="text-center mb-5">
              <span className="text-4xl">🗑️</span>
              <h3 className="font-bold text-gray-800 text-lg mt-2">ลบรายการนี้ใช่ไหม?</h3>
              <p className="text-gray-400 text-sm mt-1">ข้อมูลจะถูกลบออกจาก Google Sheets</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDel(false)} className="flex-1 py-3 rounded-2xl font-semibold text-gray-600 bg-gray-100">Cancel</button>
              <button onClick={() => onDelete(data.rowIndex)} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500">Delete</button>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getIcon(data.category)}</span>
                <div>
                  <p className="text-xs text-gray-400">แก้ไขรายการ · {toThaiDate(data.date)}</p>
                  <h3 className="text-lg font-bold text-gray-800">{data.category}</h3>
                </div>
              </div>
              <button onClick={() => setShowDel(true)} className="w-9 h-9 flex items-center justify-center text-red-400 bg-red-50 rounded-full">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
              </button>
            </div>
            <label className="block text-sm font-semibold text-gray-500 mb-2">หมวดหมู่</label>
            <input value={category} onChange={e => setCat(e.target.value)} className="w-full text-base text-gray-700 bg-gray-50 rounded-2xl px-5 py-3 outline-none border-2 border-transparent focus:border-blue-500 mb-4 transition-colors" />
            <label className="block text-sm font-semibold text-gray-500 mb-2">จำนวนเงิน (บาท)</label>
            <input type="number" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-3xl font-bold text-gray-800 bg-gray-50 rounded-2xl px-5 py-3 outline-none border-2 border-transparent focus:border-blue-500 mb-4 transition-colors" />
            <label className="block text-sm font-semibold text-gray-500 mb-2">หมายเหตุ</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="w-full text-base text-gray-700 bg-gray-50 rounded-2xl px-5 py-3 outline-none border-2 border-transparent focus:border-blue-500 mb-6 transition-colors" />
            <button onClick={() => onSave({ ...data, category, amount: Number(amount), note })} disabled={saving} className="w-full py-4 rounded-2xl font-bold text-white text-base disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#2563EB,#1d4ed8)' }}>
              {saving ? 'กำลังบันทึก…' : '✓ บันทึกการแก้ไข'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function History() {
  const [month, setMonth]       = useState(thisMonthISO())
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [saving, setSaving]       = useState(false)

  const loadData = async (m) => {
    setLoading(true)
    try {
      const res = await fetch('/api/history?month=' + (m || month))
      const json = await res.json()
      setData(json.days || [])
    } catch (_) {}
    setLoading(false)
  }

  useEffect(() => { loadData() }, [month])

  function prevMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
    setSelected(null)
  }
  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`)
    setSelected(null)
  }

  async function handleSave(expData) {
    setSaving(true)
    try {
      await fetch('/api/expense', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex: expData.rowIndex, date: expData.date, category: expData.category, amount: expData.amount, note: expData.note, time: expData.time || '' })
      })
      setEditModal(null)
      setSelected(null)
      await loadData()
    } catch (_) {}
    setSaving(false)
  }

  async function handleDelete(rowIndex) {
    try {
      await fetch('/api/expense', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowIndex })
      })
      setEditModal(null)
      setSelected(null)
      await loadData()
    } catch (_) {}
  }

  const monthTH  = new Date(month + '-01T00:00:00+07:00').toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
  const totalSales = data.reduce((s, d) => s + (Number(d.totalSales)||0), 0)
  const totalExp   = data.reduce((s, d) => s + (d.expenses?.reduce((a,e) => a+Number(e.amount||0), 0)||0), 0)
  const selectedDay = data.find(d => d.date === selected)

  return (
    <>
      <Head>
        <title>ประวัติ — สุกี้สิชล</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {editModal && <ExpenseEditModal data={editModal} onClose={() => setEditModal(null)} onSave={handleSave} onDelete={handleDelete} saving={saving} />}

      {/* Day Detail Modal */}
      {selected && selectedDay && !editModal && (
        <div className="fixed inset-0 z-40 flex items-end bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full bg-white rounded-t-3xl p-5 pb-10 animate-slide-up overflow-y-auto" style={{ maxWidth:480, margin:'0 auto', maxHeight:'80vh' }} onClick={e=>e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <h3 className="font-bold text-gray-800 text-base mb-4">{toThaiDate(selected)}</h3>
            <div className="bg-blue-50 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-blue-500 mb-2">ยอดขาย</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{l:'หน้าร้าน 🏠',v:selectedDay.storefront},{l:'Grab 🟢',v:selectedDay.grab},{l:'LINE MAN 🟡',v:selectedDay.lineman}].map(item=>(
                  <div key={item.l}><p className="text-[10px] text-blue-400">{item.l}</p><p className="font-bold text-blue-700 text-sm">฿{fmt(item.v||0)}</p></div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between">
                <span className="text-sm font-bold text-blue-700">รวม</span>
                <span className="font-extrabold text-blue-700">฿{fmt(selectedDay.totalSales)}</span>
              </div>
            </div>
            {selectedDay.expenses?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">ค่าใช้จ่าย</p>
                <div className="space-y-1">
                  {selectedDay.expenses.map((exp, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-lg w-7 text-center">{getIcon(exp.category)}</span>
                      <div className="flex-1 cursor-pointer" onClick={() => setEditModal({ ...exp, date: selected })}>
                        <p className="text-sm font-semibold text-gray-700">{exp.category}</p>
                        {exp.note && <p className="text-xs text-gray-400">{exp.note}</p>}
                      </div>
                      <div className="text-right cursor-pointer" onClick={() => setEditModal({ ...exp, date: selected })}>
                        <p className="font-bold text-sm text-gray-800">-฿{fmt(exp.amount)}</p>
                        {exp.time && <p className="text-xs text-gray-400">{exp.time}</p>}
                      </div>
                      <button onClick={() => setEditModal({ ...exp, date: selected })} className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-blue-400 transition-colors">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
                  <span className="text-sm font-bold text-gray-600">รวมค่าใช้จ่าย</span>
                  <span className="font-extrabold text-red-600">-฿{fmt(selectedDay.expenses.reduce((s,e)=>s+Number(e.amount||0),0))}</span>
                </div>
              </div>
            )}
            <div className={`mt-4 rounded-2xl p-4 text-center ${(Number(selectedDay.totalSales||0)-(selectedDay.expenses?.reduce((s,e)=>s+Number(e.amount||0),0)||0))>=0?'bg-green-50':'bg-red-50'}`}>
              <p className="text-xs text-gray-500 mb-1">กำไร</p>
              <p className={`text-2xl font-extrabold ${(Number(selectedDay.totalSales||0)-(selectedDay.expenses?.reduce((s,e)=>s+Number(e.amount||0),0)||0))>=0?'text-green-700':'text-red-600'}`}>
                ฿{fmt(Number(selectedDay.totalSales||0)-(selectedDay.expenses?.reduce((s,e)=>s+Number(e.amount||0),0)||0))}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen" style={{ background: '#F0F4FF', maxWidth: 480, margin: '0 auto' }}>
        <div className="safe-top px-5 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-blue-600 font-bold text-lg">←</Link>
            <h1 className="text-xl font-extrabold text-gray-900">ประวัติย้อนหลัง</h1>
          </div>
        </div>

        <div className="px-4 space-y-4 pb-10">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 font-bold">‹</button>
              <span className="font-bold text-gray-800">{monthTH}</span>
              <button onClick={nextMonth} className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-600 font-bold">›</button>
            </div>
          </div>

          <div className="card-blue p-5 text-white">
            <p className="text-blue-200 text-xs mb-3">สรุปเดือน {monthTH}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><p className="text-blue-200 text-xs">ยอดขาย</p><p className="font-extrabold text-sm mt-1">฿{fmt(totalSales)}</p></div>
              <div className="border-x border-blue-400/30"><p className="text-blue-200 text-xs">ค่าใช้จ่าย</p><p className="font-extrabold text-sm mt-1">฿{fmt(totalExp)}</p></div>
              <div><p className="text-blue-200 text-xs">กำไร</p><p className="font-extrabold text-sm mt-1">฿{fmt(totalSales-totalExp)}</p></div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-bold text-gray-800 text-base mb-3">รายวัน <span className="text-xs text-gray-400 font-normal ml-1">กดเพื่อดูรายละเอียด</span></h2>
            {loading ? (
              <p className="text-center text-gray-400 py-8">กำลังโหลด…</p>
            ) : data.length === 0 ? (
              <p className="text-center text-gray-400 py-8">ยังไม่มีข้อมูลเดือนนี้</p>
            ) : (
              <div className="space-y-2">
                {[...data].sort((a,b)=>b.date.localeCompare(a.date)).map(day => {
                  const dayExp = day.expenses?.reduce((s,e)=>s+Number(e.amount||0),0)||0
                  const dayProfit = Number(day.totalSales||0) - dayExp
                  return (
                    <button key={day.date} onClick={() => setSelected(day.date)} className="w-full flex items-center gap-3 py-3 px-3 bg-gray-50 rounded-2xl hover:bg-blue-50 transition-colors text-left">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-700 text-sm">{toThaiDate(day.date)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">ขาย ฿{fmt(day.totalSales||0)} · จ่าย ฿{fmt(dayExp)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-extrabold text-sm ${dayProfit>=0?'text-green-600':'text-red-500'}`}>{dayProfit>=0?'+':''}฿{fmt(dayProfit)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{day.expenses?.length||0} รายการ</p>
                      </div>
                      <span className="text-gray-300 text-lg">›</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
