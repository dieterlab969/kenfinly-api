import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../../utils/api'
import icon5 from '../assets/images/tabbar/icon5.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'

// ── Types ─────────────────────────────────────────────────────────────────────

type RangeType = 'TODAY' | '7_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'THIS_YEAR' | 'CUSTOM'

interface PeriodTotals {
  income: number
  expense: number
  net: number
}

interface Overview {
  current: PeriodTotals
  previous: PeriodTotals
  mom_income_change_pct: number | null
  mom_expense_change_pct: number | null
}

interface ChartPoint {
  label: string
  income: number
  expense: number
  savings: number
}

interface TopCategory {
  id: number
  name: string
  icon: string
  color: string
  total_spend: number
  transaction_count: number
  percentage_spend: number
}

interface AnalyticsSummary {
  range_type: RangeType
  start_date: string
  end_date: string
  overview: Overview
  charts: ChartPoint[]
  top_categories: TopCategory[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toNum(v: unknown): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function fmtVND(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tỷ`
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}Tr`
  if (abs >= 1_000)
    return `${sign}${(abs / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}K`
  return `${sign}${abs.toLocaleString('vi-VN')}đ`
}

function fmtFull(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + 'đ'
}

function pctBadge(pct: number | null): { text: string; positive: boolean } | null {
  if (pct === null) return null
  const positive = pct >= 0
  return { text: `${positive ? '+' : ''}${pct}%`, positive }
}

// ── HalfDonut (MoM radial) ────────────────────────────────────────────────────

const HalfDonut: React.FC<{
  expensePct: number
  incomePct: number
  isEmpty?: boolean
  size?: number
}> = ({ expensePct, incomePct, isEmpty, size = 100 }) => {
  const r = 36, cx = 50, cy = 50
  const expAngle = (expensePct / 100) * Math.PI
  const boundAngle = Math.PI - expAngle
  const bx = cx + r * Math.cos(boundAngle)
  const by = cy - r * Math.sin(boundAngle)
  const largeArc = expensePct > 100 ? 1 : 0

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
        d={`M 14 50 A 36 36 0 ${largeArc} 1 ${bx.toFixed(2)} ${by.toFixed(2)}`}
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

// ── Bar Chart (Income / Expense / Savings) ────────────────────────────────────

const AnalyticsBarChart: React.FC<{ data: ChartPoint[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)

  if (data.length === 0) {
    return (
      <div style={{
        height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', fontSize: 13, fontStyle: 'italic',
      }}>
        Không có dữ liệu biểu đồ
      </div>
    )
  }

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
  const chartH = 100
  const chartB = 120
  const chartL = 38
  const colW   = Math.max(28, Math.min(52, (270 - chartL) / data.length))
  const barW   = Math.max(6, colW * 0.28)
  const totalW = chartL + colW * data.length + 8
  const ticks  = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxVal)

  return (
    <svg
      viewBox={`0 0 ${totalW} 140`}
      style={{ width: '100%', overflow: 'visible' }}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <style>{`
          @keyframes anlFade { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
          .anl-tt { animation: anlFade 0.16s ease forwards; }
        `}</style>
      </defs>

      {/* Y-axis grid + labels */}
      {ticks.map((v, i) => {
        const y = chartB - (v / maxVal) * chartH
        return (
          <g key={i}>
            <line x1={chartL - 4} y1={y} x2={totalW - 8} y2={y}
              stroke="#374151" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={chartL - 6} y={y + 3.5} fontSize="6.5" fill="#6b7280" textAnchor="end">
              {fmtVND(v)}
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const cx    = chartL + i * colW + colW / 2
        const iH    = Math.max(0, (d.income  / maxVal) * chartH)
        const eH    = Math.max(0, (d.expense / maxVal) * chartH)
        const sH    = Math.max(0, (Math.abs(d.savings) / maxVal) * chartH)
        const sPositive = d.savings >= 0

        return (
          <g key={i}
            onMouseEnter={e => {
              const svg = (e.currentTarget as SVGElement).closest('svg')!
              const rect = svg.getBoundingClientRect()
              setTooltip({ idx: i, x: cx, y: chartB - Math.max(iH, eH) - 8 })
            }}
            style={{ cursor: 'pointer' }}
          >
            {/* Income bar (blue) */}
            <rect
              x={cx - barW * 1.55} y={chartB - iH} width={barW} height={Math.max(1, iH)}
              fill="#4F8EF7" rx="2"
            />
            {/* Expense bar (red) */}
            <rect
              x={cx - barW * 0.4} y={chartB - eH} width={barW} height={Math.max(1, eH)}
              fill="#ef4444" rx="2"
            />
            {/* Savings bar (green/yellow) */}
            <rect
              x={cx + barW * 0.75} y={chartB - sH} width={barW} height={Math.max(1, sH)}
              fill={sPositive ? '#22c55e' : '#f59e0b'} rx="2"
            />
            {/* X-axis label */}
            <text x={cx} y={chartB + 10} fontSize="6.5" fill="#9ca3af" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}

      {/* Axis line */}
      <line x1={chartL - 4} y1={chartB} x2={totalW - 8} y2={chartB} stroke="#374151" strokeWidth="0.8" />

      {/* Tooltip */}
      {tooltip !== null && (
        <g className="anl-tt">
          <rect
            x={Math.min(tooltip.x - 36, totalW - 80)} y={tooltip.y - 38}
            width={76} height={36} rx="5"
            fill="#1f2937" opacity="0.92"
          />
          <text x={Math.min(tooltip.x, totalW - 44)} y={tooltip.y - 26} fontSize="6" fill="#d1fae5" textAnchor="middle">
            ↑ {fmtVND(data[tooltip.idx].income)}
          </text>
          <text x={Math.min(tooltip.x, totalW - 44)} y={tooltip.y - 18} fontSize="6" fill="#fecaca" textAnchor="middle">
            ↓ {fmtVND(data[tooltip.idx].expense)}
          </text>
          <text x={Math.min(tooltip.x, totalW - 44)} y={tooltip.y - 10} fontSize="6" fill="#fde68a" textAnchor="middle">
            = {fmtVND(data[tooltip.idx].savings)}
          </text>
        </g>
      )}

      {/* Legend */}
      <g>
        <rect x={chartL} y={chartB + 16} width={7} height={5} fill="#4F8EF7" rx="1" />
        <text x={chartL + 9} y={chartB + 21} fontSize="6.5" fill="#9ca3af">Thu nhập</text>
        <rect x={chartL + 46} y={chartB + 16} width={7} height={5} fill="#ef4444" rx="1" />
        <text x={chartL + 55} y={chartB + 21} fontSize="6.5" fill="#9ca3af">Chi tiêu</text>
        <rect x={chartL + 88} y={chartB + 16} width={7} height={5} fill="#22c55e" rx="1" />
        <text x={chartL + 97} y={chartB + 21} fontSize="6.5" fill="#9ca3af">Tiết kiệm</text>
      </g>
    </svg>
  )
}

// ── Filter button labels ───────────────────────────────────────────────────────

const RANGE_OPTIONS: { key: RangeType; label: string }[] = [
  { key: 'TODAY',      label: 'Hôm nay'     },
  { key: '7_DAYS',     label: '7 ngày'      },
  { key: 'THIS_MONTH', label: 'Tháng này'   },
  { key: 'LAST_MONTH', label: 'Tháng trước' },
  { key: 'THIS_YEAR',  label: 'Năm nay'     },
  { key: 'CUSTOM',     label: 'Tuỳ chỉnh'   },
]

// ── Main page component ───────────────────────────────────────────────────────

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [range, setRange]         = useState<RangeType>('THIS_MONTH')
  const [customStart, setCustomStart] = useState('')
  const [customEnd,   setCustomEnd]   = useState('')
  const [showCustom, setShowCustom]   = useState(false)

  const [data,    setData]    = useState<AnalyticsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  // Fetch analytics summary
  const fetchSummary = useCallback(async (r: RangeType, cs?: string, ce?: string) => {
    setLoading(true)
    setError('')
    try {
      const params: Record<string, string> = { range_type: r }
      if (r === 'CUSTOM' && cs && ce) {
        params.start_date = cs
        params.end_date   = ce
      }
      const res = await api.get('/v1/analytics/summary', { params })
      setData(res.data as AnalyticsSummary)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(e?.response?.data?.message || e?.message || 'Không thể tải dữ liệu phân tích.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSummary(range)
  }, [fetchSummary, range])

  const handleRangeChange = (r: RangeType) => {
    setRange(r)
    setShowCustom(r === 'CUSTOM')
    if (r !== 'CUSTOM') fetchSummary(r)
  }

  const handleCustomApply = () => {
    if (customStart && customEnd) fetchSummary('CUSTOM', customStart, customEnd)
  }

  // Overview values
  const cur = data?.overview?.current
  const prv = data?.overview?.previous
  const curIncome  = toNum(cur?.income)
  const curExpense = toNum(cur?.expense)
  const prvIncome  = toNum(prv?.income)
  const prvExpense = toNum(prv?.expense)
  const curFlow    = curIncome + curExpense
  const prvFlow    = prvIncome + prvExpense

  const incomeBadge  = pctBadge(data?.overview?.mom_income_change_pct ?? null)
  const expenseBadge = pctBadge(data?.overview?.mom_expense_change_pct ?? null)

  // Skeleton shimmer style
  const shimmer = {
    background: 'linear-gradient(90deg, #2a2a3d 25%, #3a3a52 50%, #2a2a3d 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite linear',
    borderRadius: 8,
  } as React.CSSProperties

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', fontFamily: 'Satoshi, Inter, sans-serif' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #7B51F1 0%, #4F8EF7 100%)',
        padding: '52px 20px 24px',
        position: 'relative',
      }}>
        {/* Notification icon */}
        <button
          onClick={() => navigate('/Notification')}
          style={{
            position: 'absolute', top: 52, right: 20,
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: '50%', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
          aria-label="Thông báo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        <h1 style={{
          color: '#fff', fontSize: 20, fontWeight: 700,
          margin: 0, letterSpacing: '-0.3px',
        }}>
          Phân tích tài chính
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>
          {loading ? 'Đang tải...' : data ? `${data.start_date} → ${data.end_date}` : ''}
        </p>
      </div>

      {/* ── Date range filter ───────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflowX: 'auto', whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleRangeChange(opt.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                border: range === opt.key ? '2px solid #7B51F1' : '2px solid #e5e7eb',
                background: range === opt.key ? '#7B51F1' : '#fff',
                color: range === opt.key ? '#fff' : '#374151',
                cursor: 'pointer', transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date pickers */}
      {showCustom && (
        <div style={{ background: '#fff', padding: '12px 16px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Từ</label>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 13 }} />
          <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Đến</label>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px', fontSize: 13 }} />
          <button onClick={handleCustomApply}
            style={{
              background: '#7B51F1', color: '#fff', border: 'none', borderRadius: 8,
              padding: '5px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
            Áp dụng
          </button>
        </div>
      )}

      <div style={{ padding: '16px 16px 100px' }}>

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {error && !loading && (
          <div style={{
            background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 14,
            padding: '14px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#991B1B', fontWeight: 600 }}>Không thể tải dữ liệu</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#B91C1C' }}>{error}</p>
            </div>
            <button onClick={() => fetchSummary(range, customStart, customEnd)}
              style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Tải lại
            </button>
          </div>
        )}

        {/* ── MoM Overview Card ────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#121212' }}>So sánh kỳ trước</p>
            {!loading && incomeBadge && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: incomeBadge.positive ? '#dcfce7' : '#fee2e2',
                color: incomeBadge.positive ? '#15803d' : '#dc2626',
              }}>
                {incomeBadge.positive ? '↑' : '↓'} {incomeBadge.text}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, ...shimmer, height: 80 }} />
              <div style={{ flex: 1, ...shimmer, height: 80 }} />
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Current period */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#121212', marginBottom: 8 }}>Kỳ này</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 50, height: 50, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: 'rotate(90deg)' }}>
                      <HalfDonut
                        expensePct={curFlow > 0 ? (curExpense / curFlow) * 100 : 0}
                        incomePct={curFlow > 0 ? (curIncome / curFlow) * 100 : 0}
                        isEmpty={curFlow === 0}
                        size={90}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Thu</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{fmtVND(curIncome)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Chi</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{fmtVND(curExpense)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Ròng</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: toNum(cur?.net) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {fmtVND(toNum(cur?.net))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: 1, background: '#f3f4f6' }} />

              {/* Previous period */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Kỳ trước</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 50, height: 50, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ transform: 'rotate(90deg)' }}>
                      <HalfDonut
                        expensePct={prvFlow > 0 ? (prvExpense / prvFlow) * 100 : 0}
                        incomePct={prvFlow > 0 ? (prvIncome / prvFlow) * 100 : 0}
                        isEmpty={prvFlow === 0}
                        size={90}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Thu</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>{fmtVND(prvIncome)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Chi</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>{fmtVND(prvExpense)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: '#6b7280' }}>Ròng</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: toNum(prv?.net) >= 0 ? '#22c55e' : '#ef4444' }}>
                        {fmtVND(toNum(prv?.net))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Bar Chart ────────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#121212' }}>
            Biểu đồ thu chi
          </p>

          {loading ? (
            <div style={{ ...shimmer, height: 150, opacity: 0.5 }} />
          ) : (
            <AnalyticsBarChart data={data?.charts ?? []} />
          )}
        </div>

        {/* ── Top Categories ────────────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '20px 16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#121212' }}>
            Chi tiêu theo danh mục
          </p>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => <div key={i} style={{ ...shimmer, height: 44 }} />)}
            </div>
          ) : !data?.top_categories?.length ? (
            <div style={{
              textAlign: 'center', padding: '28px 0',
              color: '#9ca3af', fontSize: 13, fontStyle: 'italic',
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
              Không có giao dịch trong kỳ này
            </div>
          ) : (
            <>
              {/* Table header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 52px 42px',
                padding: '0 4px 8px', borderBottom: '1px solid #f3f4f6',
              }}>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Danh mục</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textAlign: 'right' }}>Số tiền</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textAlign: 'right' }}>Số GD</span>
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textAlign: 'right' }}>%</span>
              </div>

              {/* Rows */}
              {data.top_categories.map((cat, idx) => (
                <div key={cat.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 52px 42px',
                  padding: '10px 4px',
                  borderBottom: idx < data.top_categories.length - 1 ? '1px solid #f9fafb' : 'none',
                  alignItems: 'center',
                }}>
                  {/* Category name + icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: cat.color || '#7B51F1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>
                      {cat.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#121212', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cat.name}
                      </p>
                      {/* Percentage bar */}
                      <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: '#f3f4f6', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${cat.percentage_spend}%`, background: cat.color || '#7B51F1', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>
                    -{fmtVND(cat.total_spend)}
                  </span>

                  {/* Transaction count — FR-ANL-002: "12 GD" format */}
                  <span style={{ fontSize: 12, color: '#6b7280', textAlign: 'right' }}>
                    {cat.transaction_count} GD
                  </span>

                  {/* Percentage */}
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>
                    {cat.percentage_spend}%
                  </span>
                </div>
              ))}

              {/* Total row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 52px 42px',
                padding: '10px 4px 0',
                borderTop: '2px solid #f3f4f6',
                marginTop: 2,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Tổng chi</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textAlign: 'right' }}>
                  -{fmtFull(data.top_categories.reduce((s, c) => s + c.total_spend, 0))}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>
                  {data.top_categories.reduce((s, c) => s + c.transaction_count, 0)} GD
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', textAlign: 'right' }}>100%</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Bottom Navigation ────────────────────────────────────────────────── */}
      <div className="navigation">
        <ul className="listWrap" style={{ alignItems: 'flex-start' }}>
          {/* Phân tích — active */}
          <li className="list active" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a href="/analytics" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <i className="icon"><img src={icon5} alt="Phân tích" /></i>
              <span className="text" style={{ fontSize: 9, color: '#7B51F1', fontWeight: 700 }}>Phân tích</span>
            </a>
          </li>

          {/* Home */}
          <li className="list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a href="/Home" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <i className="icon"><img src={icon1} alt="Home" /></i>
              <span className="text"></span>
            </a>
          </li>

          {/* Center placeholder (invisible, holds space for FAB) */}
          <li className="list" style={{ visibility: 'hidden', width: '80px', textAlign: 'center' }}>
            <span style={{ fontSize: '8px', display: 'block', marginTop: '44px' }} />
          </li>

          {/* Goals */}
          <li className="list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a href="/BarChart" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <i className="icon"><img src={icon3} alt="Goals" /></i>
              <span className="text"></span>
            </a>
          </li>

          {/* Reports */}
          <li className="list" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <a href="/Invoicing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none' }}>
              <i className="icon"><img src={icon4} alt="Reports" /></i>
              <span className="text"></span>
            </a>
          </li>
        </ul>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}

export default Analytics
