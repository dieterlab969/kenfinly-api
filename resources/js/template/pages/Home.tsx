import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Logo from '../assets/images/setting/logo.png'
import { Link, useNavigate } from 'react-router-dom'
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import Setting from '../components/Setting.tsx'
import api from '../../utils/api'
import { formatCurrency, getCategoryIcon } from '../../constants/categories'
import EditTransactionModal from '../../components/EditTransactionModal'
import { processImageForUpload, validateImageFile, formatFileSize } from '../../utils/imageCompression'

type ApiAmount = string | number | null | undefined
type TransactionType = 'income' | 'expense'

interface UserProfile { id?: number; name?: string; email?: string }

interface DashboardAccount {
  id: number
  name: string
  balance: ApiAmount
  currency?: string
  icon?: string | null
  color?: string | null
}

interface DashboardCategory {
  id: number
  name: string
  slug?: string | null
  icon?: string | null
  color?: string | null
  type?: TransactionType
  children?: DashboardCategory[]
}

interface DashboardSummaryPeriod {
  month?: string
  income?: ApiAmount
  expense?: ApiAmount
  net?: ApiAmount
}

interface SevenDayExpenseRow { date: string; total: ApiAmount }
interface BalanceHistoryPoint { date: string; balance: ApiAmount }

interface DashboardTransaction {
  id: number
  account_id?: number
  category_id?: number
  type: TransactionType
  ledger_type?: string
  amount: ApiAmount
  amount_minor?: ApiAmount
  currency?: string
  transaction_date?: string | null
  created_at?: string | null
  category?: DashboardCategory | null
  account?: DashboardAccount | null
}

interface DashboardData {
  monthly_summary?: {
    current?: DashboardSummaryPeriod
    previous?: DashboardSummaryPeriod
  }
  seven_day_expenses?: SevenDayExpenseRow[]
  balance_history?: BalanceHistoryPoint[]
  recent_transactions?: DashboardTransaction[]
  accounts?: DashboardAccount[]
}

interface SpendingDay { label: string; date: string; amount: number; isSpike?: boolean }
interface CategoryOption extends DashboardCategory { children?: CategoryOption[] }

interface ApiError {
  response?: {
    data?: {
      message?: string
      errors?: Record<string, string[]>
    }
  }
  message?: string
}

function toNumber(value: ApiAmount): number {
  const parsed = typeof value === 'number' ? value : Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeVnd(value: number): string {
  return formatCurrency(value, 'VND').replace(/\u00a0/g, ' ').replace(/\s?₫$/, 'đ')
}

function fmtVND(value: number): string {
  return normalizeVnd(value)
}

function fmtSignedVND(value: number): string {
  if (value === 0) return fmtVND(0)
  return `${value > 0 ? '+' : '-'}${fmtVND(Math.abs(value))}`
}

function fmtCompactVND(value: number): string {
  const sign = value < 0 ? '-' : value > 0 ? '+' : ''
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Bđ`
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Mđ`
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Kđ`
  return `${sign}${abs.toLocaleString('vi-VN')}đ`
}

function getStoredUser(): UserProfile | null {
  try {
    const rawUser = localStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) as UserProfile : null
  } catch {
    return null
  }
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiError = error as ApiError
  const validationMessage = apiError.response?.data?.errors
    ? Object.values(apiError.response.data.errors).flat()[0]
    : undefined
  return apiError.response?.data?.message || validationMessage || apiError.message || fallback
}

const MONTHS_VI: Record<string, string> = {
  January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
  July: '07', August: '08', September: '09', October: '10', November: '11', December: '12',
}

function formatMonthLabel(month?: string): string {
  if (!month) return 'Không rõ tháng'
  const [name, year] = month.split(' ')
  return MONTHS_VI[name] && year ? `Tháng ${MONTHS_VI[name]}, ${year}` : month
}

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00`)
}

function todayDateKey(): string {
  return toDateKey(new Date())
}

function weekdayVi(date: Date): string {
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
}

function formatShortDate(dateKey?: string | null): string {
  if (!dateKey) return ''
  const date = parseDateKey(dateKey)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function formatMonthShort(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return `T${String(date.getMonth() + 1).padStart(2, '0')} ${date.getFullYear()}`
}

function buildSevenDayExpenses(rows: SevenDayExpenseRow[] = []): SpendingDay[] {
  const totalsByDate = new Map(rows.map(row => [row.date, toNumber(row.total)]))
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    const key = toDateKey(date)
    return { label: weekdayVi(date), date: key, amount: totalsByDate.get(key) ?? 0 }
  })
  const maxAmount = Math.max(...days.map(day => day.amount), 0)
  return days.map(day => ({ ...day, isSpike: maxAmount > 0 && day.amount === maxAmount }))
}

function flattenCategories(categories: CategoryOption[] = []): CategoryOption[] {
  return categories.flatMap(category => [category, ...flattenCategories(category.children ?? [])])
}

function buildMonthSummary(summary?: DashboardSummaryPeriod) {
  const income = toNumber(summary?.income)
  const expense = toNumber(summary?.expense)
  const net = summary?.net !== undefined && summary?.net !== null ? toNumber(summary.net) : income - expense
  const flowTotal = income + expense
  return {
    sub: formatMonthLabel(summary?.month),
    expensePct: flowTotal > 0 ? (expense / flowTotal) * 100 : 0,
    incomePct: flowTotal > 0 ? (income / flowTotal) * 100 : 0,
    isEmpty: flowTotal === 0,
    income: fmtVND(income),
    expense: expense > 0 ? fmtSignedVND(-expense) : fmtVND(0),
    total: fmtSignedVND(net),
    incomeColor: income > 0 ? '#22c55e' : '#9ca3af',
    expenseColor: expense > 0 ? '#ef4444' : '#9ca3af',
    totalColor: net < 0 ? '#ef4444' : net > 0 ? '#22c55e' : '#9ca3af',
  }
}

function getTransactionDateLabel(transaction: DashboardTransaction): string {
  const dateKey = transaction.transaction_date || transaction.created_at?.slice(0, 10)
  return dateKey ? formatShortDate(dateKey) : 'Không rõ ngày'
}

function getTransactionSignedAmount(transaction: DashboardTransaction): number {
  const amount = toNumber(transaction.amount)
  return transaction.type === 'income' ? amount : -amount
}

interface HalfDonutProps { expensePct: number; incomePct: number; isEmpty?: boolean; size?: number }

const HalfDonut: React.FC<HalfDonutProps> = ({ expensePct, incomePct, isEmpty, size = 110 }) => {
  const r = 36, cx = 50, cy = 50
  const expAngleRad = (expensePct / 100) * Math.PI
  const boundAngle = Math.PI - expAngleRad
  const bx = cx + r * Math.cos(boundAngle)
  const by = cy - r * Math.sin(boundAngle)
  const expLargeArc = expensePct > 100 ? 1 : 0

  if (isEmpty) {
    return (
      <svg width={size} height={Math.round(size * 0.56)} viewBox="0 0 100 56" aria-hidden>
        <path d="M 14 50 A 36 36 0 0 1 86 50" fill="none" stroke="#374151" strokeWidth="11" strokeLinecap="butt" />
        <text x="50" y="38" fontSize="7" textAnchor="middle" fill="#6b7280" fontWeight="600">KHÔNG CÓ</text>
        <text x="50" y="47" fontSize="7" textAnchor="middle" fill="#6b7280">DỮ LIỆU</text>
      </svg>
    )
  }

  return (
    <svg width={size} height={Math.round(size * 0.56)} viewBox="0 0 100 56" aria-hidden>
      <path d="M 14 50 A 36 36 0 0 1 86 50" fill="none" stroke="#1e1b4b" strokeWidth="11" strokeLinecap="butt" />
      <path
        d={`M 14 50 A 36 36 0 ${expLargeArc} 1 ${bx.toFixed(2)} ${by.toFixed(2)}`}
        fill="none" stroke="#ef4444" strokeWidth="11" strokeLinecap="butt"
      />
      {incomePct > 0 && (
        <path
          d={`M ${bx.toFixed(2)} ${by.toFixed(2)} A 36 36 0 0 1 86 50`}
          fill="none" stroke="#22c55e" strokeWidth="11" strokeLinecap="butt"
        />
      )}
    </svg>
  )
}

const SpendingChart: React.FC<{ data: SpendingDay[] }> = ({ data }) => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null)
  const maxAmount = Math.max(...data.map(day => day.amount), 0)
  const maxVal = maxAmount > 0 ? Math.ceil(maxAmount / 1_000_000) * 1_000_000 : 1_000_000
  const chartH = 88, chartB = 108, chartL = 30, barW = 18, colW = 240 / 7
  const tickValues = Array.from({ length: 5 }, (_, index) => (maxVal / 4) * index)

  return (
    <svg
      viewBox="0 0 278 130"
      style={{ width: '100%', overflow: 'visible' }}
      role="img"
      aria-label="Chi tiêu 7 ngày qua"
      onMouseLeave={() => setHoveredBar(null)}
    >
      <defs>
        <style>{`
          @keyframes scTtFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
          .sc-tooltip { animation: scTtFade 0.18s ease forwards; }
          .sc-crosshair { animation: scTtFade 0.12s ease forwards; }
        `}</style>
      </defs>

      {/* Grid lines */}
      {tickValues.map((value, i) => {
        const y = chartB - (value / maxVal) * chartH
        return (
          <g key={i}>
            <line x1={chartL - 4} y1={y} x2={272} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={chartL - 6} y={y + 3} fontSize="7.5" textAnchor="end" fill="#9ca3af">{fmtCompactVND(value)}</text>
          </g>
        )
      })}

      {/* Vertical crosshair */}
      {hoveredBar !== null && (
        <line
          className="sc-crosshair"
          x1={chartL + hoveredBar * colW + colW / 2}
          y1={18}
          x2={chartL + hoveredBar * colW + colW / 2}
          y2={chartB}
          stroke="#7B51F1"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.45"
        />
      )}

      {/* Bars + hit areas */}
      {data.map((d, i) => {
        const barH = d.amount > 0 ? Math.max((d.amount / maxVal) * chartH, 3) : 0
        const cx = chartL + i * colW + colW / 2
        const barX = cx - barW / 2
        const barY = chartB - barH
        const isHot = hoveredBar === i
        const tipW = 68
        const tipX = Math.max(chartL + tipW / 2, Math.min(cx, 272 - tipW / 2))

        return (
          <g
            key={i}
            onMouseEnter={() => setHoveredBar(i)}
            onClick={() => setHoveredBar(isHot ? null : i)}
            style={{ cursor: 'pointer' }}
          >
            {/* Invisible wider hit zone */}
            <rect x={barX - 8} y={18} width={barW + 16} height={chartB - 18} fill="transparent" />

            {/* Bar */}
            <rect
              x={barX} y={barY} width={barW} height={Math.max(barH, 0.5)} rx="4" ry="4"
              fill={d.isSpike ? '#ef4444' : '#7B51F1'}
              fillOpacity={isHot ? 1 : (d.isSpike ? 0.85 : 0.6)}
              style={{ transition: 'fill-opacity 0.15s ease' }}
            />

            {/* Dot on top of bar */}
            {barH > 3 && (
              <circle
                cx={cx} cy={barY} r="2.5"
                fill={isHot ? '#fff' : 'transparent'}
                stroke={d.isSpike ? '#ef4444' : '#7B51F1'}
                strokeWidth="1.5"
                style={{ transition: 'fill 0.15s ease' }}
              />
            )}

            {/* X-axis label */}
            <text
              x={cx} y={chartB + 13} fontSize="7.5" textAnchor="middle"
              fill={isHot ? '#7B51F1' : '#6b7280'}
              fontWeight={isHot ? 'bold' : 'normal'}
              style={{ transition: 'fill 0.15s ease' }}
            >
              {d.label}
            </text>

            {/* Tooltip — hover only */}
            {isHot && d.amount > 0 && (
              <g className="sc-tooltip">
                <rect x={tipX - tipW / 2} y={barY - 42} width={tipW} height={32} rx="6" fill="#1f2937" />
                <text x={tipX} y={barY - 28} fontSize="7" textAnchor="middle" fill="#d1d5db">
                  {formatShortDate(d.date)}
                </text>
                <text x={tipX} y={barY - 15} fontSize="7.5" textAnchor="middle" fill="#fbbf24" fontWeight="bold">
                  {fmtVND(d.amount)}
                </text>
                <polygon
                  points={`${cx - 4},${barY - 10} ${cx + 4},${barY - 10} ${cx},${barY - 4}`}
                  fill="#1f2937"
                />
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

const HistoricalChart: React.FC<{ data: BalanceHistoryPoint[] }> = ({ data }) => {
  const [hoveredPt, setHoveredPt] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length === 0) {
    return (
      <svg viewBox="0 0 275 130" style={{ width: '100%' }} role="img" aria-label="Số dư lịch sử">
        <text x="137" y="66" fontSize="10" textAnchor="middle" fill="#9ca3af">Chưa có dữ liệu số dư</text>
      </svg>
    )
  }

  const chartTop = 18, chartBottom = 104, chartLeft = 22, chartRight = 252
  const values = data.map(point => toNumber(point.balance))
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue
  const yFor = (value: number) => range === 0
    ? chartTop + (chartBottom - chartTop) / 2
    : chartBottom - ((value - minValue) / range) * (chartBottom - chartTop)
  const pts = data.map((point, index) => ({
    x: data.length === 1 ? (chartLeft + chartRight) / 2 : chartLeft + (index / (data.length - 1)) * (chartRight - chartLeft),
    y: yFor(toNumber(point.balance)),
    value: toNumber(point.balance),
    date: point.date,
  }))
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ')
  const ticks = range === 0
    ? [maxValue]
    : Array.from({ length: 4 }, (_, index) => minValue + (range / 3) * index).reverse()

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || pts.length === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = ((e.clientX - rect.left) / rect.width) * 275
    let minDist = Infinity, nearest = 0
    pts.forEach((p, i) => {
      const d = Math.abs(p.x - mouseX)
      if (d < minDist) { minDist = d; nearest = i }
    })
    setHoveredPt(nearest)
  }

  const hovered = hoveredPt !== null ? pts[hoveredPt] : null
  const tipW = 82
  const tipX = hovered ? Math.max(chartLeft + tipW / 2, Math.min(hovered.x, chartRight - tipW / 2)) : 0
  const tipAbove = hovered ? hovered.y - chartTop > 50 : true
  const tipY = hovered ? (tipAbove ? hovered.y - 56 : hovered.y + 14) : 0

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 275 130"
      style={{ width: '100%', overflow: 'visible', cursor: 'crosshair' }}
      role="img"
      aria-label="Số dư lịch sử"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredPt(null)}
      onClick={handleMouseMove}
    >
      <defs>
        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B51F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7B51F1" stopOpacity="0.02" />
        </linearGradient>
        <style>{`
          @keyframes hcTtFade { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: translateY(0); } }
          .hc-tooltip { animation: hcTtFade 0.18s ease forwards; }
          .hc-crosshair { animation: hcTtFade 0.12s ease forwards; }
        `}</style>
      </defs>

      {/* Grid lines */}
      {ticks.map((value, i) => (
        <g key={i}>
          <line x1="20" y1={yFor(value)} x2="268" y2={yFor(value)} stroke="#e5e7eb" strokeWidth="0.4" strokeDasharray="3 3" />
          <text x="17" y={yFor(value) + 3} fontSize="6" textAnchor="end" fill="#9ca3af">{fmtCompactVND(value)}</text>
        </g>
      ))}

      {/* Area fill */}
      <polygon points={`22,104 ${poly} 252,104`} fill="url(#histGrad)" />

      {/* Line */}
      <polyline points={poly} fill="none" stroke="#7B51F1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Vertical crosshair */}
      {hovered && (
        <line
          className="hc-crosshair"
          x1={hovered.x} y1={chartTop}
          x2={hovered.x} y2={chartBottom}
          stroke="#7B51F1" strokeWidth="1" strokeDasharray="4 3" opacity="0.45"
        />
      )}

      {/* Data point dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5"
          fill={hoveredPt === i ? '#7B51F1' : '#fff'}
          stroke="#7B51F1" strokeWidth="1.5"
          style={{ transition: 'fill 0.15s ease' }}
        />
      ))}

      {/* X-axis date labels */}
      {pts.filter((_, i) => i === 0 || i === pts.length - 1 || i % 2 === 0).map((item, i) => (
        <text key={i} x={item.x} y={118} fontSize="6.5" textAnchor="middle"
          fill={pts.indexOf(item) === hoveredPt ? '#7B51F1' : '#9ca3af'}
          fontWeight={pts.indexOf(item) === hoveredPt ? 'bold' : 'normal'}
          style={{ transition: 'fill 0.15s ease' }}>
          {formatMonthShort(item.date)}
        </text>
      ))}

      {/* Tooltip — hover only */}
      {hovered && (
        <g className="hc-tooltip">
          <rect x={tipX - tipW / 2} y={tipY} width={tipW} height={40} rx="6" fill="#1f2937" />
          <text x={tipX} y={tipY + 13} fontSize="6.5" textAnchor="middle" fill="#d1d5db">
            {formatMonthShort(hovered.date)}
          </text>
          <text x={tipX} y={tipY + 24} fontSize="6.5" textAnchor="middle" fill="#fbbf24" fontWeight="bold">
            Số dư:
          </text>
          <text x={tipX} y={tipY + 35} fontSize="6" textAnchor="middle" fill="#fbbf24">
            {fmtVND(hovered.value)}
          </text>
          {/* Arrow pointing toward the data point */}
          {tipAbove ? (
            <polygon
              points={`${hovered.x - 4},${tipY + 40} ${hovered.x + 4},${tipY + 40} ${hovered.x},${tipY + 46}`}
              fill="#1f2937"
            />
          ) : (
            <polygon
              points={`${hovered.x - 4},${tipY} ${hovered.x + 4},${tipY} ${hovered.x},${tipY - 6}`}
              fill="#1f2937"
            />
          )}
        </g>
      )}
    </svg>
  )
}

type HomeStyleMap = {
  card: React.CSSProperties
  cardHeader: React.CSSProperties
  cardTitle: React.CSSProperties
  row: React.CSSProperties
  dot: (color: string) => React.CSSProperties
  statLabel: React.CSSProperties
  statVal: (color: string) => React.CSSProperties
  inputBase: React.CSSProperties
  fieldLabel: React.CSSProperties
  fieldWrap: React.CSSProperties
}

const S: HomeStyleMap = {
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '16px',
    marginBottom: '14px',
    boxShadow: '0 2px 16px rgba(123,81,241,0.08)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    fontWeight: 700,
    fontSize: '15px',
    color: '#121212',
    fontFamily: 'Satoshi, sans-serif',
  },
  row: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' },
  dot: (color: string): React.CSSProperties => ({
    width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0,
  }),
  statLabel: { color: '#6b7280', fontSize: '12px' },
  statVal: (color: string): React.CSSProperties => ({
    color, fontWeight: 700, fontSize: '12px', marginLeft: 'auto', whiteSpace: 'nowrap',
  }),
  inputBase: {
    width: '100%',
    border: '1.5px solid #e5e7eb',
    borderRadius: '14px',
    padding: '13px 16px',
    fontSize: '14px',
    color: '#121212',
    outline: 'none',
    background: '#fff',
    fontFamily: 'inherit',
  },
  fieldLabel: {
    fontSize: '13px', color: '#6b7280', display: 'block', marginBottom: '8px', fontWeight: 600,
  },
  fieldWrap: { marginBottom: '16px' },
}

type BottomNavItem =
  | { to: string; icon: string; label: string; active: boolean; center?: false }
  | { to: null; icon: null; label: string; center: true; active?: false }

const bottomNavItems: BottomNavItem[] = [
  { to: '/Home', icon: icon1, label: 'Trang chủ', active: true },
  { to: '/Activity', icon: icon2, label: 'Phân tích', active: false },
  { to: null, icon: null, label: 'THÊM NHANH', center: true },
  { to: '/BarChart', icon: icon3, label: 'Mục tiêu', active: false },
  { to: '/Invoicing', icon: icon4, label: 'Báo cáo', active: false },
]

const MonthCol: React.FC<{
  title: string; sub: string; expensePct: number; incomePct: number; isEmpty?: boolean;
  income: string; expense: string; total: string; incomeColor: string; expenseColor: string; totalColor: string;
}> = ({ title, sub, expensePct, incomePct, isEmpty, income, expense, total, incomeColor, expenseColor, totalColor }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px', fontWeight: 500 }}>{title}</p>
    <p style={{ fontSize: '11px', fontWeight: 700, color: '#121212', marginBottom: '8px' }}>{sub}</p>
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <HalfDonut expensePct={expensePct} incomePct={incomePct} isEmpty={isEmpty} size={100} />
    </div>
    <div style={{ marginTop: '10px' }}>
      <div style={S.row}>
        <span style={S.dot('#22c55e')} />
        <span style={S.statLabel}>Thu nhập:</span>
        <span style={S.statVal(incomeColor)}>{income}</span>
      </div>
      <div style={S.row}>
        <span style={S.dot('#ef4444')} />
        <span style={S.statLabel}>Chi phí:</span>
        <span style={S.statVal(expenseColor)}>{expense}</span>
      </div>
      <div style={S.row}>
        <span style={S.dot(totalColor === '#ef4444' ? '#ef4444' : '#d1d5db')} />
        <span style={S.statLabel}>Tổng cộng:</span>
        <span style={S.statVal(totalColor)}>{total}</span>
      </div>
    </div>
  </div>
)

const Home: React.FC = () => {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<UserProfile | null>(() => getStoredUser())
  const [fabOpen, setFabOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [accountId, setAccountId] = useState('')
  const [transactionDate, setTransactionDate] = useState(todayDateKey())
  const [note, setNote] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [accounts, setAccounts] = useState<DashboardAccount[]>([])
  const [formLoading, setFormLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [compressionStatus, setCompressionStatus] = useState<string>('')

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      setError('')
      const response = await api.get('/dashboard')
      setDashboardData(response.data.data ?? null)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setError(getApiErrorMessage(err, 'Không thể tải dữ liệu dashboard.'))
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me')
      const nextUser = response.data.user as UserProfile | undefined
      if (nextUser) {
        setUser(nextUser)
        localStorage.setItem('user', JSON.stringify(nextUser))
      }
    } catch (err) {
      console.error('Failed to fetch user:', err)
    }
  }, [])

  const loadQuickAddOptions = useCallback(async (type: TransactionType) => {
    try {
      setFormLoading(true)
      setFormError('')
      const [categoriesResponse, accountsResponse] = await Promise.all([
        api.get(`/categories?type=${type}`),
        api.get('/accounts'),
      ])
      const nextCategories = categoriesResponse.data.categories ?? []
      const nextAccounts = accountsResponse.data.accounts ?? []
      setCategories(nextCategories)
      setAccounts(nextAccounts)
      setAccountId(current => current || String(nextAccounts[0]?.id ?? ''))
    } catch (err) {
      console.error('Failed to fetch quick add options:', err)
      setFormError(getApiErrorMessage(err, 'Không thể tải hạng mục hoặc tài khoản.'))
    } finally {
      setFormLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
    fetchUser()
  }, [fetchDashboardData, fetchUser])

  useEffect(() => {
    if (showModal) {
      setCategory('')
      loadQuickAddOptions(transactionType)
    }
  }, [loadQuickAddOptions, showModal, transactionType])

  const totalBalance = useMemo(() => (
    dashboardData?.accounts?.reduce((sum, account) => sum + toNumber(account.balance), 0) ?? 0
  ), [dashboardData])

  const currentMonthSummary = useMemo(() => buildMonthSummary(dashboardData?.monthly_summary?.current), [dashboardData])
  const previousMonthSummary = useMemo(() => buildMonthSummary(dashboardData?.monthly_summary?.previous), [dashboardData])
  const spendingData = useMemo(() => buildSevenDayExpenses(dashboardData?.seven_day_expenses), [dashboardData])
  const balanceHistory = useMemo(() => dashboardData?.balance_history ?? [], [dashboardData])
  const balanceDelta = useMemo(() => {
    if (balanceHistory.length < 2) return null
    const latest = balanceHistory[balanceHistory.length - 1]
    const previous = balanceHistory[balanceHistory.length - 2]
    return toNumber(latest.balance) - toNumber(previous.balance)
  }, [balanceHistory])
  const recentTransactions = dashboardData?.recent_transactions ?? []
  const categoryOptions = useMemo(() => flattenCategories(categories), [categories])
  const quickAddSummary = currentMonthSummary
  const transactionLabel = transactionType === 'income' ? 'THU NHẬP' : 'CHI TIÊU'
  const transactionAccent = transactionType === 'income' ? '#22c55e' : '#ef4444'

  const openQuickAdd = (type: TransactionType) => {
    setTransactionType(type)
    setFabOpen(false)
    setShowModal(true)
    setAmount('')
    setCategory('')
    setNote('')
    setTransactionDate(todayDateKey())
    setFormError('')
    setReceipt(null)
    setReceiptPreview(null)
    setCompressionStatus('')
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setFormError(validation.error ?? 'Tệp không hợp lệ.')
      e.target.value = ''
      return
    }

    try {
      setCompressionStatus('Đang nén ảnh...')
      setFormError('')

      const result = await processImageForUpload(file, (progress: { stage: string }) => {
        if (progress.stage === 'compressing') {
          setCompressionStatus('Đang nén ảnh...')
        }
      })

      if (result.wasCompressed) {
        console.log(`Ảnh đã nén: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (giảm ${result.compressionRatio}%)`)
      }

      setReceipt(result.file)
      const reader = new FileReader()
      reader.onloadend = () => { setReceiptPreview(reader.result as string) }
      reader.readAsDataURL(result.file)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xử lý ảnh.'
      setFormError(message)
      e.target.value = ''
    } finally {
      setCompressionStatus('')
    }
  }

  const handleSaveQuickAdd = async () => {
    const amountValue = Number(amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setFormError('Vui lòng nhập số tiền hợp lệ.')
      return
    }
    if (!category) {
      setFormError('Vui lòng chọn hạng mục.')
      return
    }
    if (!accountId) {
      setFormError('Vui lòng chọn tài khoản.')
      return
    }

    try {
      setSaving(true)
      setFormError('')

      const submitData = new FormData()
      submitData.append('type', transactionType)
      submitData.append('amount', String(amountValue))
      submitData.append('category_id', String(Number(category)))
      submitData.append('account_id', String(Number(accountId)))
      submitData.append('transaction_date', transactionDate)
      if (note) submitData.append('notes', note)
      if (receipt) submitData.append('receipt', receipt)

      await api.post('/transactions', submitData)

      setShowModal(false)
      setAmount('')
      setCategory('')
      setNote('')
      setReceipt(null)
      setReceiptPreview(null)
      await fetchDashboardData(false)
    } catch (err) {
      console.error('Failed to save quick add transaction:', err)
      setFormError(getApiErrorMessage(err, 'Không thể lưu giao dịch.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ff' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}>
          <div style={{ width: '44px', height: '44px', border: '4px solid #ddd6fe', borderTopColor: '#7B51F1', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.9s linear infinite' }} />
          <p>Đang tải dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main">

          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="setting-header">
                  <div className="setting-left">
                    <span><img src={Logo} alt="logo" /></span>
                    <span className="setting-txt">Dashboard</span>
                  </div>
                  <div className="setting-right">
                    <span>
                      <Link to="/Notification">
                        <img src={NotificationIcon} alt="thông báo" />
                      </Link>
                    </span>
                    <span className="dots-icon">
                      <Link to="#" data-bs-toggle="offcanvas" data-bs-target="#offcanvasExample">
                        <img src={dotsIcon} alt="menu" />
                      </Link>
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ paddingBottom: '24px', paddingTop: '4px' }}>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500, fontFamily: 'Satoshi, sans-serif' }}>
                  Chào {user?.name || 'bạn'},
                </p>
                <h1 style={{
                  color: '#fff', fontSize: '28px', fontWeight: 800,
                  marginTop: '4px', letterSpacing: '-0.5px', fontFamily: 'Poppins, sans-serif',
                }}>
                  {fmtVND(totalBalance)}
                </h1>
                <p style={{
                  color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '2.5px', marginTop: '4px', textTransform: 'uppercase',
                  fontFamily: 'Satoshi, sans-serif',
                }}>
                  TỔNG SỐ TIỀN SỞ HỮU
                </p>
              </div>
            </div>
          </div>

          <div className="verify-number-bottom" id="homepage">
            <div className="verify-number-bottom-wrap">

              {error && (
                <div style={{ ...S.card, color: '#b91c1c', background: '#fef2f2', fontSize: '13px', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Sơ lược</span>
                  <span style={{ color: '#9ca3af', fontSize: '18px', cursor: 'pointer', letterSpacing: '2px' }}>···</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonthCol
                    title="Tháng Này" sub={currentMonthSummary.sub}
                    expensePct={currentMonthSummary.expensePct} incomePct={currentMonthSummary.incomePct}
                    isEmpty={currentMonthSummary.isEmpty}
                    income={currentMonthSummary.income} expense={currentMonthSummary.expense} total={currentMonthSummary.total}
                    incomeColor={currentMonthSummary.incomeColor} expenseColor={currentMonthSummary.expenseColor} totalColor={currentMonthSummary.totalColor}
                  />
                  <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
                  <MonthCol
                    title="Tháng Trước" sub={previousMonthSummary.sub}
                    expensePct={previousMonthSummary.expensePct} incomePct={previousMonthSummary.incomePct}
                    isEmpty={previousMonthSummary.isEmpty}
                    income={previousMonthSummary.income} expense={previousMonthSummary.expense} total={previousMonthSummary.total}
                    incomeColor={previousMonthSummary.incomeColor} expenseColor={previousMonthSummary.expenseColor} totalColor={previousMonthSummary.totalColor}
                  />
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Chi tiêu - 7 ngày qua</span>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📅</span>
                </div>
                <SpendingChart data={spendingData} />
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  Kéo ngang để xem chi tiết từng ngày
                </p>
              </div>

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Số dư lịch sử</span>
                  <span style={{
                    fontSize: '11px', color: '#7B51F1',
                    background: 'rgba(123,81,241,0.1)', padding: '3px 10px',
                    borderRadius: '20px', fontWeight: 700,
                  }}>{balanceDelta === null ? 'Chưa có dữ liệu' : `${fmtCompactVND(balanceDelta)} ▾`}</span>
                </div>
                <HistoricalChart data={balanceHistory} />
              </div>

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Giao dịch gần đây</span>
                  <span style={{
                    width: '30px', height: '30px', borderRadius: '50%',
                    background: 'rgba(123,81,241,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '14px',
                  }}>⊜</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {recentTransactions.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                      Chưa có giao dịch nào.
                    </p>
                  ) : recentTransactions.map(tx => {
                    const signedAmount = getTransactionSignedAmount(tx)
                    return (
                    <div key={tx.id} onClick={() => { setSelectedTransactionId(tx.id); setShowEditModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                        background: signedAmount >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>
                        {getCategoryIcon(tx.category?.slug)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px', fontWeight: 600, color: '#121212',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontFamily: 'Satoshi, sans-serif',
                        }}>{tx.category?.name || (tx.type === 'income' ? 'Thu nhập' : 'Chi tiêu')}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          {[getTransactionDateLabel(tx), tx.account?.name].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <span style={{
                        fontSize: '14px', fontWeight: 700, flexShrink: 0,
                        color: signedAmount >= 0 ? '#22c55e' : '#ef4444',
                        fontFamily: 'Satoshi, sans-serif',
                      }}>
                        {fmtSignedVND(signedAmount)}
                      </span>
                    </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ height: '110px' }} />
            </div>
          </div>
        </div>

        <div className="offcanvas offcanvas-start menu-canvas" id="offcanvasExample" aria-labelledby="offcanvasExampleLabel">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title" id="offcanvasExampleLabel">Setting</h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <Setting />
          </div>
        </div>

        <div className="bottom-menu-svg-main">
          <div className="bottom-menu-svg">
            <div className="gol3" onClick={() => setFabOpen(f => !f)} style={{ cursor: 'pointer' }}>
              <div className="add-to-cart-icon">
                <span style={{
                  color: '#fff', fontSize: '32px', fontWeight: 300, lineHeight: 1,
                  display: 'block', userSelect: 'none',
                  transform: fabOpen ? 'rotate(45deg)' : 'none',
                  transition: 'transform 0.22s ease',
                }}>+</span>
              </div>
            </div>
            <svg className="bottom-menu-svg-design" width="600" height="150" viewBox="0 0 375 104" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_b_1_13394)">
                <path d="M188 45.5313C205.673 45.5313 220 31.2045 220 13.5313C220 7.32365 224.732 0.674172 230.917 1.20338L360.364 12.2791C368.642 12.9873 375 19.913 375 28.2208V103.531H0V28.2275C0 19.9169 6.36254 12.9898 14.6432 12.2851L145.074 1.18463C151.266 0.657657 156 7.31698 156 13.5313C156 31.2045 170.327 45.5313 188 45.5313Z" fill="url(#paint0_linear_1_13394)" />
              </g>
              <defs>
                <filter id="filter0_b_1_13394" x="-24" y="-22.8447" width="423" height="150.376" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
                  <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur_1_13394" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur_1_13394" result="shape" />
                </filter>
                <linearGradient id="paint0_linear_1_13394" x1="187.5" y1="0" x2="188" y2="103.531" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopOpacity="0.24" />
                  <stop offset="1" stopOpacity="0.16" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {fabOpen && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setFabOpen(false)}
          />
        )}

        {fabOpen && (
          <div style={{
            position: 'fixed', bottom: '112px', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: '24px', zIndex: 90, alignItems: 'center',
            animation: 'fadeUp 0.2s ease',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => openQuickAdd('income')}
                style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'linear-gradient(145deg, #22c55e, #16a34a)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(34,197,94,0.5)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: 300 }}>+</span>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>VND</span>
              </button>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Thu nhập</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => openQuickAdd('expense')}
                style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                  border: 'none', color: '#fff', cursor: 'pointer',
                  boxShadow: '0 8px 28px rgba(239,68,68,0.5)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
                }}
              >
                <span style={{ fontSize: '22px', lineHeight: 1, fontWeight: 300 }}>−</span>
                <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px' }}>VND</span>
              </button>
              <span style={{ fontSize: '10px', color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>Chi tiêu</span>
            </div>
          </div>
        )}

        <div className="navigation">
          <ul className="listWrap" style={{ alignItems: 'flex-start' }}>
            {bottomNavItems.map((item, i) => {
              if (item.center) {
                return (
                  <li key={i} className="list" style={{ visibility: 'hidden', width: '80px', textAlign: 'center' }}>
                    <span style={{ fontSize: '8px', color: '#7B51F1', fontWeight: 700, display: 'block', marginTop: '44px' }}>
                      THÊM NHANH
                    </span>
                  </li>
                )
              }
              return (
                <li key={i} className={`list${item.active ? ' active' : ''}`}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Link to={item.to!}>
                    <i className="icon"><img src={item.icon!} alt={item.label} /></i>
                    <span className="text"></span>
                  </Link>
                  <span style={{
                    fontSize: '9px', color: item.active ? '#7B51F1' : '#9ca3af',
                    fontWeight: item.active ? 700 : 400, textAlign: 'center',
                    display: 'block', marginTop: '2px', whiteSpace: 'nowrap',
                  }}>{item.label}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="offcanvas offcanvas-bottom logout-main" id="offcanvasBottom">
          <button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" fill="none">
              <g>
                <path d="M22 8L12 13L2 8" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L12 7L2 2" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
          <div className="offcanvas-body small">
            <h2 className="logout-text-pop mt-12">Đăng xuất</h2>
            <p className="sm-txt mt-16">Bạn có chắc muốn đăng xuất?</p>
            <div className="logout-button-main mt-32">
              <button className="logout-cancel" data-bs-dismiss="offcanvas" aria-label="Close">Hủy</button>
              <button className="logout-cancel yes-logot" onClick={() => navigate('/')}>Đồng ý</button>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
          onClick={e => { if (e.currentTarget === e.target) setShowModal(false) }}
        >
          <div style={{
            background: '#fff', borderRadius: '24px 24px 0 0',
            maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 -8px 48px rgba(0,0,0,0.25)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 20px 14px', borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 0, background: '#fff', zIndex: 1,
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px' }}
              >Hủy</button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>THÊM KHOẢN</p>
                <p style={{ fontSize: '14px', fontWeight: 800, color: transactionAccent, letterSpacing: '0.5px' }}>{transactionLabel}</p>
              </div>
              <button
                onClick={handleSaveQuickAdd}
                disabled={saving || formLoading}
                style={{
                  background: saving || formLoading ? '#a78bfa' : '#7B51F1', border: 'none', color: '#fff',
                  padding: '8px 18px', borderRadius: '20px',
                  fontSize: '14px', fontWeight: 700, cursor: saving || formLoading ? 'not-allowed' : 'pointer',
                }}
              >{saving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{
                width: '70px', height: '48px', borderRadius: '12px', background: '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <HalfDonut expensePct={quickAddSummary.expensePct} incomePct={quickAddSummary.incomePct} isEmpty={quickAddSummary.isEmpty} size={64} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>SƠ LƯỢC</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {[
                    { label: 'Thu nhập:', val: quickAddSummary.income, color: quickAddSummary.incomeColor },
                    { label: 'Chi phí:', val: quickAddSummary.expense, color: quickAddSummary.expenseColor },
                    { label: 'Tổng cộng:', val: quickAddSummary.total, color: quickAddSummary.totalColor },
                  ].map((s, i) => (
                    <div key={i}>
                      <p style={{ fontSize: '10px', color: '#9ca3af' }}>{s.label}</p>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              {formError && (
                <div style={{ color: '#b91c1c', background: '#fef2f2', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>
                  {formError}
                </div>
              )}

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Số tiền</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '0 16px',
                  background: '#fff',
                }}>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={saving}
                    placeholder="0"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: '28px', fontWeight: 800, padding: '12px 0',
                      background: 'transparent', color: '#121212', fontFamily: 'Satoshi, sans-serif',
                    }}
                  />
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#9ca3af' }}>đ</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Hạng mục</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={formLoading || saving}
                    style={{ ...S.inputBase, appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="">{formLoading ? 'Đang tải hạng mục...' : 'Chọn hạng mục'}</option>
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                  }}>▾</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Ngày</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  disabled={saving}
                  style={S.inputBase}
                />
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Tài khoản</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    disabled={formLoading || saving}
                    style={{ ...S.inputBase, appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="">{formLoading ? 'Đang tải tài khoản...' : 'Chọn tài khoản'}</option>
                    {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                  }}>▾</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Ghi chú</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={saving}
                  placeholder="Thêm ghi chú..."
                  style={S.inputBase}
                />
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Ảnh hóa đơn <span style={{ color: '#9ca3af', fontWeight: 400 }}>(tuỳ chọn)</span></label>
                <input
                  type="file"
                  id="quick-add-receipt"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={saving || !!compressionStatus}
                  style={{ display: 'none' }}
                />
                <label
                  htmlFor="quick-add-receipt"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    border: `2px dashed ${compressionStatus ? '#7B51F1' : receiptPreview ? '#7B51F1' : '#e5e7eb'}`,
                    borderRadius: '14px', padding: '16px',
                    background: compressionStatus ? '#f5f3ff' : receiptPreview ? '#faf9ff' : '#f8fafc',
                    cursor: saving || compressionStatus ? 'not-allowed' : 'pointer',
                    transition: 'border-color 0.2s, background 0.2s',
                    minHeight: '80px',
                  }}
                >
                  {compressionStatus ? (
                    <>
                      <div style={{
                        width: '24px', height: '24px', border: '3px solid #ddd6fe', borderTopColor: '#7B51F1',
                        borderRadius: '50%', marginBottom: '8px',
                        animation: 'spin 0.9s linear infinite',
                      }} />
                      <span style={{ fontSize: '13px', color: '#7B51F1', fontWeight: 600 }}>{compressionStatus}</span>
                    </>
                  ) : receiptPreview ? (
                    <>
                      <img
                        src={receiptPreview}
                        alt="Xem trước hóa đơn"
                        style={{ maxHeight: '120px', borderRadius: '10px', marginBottom: '8px', objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '12px', color: '#7B51F1', fontWeight: 600 }}>Nhấn để thay ảnh</span>
                    </>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Tải ảnh lên</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>JPEG, PNG, WebP · tối đa 10 MB</span>
                    </>
                  )}
                </label>
                {receiptPreview && !compressionStatus && (
                  <button
                    type="button"
                    onClick={() => { setReceipt(null); setReceiptPreview(null) }}
                    disabled={saving}
                    style={{
                      marginTop: '8px', background: 'none', border: 'none',
                      color: '#ef4444', fontSize: '12px', fontWeight: 600,
                      cursor: 'pointer', padding: '2px 0',
                    }}
                  >✕ Xoá ảnh</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <EditTransactionModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedTransactionId(null)
        }}
        transactionId={selectedTransactionId}
        onUpdate={() => fetchDashboardData(false)}
      />

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Home
