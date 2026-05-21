# สุกี้สิชล Daily Tracker 🍲

แอปบันทึกยอดขายและค่าใช้จ่ายรายวัน สำหรับร้านสุกี้สิชล  
Mobile-first · Minimal UI · บันทึกลง Google Sheets อัตโนมัติ

## Features

- 📊 บันทึกยอดขาย: หน้าร้าน / Grab / LINE MAN
- 💰 คำนวณกำไรทันที
- 🛒 เพิ่มค่าใช้จ่าย 7 หมวด (แตะ → กรอก → บันทึก)
- 📅 สรุปรายเดือน
- 💾 ข้อมูลบันทึกลง Google Sheets
- 📱 PWA - Add to Home Screen ได้

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/your-username/sukisichon-tracker
cd sukisichon-tracker
npm install
```

### 2. ตั้งค่า Google Sheets API
```bash
cp .env.local.example .env.local
# แก้ไข .env.local ใส่ค่าจริง (ดูขั้นตอนใน /setup)
```

### 3. Run Dev
```bash
npm run dev
# เปิด http://localhost:3000
```

### 4. Deploy บน Vercel
1. Push ขึ้น GitHub
2. Import ใน [vercel.com](https://vercel.com)
3. ใส่ Environment Variables ทั้ง 3 ตัว
4. Deploy!

## Google Sheets Structure

**Sheet: Sales**
| Date | Storefront | Grab | Lineman | TotalSales |

**Sheet: Expenses**
| Date | Category | Amount | Note | Time |

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_SHEET_ID` | ID ใน URL ของ Google Sheet |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email ของ Service Account |
| `GOOGLE_PRIVATE_KEY` | Private Key จาก JSON file |

## Tech Stack

- **Next.js 14** - Framework
- **Tailwind CSS** - Styling
- **Google Sheets API v4** - Database
- **Vercel** - Deploy (ฟรี)
