import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Setting from '../components/Setting.tsx'
import api from '../utils/api'
import { formatCurrency, getCategoryIcon } from '../constants/categories'
import EditTransactionModal from '../components/EditTransactionModal'
import TransferMoneyModal from '../components/TransferMoneyModal'
import { processImageForUpload, validateImageFile, formatFileSize } from '../utils/imageCompression'
import { useTranslation } from 'react-i18next'
import Offcanvas from 'react-bootstrap/Offcanvas'
import { useSecureLogout } from '../hooks/useSecureLogout'
import { useQuickAdd } from '../context/QuickAddContext'
import { useHomeDashboard } from '../hooks/useHomeDashboard'
import { Bell, CalendarDays, ChevronRight, MoreHorizontal, MoreVertical } from 'lucide-react'

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
    incomeColor: income > 0 ? '#28a745' : '#9ca3af',
    expenseColor: expense > 0 ? '#dc3545' : '#9ca3af',
    totalColor: net < 0 ? '#dc3545' : net > 0 ? '#28a745' : '#9ca3af',
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
  const radius = 38
  const circumference = 2 * Math.PI * radius
  const expenseLength = (Math.min(expensePct, 100) / 100) * circumference
  const incomeLength = (Math.min(incomePct, 100) / 100) * circumference
  const remainderLength = Math.max(circumference - expenseLength - incomeLength, 0)

  return (
    <div className={`home-donut${isEmpty ? ' is-empty' : ''}`} style={{ width: size, height: size }} aria-hidden>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#eeeaff" strokeWidth="11" />
        {!isEmpty && expenseLength > 0 && (
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke="#ef596b" strokeWidth="11"
            strokeDasharray={`${expenseLength} ${circumference - expenseLength}`}
            strokeDashoffset="0"
          />
        )}
        {!isEmpty && incomeLength > 0 && (
          <circle
            cx="50" cy="50" r={radius} fill="none" stroke="#51c89a" strokeWidth="11"
            strokeDasharray={`${incomeLength} ${circumference - incomeLength}`}
            strokeDashoffset={-expenseLength}
          />
        )}
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={isEmpty ? '#7157df' : '#d1c7ff'} strokeWidth="11"
          strokeDasharray={`${isEmpty ? circumference * 0.72 : remainderLength} ${circumference}`}
          strokeDashoffset={isEmpty ? 0 : -(expenseLength + incomeLength)}
        />
      </svg>
      <span className="home-donut-label">{isEmpty ? '0%' : `${Math.round(expensePct)}%`}<small>of limit</small></span>
    </div>
  )
}

const SpendingChart: React.FC<{ data: SpendingDay[] }> = ({ data }) => {
  const { t } = useTranslation()
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)
  const maxAmount = Math.max(...data.map(day => day.amount), 0)
  const maxVal = maxAmount > 0 ? Math.ceil(maxAmount / 1_000_000) * 1_000_000 : 1_000_000
  const chartTop = 16, chartBottom = 124, chartLeft = 44, chartRight = 304
  const chartHeight = chartBottom - chartTop
  const colW = (chartRight - chartLeft) / Math.max(data.length - 1, 1)
  const tickValues = Array.from({ length: 5 }, (_, index) => (maxVal / 4) * index)
  const points = data.map((day, index) => ({
    ...day,
    x: chartLeft + index * colW,
    y: chartBottom - (day.amount / maxVal) * chartHeight,
  }))
  const polyline = points.map(point => `${point.x},${point.y}`).join(' ')

  return (
    <svg
      viewBox="0 0 340 160"
      className="home-spending-chart"
      role="img"
      aria-label={t('Spending — Last 7 Days')}
      onMouseLeave={() => setHoveredPoint(null)}
    >
      {tickValues.map((value, i) => {
        const y = chartBottom - (value / maxVal) * chartHeight
        return (
          <g key={i}>
            <line x1={chartLeft} y1={y} x2={chartRight} y2={y} className="home-chart-grid" />
            <text x={chartLeft - 10} y={y + 3} className="home-chart-axis-label">{fmtCompactVND(value)}</text>
          </g>
        )
      })}

      {hoveredPoint !== null && (
        <line
          x1={points[hoveredPoint].x} y1={chartTop} x2={points[hoveredPoint].x} y2={chartBottom}
          className="home-chart-crosshair"
        />
      )}

      <polyline points={polyline} className="home-spending-line" />
      {points.map((point, index) => (
        <g key={point.date} onMouseEnter={() => setHoveredPoint(index)} onClick={() => setHoveredPoint(index)} style={{ cursor: 'pointer' }}>
          <circle cx={point.x} cy={point.y} r="9" fill="transparent" />
          <circle cx={point.x} cy={point.y} r={point.isSpike ? 5 : 3.5} className={`home-spending-point${point.isSpike ? ' is-spike' : ''}`} />
          <text x={point.x} y={chartBottom + 19} className={hoveredPoint === index ? 'home-chart-day is-active' : 'home-chart-day'}>{point.label}</text>
          {hoveredPoint === index && point.amount > 0 && (
            <g className="home-chart-tooltip">
              <rect x={Math.max(chartLeft, Math.min(point.x - 38, chartRight - 76))} y={Math.max(0, point.y - 42)} width="76" height="28" rx="8" />
              <text x={Math.max(chartLeft + 38, Math.min(point.x, chartRight - 38))} y={Math.max(16, point.y - 24)}>{fmtVND(point.amount)}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  )
}

const HistoricalChart: React.FC<{ data: BalanceHistoryPoint[] }> = ({ data }) => {
  const { t } = useTranslation()
  const [hoveredPt, setHoveredPt] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length === 0) {
    return (
      <svg viewBox="0 0 275 130" style={{ width: '100%' }} role="img" aria-label={t('Balance History')}>
        <text x="137" y="66" fontSize="10" textAnchor="middle" fill="#9ca3af">{t('No balance data yet')}</text>
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
      aria-label={t('Balance History')}
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
            {t('Balance:')}
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

const MonthCol: React.FC<{
  title: string; sub: string; expensePct: number; incomePct: number; isEmpty?: boolean;
  income: string; expense: string; total: string; incomeColor: string; expenseColor: string; totalColor: string;
}> = ({ title, expensePct, incomePct, isEmpty, income, expense, total, incomeColor, expenseColor, totalColor }) => {
  const { t } = useTranslation()
  return (
    <div className="home-month-col" style={{ flex: 1, minWidth: 0 }}>
      {/* Column header — only the period label ("This Month"), no date sub-text */}
      <p className="home-month-title" style={{ fontSize: '11px', fontWeight: 700, color: '#121212', marginBottom: '8px', fontFamily: 'Satoshi, sans-serif' }}>{title}</p>

      {/* Horizontal layout: rotated chart on the left, metrics on the right */}
      <div className="home-month-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Chart container — keeps a stable bounding box after 90° rotation */}
        <div className="home-month-donut">
          <HalfDonut expensePct={expensePct} incomePct={incomePct} isEmpty={isEmpty} size={90} />
        </div>

        {/* Metrics — "Label: Value" plain text rows, no dot icons */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={S.row}>
            <span style={S.statLabel}>{t('income')}</span>
            <span style={S.statVal(incomeColor)}>{income}</span>
          </div>
          <div style={S.row}>
            <span style={S.statLabel}>{t('expense')}</span>
            <span style={S.statVal(expenseColor)}>{expense}</span>
          </div>
          <div style={S.row}>
            <span style={S.statLabel}>{t('total')}</span>
            <span style={S.statVal(totalColor)}>{total}</span>
          </div>
        </div>

      </div>
    </div>
  )
}

const Home: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useSecureLogout()
  const {
    dashboardData, loading, error, user, showModal, setShowModal, transactionType,
    setTransactionType, amount, setAmount, category, setCategory, accountId, setAccountId,
    transactionDate, setTransactionDate, note, setNote, categories, accounts, formLoading,
    saving, formError, receipt, setReceipt, receiptPreview, setReceiptPreview,
    compressionStatus, setCompressionStatus, fetchDashboardData, openQuickAdd,
    handleFileChange, handleSaveQuickAdd,
  } = useHomeDashboard()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isLogoutOpen, setIsLogoutOpen] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState<boolean>(false)
  const [showTransferModal, setShowTransferModal] = useState(false)

  // ── Restore Settings drawer after back-navigation ─────────────────────────
  // Setting.tsx writes 'kenfinly_settings_return' to sessionStorage before
  // navigating to any child settings page. On mount we read + consume the flag
  // and drive the drawer purely through React state — no Bootstrap JS API needed.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('kenfinly_settings_return')
      if (!raw) return
      sessionStorage.removeItem('kenfinly_settings_return')   // consume once
      const state = JSON.parse(raw)
      if (state.drawerOpen) setIsDrawerOpen(true)
    } catch { /* sessionStorage unavailable or JSON malformed — safe to ignore */ }
  }, [])

  // ── Logout confirmation drawer ────────────────────────────────────────────
  // Setting.tsx dispatches 'kenfinly:open-logout'. We close the settings drawer
  // first so the logout sheet slides up cleanly over the plain Home screen.
  useEffect(() => {
    const handler = () => {
      setIsDrawerOpen(false)
      setIsLogoutOpen(true)
    }
    window.addEventListener('kenfinly:open-logout', handler)
    return () => window.removeEventListener('kenfinly:open-logout', handler)
  }, [])

  // ── FAB quick-add events from AppLayout ──────────────────────────────────
  // AppLayout triggers these via QuickAddContext when the user picks
  // Income / Expense / Transfer from the FAB speed-dial.
  const { pendingAction, clearQuickAdd } = useQuickAdd()
  useEffect(() => {
    if (!pendingAction) return
    if (pendingAction === 'transfer') {
      setShowTransferModal(true)
    } else {
      openQuickAdd(pendingAction)
    }
    clearQuickAdd()
  // openQuickAdd is stable; clearQuickAdd is memoised — safe deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAction])

  const handleConfirmLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
    } catch {
      // logout() never throws — this branch is a safety net only
      setLogoutLoading(false)
    }
  }

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
  const transactionLabel = transactionType === 'income' ? t('INCOME') : t('EXPENSE')
  const transactionAccent = transactionType === 'income' ? '#22c55e' : '#ef4444'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ff' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'Satoshi, sans-serif' }}>
          <div style={{ width: '44px', height: '44px', border: '4px solid #ddd6fe', borderTopColor: '#7B51F1', borderRadius: '50%', margin: '0 auto 14px', animation: 'spin 0.9s linear infinite' }} />
          <p>{t('Loading dashboard...')}</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <div className="site-content">
        <div className="verify-number-main">

          <div className="verify-number-top home-hero">
            <div className="container">
              <div className="verify-number-top-content home-hero-header">
                <div className="setting-header home-header">
                  <div className="setting-left home-header-title">
                    <span className="home-brand-mark" aria-hidden>k</span>
                    <span className="setting-txt">{t('Dashboard')}</span>
                  </div>
                  <div className="setting-right">
                    <span className="home-header-action">
                      <Link to="/Notification" aria-label="Open notifications">
                        <Bell size={19} strokeWidth={2} />
                      </Link>
                    </span>
                    <span className="home-header-action">
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="home-icon-button"
                        aria-label="Open settings"
                      >
                        <MoreVertical size={19} strokeWidth={2} />
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              <div className="home-hero-balance">
                <p className="home-greeting">
                  {user?.name ? t('Hello {{name}},', { name: user.name }) : t('Hello,')}
                </p>
                <h1 className="home-balance">
                  {fmtVND(totalBalance)}
                </h1>
                <p className="home-balance-label">
                  {t('TOTAL BALANCE')}
                </p>
              </div>
            </div>
          </div>

          <div className="verify-number-bottom home-content" id="homepage">
            <div className="verify-number-bottom-wrap home-content-inner">

              {error && (
                <div className="home-card home-error" style={{ ...S.card, color: '#b91c1c', background: '#fef2f2', fontSize: '13px', fontWeight: 600 }}>
                  {error}
                </div>
              )}

              <div className="home-card home-overview-card" style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>{t('Overview')}</span>
                  <button type="button" className="home-card-menu" aria-label="Overview options"><MoreHorizontal size={19} /></button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonthCol
                    title={t('This Month')} sub={currentMonthSummary.sub}
                    expensePct={currentMonthSummary.expensePct} incomePct={currentMonthSummary.incomePct}
                    isEmpty={currentMonthSummary.isEmpty}
                    income={currentMonthSummary.income} expense={currentMonthSummary.expense} total={currentMonthSummary.total}
                    incomeColor={currentMonthSummary.incomeColor} expenseColor={currentMonthSummary.expenseColor} totalColor={currentMonthSummary.totalColor}
                  />
                  <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
                  <MonthCol
                    title={t('Last Month')} sub={previousMonthSummary.sub}
                    expensePct={previousMonthSummary.expensePct} incomePct={previousMonthSummary.incomePct}
                    isEmpty={previousMonthSummary.isEmpty}
                    income={previousMonthSummary.income} expense={previousMonthSummary.expense} total={previousMonthSummary.total}
                    incomeColor={previousMonthSummary.incomeColor} expenseColor={previousMonthSummary.expenseColor} totalColor={previousMonthSummary.totalColor}
                  />
                </div>
              </div>

              <div className="home-card home-chart-card" style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>{t('Spending — Last 7 Days')}</span>
                  <CalendarDays size={18} className="home-card-icon" aria-hidden />
                </div>
                <SpendingChart data={spendingData} />
                <p style={{ textAlign: 'center', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  {t('Swipe to see daily details')}
                </p>
              </div>

              <div className="home-card home-history-card" style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>{t('Balance History')}</span>
                  <span className="home-card-select">
                    {balanceDelta === null ? t('No data yet') : `${fmtCompactVND(balanceDelta)} ▾`}
                  </span>
                </div>
                <HistoricalChart data={balanceHistory} />
              </div>

              <div className="home-card home-transactions-card" style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>{t('Recent Transactions')}</span>
                  <button type="button" className="home-view-all" onClick={() => navigate('/analytics')}>
                    View all <ChevronRight size={15} />
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {recentTransactions.length === 0 ? (
                    <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '10px 0' }}>
                      {t('No transactions yet.')}
                    </p>
                  ) : recentTransactions.map(tx => {
                    const signedAmount = getTransactionSignedAmount(tx)
                    return (
                    <div key={tx.id} onClick={() => { setSelectedTransactionId(tx.id); setShowEditModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <div className="home-transaction-icon" style={{
                        width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                        background: signedAmount >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>
                        {getCategoryIcon(tx.category?.slug)}
                      </div>
                      {/* Left column — category name (bold) + wallet name (gray) */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                          <p className="home-transaction-name" style={{
                          fontSize: '14px', fontWeight: 600, color: '#121212',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontFamily: 'Satoshi, sans-serif',
                        }}>{tx.category?.name || (tx.type === 'income' ? t('Income') : t('Expense'))}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'Satoshi, sans-serif' }}>
                          {tx.account?.name || ''}
                        </p>
                      </div>
                      {/* Right column — amount (bold, color-coded) + date (gray), mirrors left height */}
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          <p className="home-transaction-amount" style={{
                          fontSize: '14px', fontWeight: 700,
                          color: signedAmount >= 0 ? '#28a745' : '#dc3545',
                          fontFamily: 'Satoshi, sans-serif',
                        }}>
                          {fmtSignedVND(signedAmount)}
                        </p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px', fontFamily: 'Satoshi, sans-serif' }}>
                          {getTransactionDateLabel(tx)}
                        </p>
                      </div>
                    </div>
                    )
                  })}
                </div>
              </div>

               <div style={{ height: '110px' }} />
            </div>
          </div>
        </div>

        <Offcanvas
          show={isDrawerOpen}
          onHide={() => setIsDrawerOpen(false)}
          placement="start"
          className="menu-canvas"
          aria-labelledby="offcanvasExampleLabel"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasExampleLabel">{t('Settings')}</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Setting />
          </Offcanvas.Body>
        </Offcanvas>

        {/* Bottom navigation is now rendered by AppLayout > BottomNavigation */}


        {/* ── Logout confirmation sheet (react-bootstrap — no vanilla JS timing issues) ── */}
        <Offcanvas
          show={isLogoutOpen}
          onHide={() => { if (!logoutLoading) setIsLogoutOpen(false) }}
          placement="bottom"
          className="logout-main"
        >
          <button
            type="button"
            className="text-reset"
            onClick={() => { if (!logoutLoading) setIsLogoutOpen(false) }}
            disabled={logoutLoading}
            aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: logoutLoading ? 'not-allowed' : 'pointer' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" fill="none">
              <g>
                <path d="M22 8L12 13L2 8" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 2L12 7L2 2" stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
          <Offcanvas.Body className="small">
            <h2 className="logout-text-pop mt-12">{t('Logout')}</h2>
            <p className="sm-txt mt-16">{t('Are you sure you want to log out?')}</p>
            <div className="logout-button-main mt-32">
              <button
                className="logout-cancel"
                onClick={() => setIsLogoutOpen(false)}
                disabled={logoutLoading}
                aria-label="Cancel"
              >
                {t('Cancel')}
              </button>
              <button
                className="logout-cancel yes-logot"
                onClick={handleConfirmLogout}
                disabled={logoutLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  opacity: logoutLoading ? 0.75 : 1,
                  cursor: logoutLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {logoutLoading && (
                  <span style={{
                    width: 14, height: 14,
                    border: '2px solid rgba(255,255,255,0.4)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'ks-spin 0.75s linear infinite',
                  }} />
                )}
                {logoutLoading ? t('Logging out…') : t('Confirm')}
              </button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>
        {/* Spinner keyframe for logout button */}
        <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>
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
              >{t('Cancel')}</button>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>{t('ADD ENTRY')}</p>
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
              >{saving ? t('Saving...') : t('Save')}</button>
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
                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>{t('OVERVIEW')}</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {[
                    { label: t('Income:'),  val: quickAddSummary.income,  color: quickAddSummary.incomeColor  },
                    { label: t('Expense:'), val: quickAddSummary.expense, color: quickAddSummary.expenseColor },
                    { label: t('Total:'),   val: quickAddSummary.total,   color: quickAddSummary.totalColor   },
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
                <label style={S.fieldLabel}>{t('Amount')}</label>
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
                <label style={S.fieldLabel}>{t('Category')}</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={formLoading || saving}
                    style={{ ...S.inputBase, appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="">{formLoading ? t('Loading categories...') : t('Select category')}</option>
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                  }}>▾</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>{t('Date')}</label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={e => setTransactionDate(e.target.value)}
                  disabled={saving}
                  style={S.inputBase}
                />
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>{t('Account')}</label>
                <div style={{ position: 'relative' }}>
                  <select
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    disabled={formLoading || saving}
                    style={{ ...S.inputBase, appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="">{formLoading ? t('Loading accounts...') : t('Select account')}</option>
                    {accounts.map(account => <option key={account.id} value={account.id}>{account.name}</option>)}
                  </select>
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                  }}>▾</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>{t('Note')}</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  disabled={saving}
                  placeholder={t('Add a note...')}
                  style={S.inputBase}
                />
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>{t('Receipt photo')} <span style={{ color: '#9ca3af', fontWeight: 400 }}>{t('(optional)')}</span></label>
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
                        alt="receipt preview"
                        style={{ maxHeight: '120px', borderRadius: '10px', marginBottom: '8px', objectFit: 'contain' }}
                      />
                      <span style={{ fontSize: '12px', color: '#7B51F1', fontWeight: 600 }}>{t('Tap to change photo')}</span>
                    </>
                  ) : (
                    <>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>{t('Upload photo')}</span>
                      <span style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>{t('JPEG, PNG, WebP · max 10 MB')}</span>
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
                  >{t('✕ Remove photo')}</button>
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

      <TransferMoneyModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSuccess={() => fetchDashboardData(false)}
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
