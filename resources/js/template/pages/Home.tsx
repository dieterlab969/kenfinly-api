import React, { useState } from 'react'
import Logo from '../assets/images/setting/logo.png'
import { Link, useNavigate } from 'react-router-dom'
import NotificationIcon from '../assets/svg/notification-icon.svg'
import dotsIcon from '../assets/svg/dots-icon.svg'
import icon1 from '../assets/images/tabbar/icon1.svg'
import icon2 from '../assets/images/tabbar/icon2.svg'
import icon3 from '../assets/images/tabbar/icon3.svg'
import icon4 from '../assets/images/tabbar/icon4.svg'
import Setting from '../components/Setting.tsx'

type SpendingDay = { label: string; amount: number; isSpike?: boolean }
type Transaction = { id: number; emoji: string; name: string; category: string; amount: number }

const SPENDING_7DAYS: SpendingDay[] = [
  { label: 'T2', amount: 1_200_000 },
  { label: 'T3', amount: 850_000 },
  { label: 'T4', amount: 2_100_000 },
  { label: 'T5', amount: 3_800_000 },
  { label: 'T6', amount: 6_342_324, isSpike: true },
  { label: 'T7', amount: 1_500_000 },
  { label: 'CN', amount: 920_000 },
]

const TRANSACTIONS: Transaction[] = [
  { id: 1, emoji: '☕', name: 'Cà phê sáng', category: 'Ẩm thực', amount: -45_000 },
  { id: 2, emoji: '💰', name: 'Lương tháng 06', category: 'Thu nhập', amount: 22_000_000 },
  { id: 3, emoji: '⚡', name: 'Điện lực HCM', category: 'Hóa đơn', amount: -1_250_000 },
  { id: 4, emoji: '🍜', name: 'Kitty Nguyen', category: 'Thu nhập', amount: -45_000 },
  { id: 5, emoji: '💰', name: 'Lương tháng 06', category: 'Thu nhập', amount: 15_000 },
  { id: 6, emoji: '💰', name: 'Lương tháng 06', category: 'Thu nhập', amount: 15_000 },
]

const EXPENSE_CATEGORIES = ['Ăn uống', 'Di chuyển', 'Hóa đơn', 'Mua sắm', 'Sức khỏe', 'Giải trí', 'Khác']

function fmtVND(n: number): string {
  const absStr = Math.abs(n).toLocaleString('vi-VN')
  return (n >= 0 ? '+' : '') + absStr + 'đ'
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
        <text x="50" y="47" fontSize="7" textAnchor="middle" fill="#6b7280">DỮ LIỆU T05</text>
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

const SpendingChart: React.FC = () => {
  const maxVal = 8_000_000
  const chartH = 88, chartB = 108, chartL = 30, barW = 18, colW = 240 / 7

  return (
    <svg viewBox="0 0 278 125" style={{ width: '100%' }} role="img" aria-label="Chi tiêu 7 ngày qua">
      {[0, 2, 4, 6, 8].map((m, i) => {
        const y = chartB - (m / 8) * chartH
        return (
          <g key={i}>
            <line x1={chartL - 4} y1={y} x2={272} y2={y} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={chartL - 6} y={y + 3} fontSize="7.5" textAnchor="end" fill="#9ca3af">{m}M</text>
          </g>
        )
      })}
      {SPENDING_7DAYS.map((d, i) => {
        const barH = Math.max((d.amount / maxVal) * chartH, 3)
        const cx2 = chartL + i * colW + colW / 2
        const barX = cx2 - barW / 2
        const barY = chartB - barH
        return (
          <g key={i}>
            <rect x={barX} y={barY} width={barW} height={barH} rx="4" ry="4"
              fill={d.isSpike ? '#ef4444' : '#7B51F1'} fillOpacity={d.isSpike ? 1 : 0.6} />
            {d.isSpike && (
              <g>
                <rect x={barX - 22} y={barY - 38} width={84} height={32} rx="5" fill="#1f2937" />
                <text x={cx2 + 3} y={barY - 25} fontSize="7" textAnchor="middle" fill="#d1d5db">Thứ 6</text>
                <text x={cx2 + 3} y={barY - 12} fontSize="7.5" textAnchor="middle" fill="#fbbf24" fontWeight="bold">6.342.324 đ</text>
                <polygon points={`${barX + 2},${barY - 6} ${cx2 + 3},${barY - 1} ${barX + barW},${barY - 6}`} fill="#1f2937" />
              </g>
            )}
            <text x={cx2} y={chartB + 13} fontSize="7.5" textAnchor="middle" fill="#6b7280">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

const HistoricalChart: React.FC = () => {
  const pts = [
    { x: 22, y: 18 },
    { x: 68, y: 82, tooltip: true },
    { x: 118, y: 87 },
    { x: 185, y: 80 },
    { x: 252, y: 78 },
  ]
  const poly = pts.map(p => `${p.x},${p.y}`).join(' ')
  const tip = pts.find(p => p.tooltip)!

  return (
    <svg viewBox="0 0 275 130" style={{ width: '100%' }} role="img" aria-label="Số dư lịch sử">
      <defs>
        <linearGradient id="histGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7B51F1" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#7B51F1" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[
        { v: '-568M', y: 18 }, { v: '-764M', y: 40 },
        { v: '-944M', y: 62 }, { v: '-1094M', y: 84 },
      ].map((item, i) => (
        <g key={i}>
          <line x1="20" y1={item.y} x2="268" y2={item.y} stroke="#e5e7eb" strokeWidth="0.4" strokeDasharray="3 3" />
          <text x="17" y={item.y + 3} fontSize="6" textAnchor="end" fill="#9ca3af">{item.v}</text>
        </g>
      ))}
      <polygon points={`22,104 ${poly} 252,104`} fill="url(#histGrad)" />
      <polyline points={poly} fill="none" stroke="#7B51F1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5"
          fill={p.tooltip ? '#7B51F1' : '#fff'} stroke="#7B51F1" strokeWidth="1.5" />
      ))}
      <rect x={tip.x - 26} y={tip.y - 54} width={82} height={38} rx="6" fill="#1f2937" />
      <text x={tip.x + 15} y={tip.y - 38} fontSize="6.5" textAnchor="middle" fill="#d1d5db">Tháng 01, 2026</text>
      <text x={tip.x + 15} y={tip.y - 27} fontSize="6.5" textAnchor="middle" fill="#fbbf24" fontWeight="bold">Số dư:</text>
      <text x={tip.x + 15} y={tip.y - 16} fontSize="6" textAnchor="middle" fill="#fbbf24">-1.044.880.843 đ</text>
      <polygon points={`${tip.x - 1},${tip.y - 16} ${tip.x + 4},${tip.y - 16} ${tip.x + 1},${tip.y - 10}`} fill="#1f2937" />
      {[
        { x: 22, label: 'T12 2025' }, { x: 118, label: 'T02 2026' },
        { x: 185, label: 'T04 2026' }, { x: 252, label: 'T06 2026' },
      ].map((item, i) => (
        <text key={i} x={item.x} y={118} fontSize="6.5" textAnchor="middle" fill="#9ca3af">{item.label}</text>
      ))}
    </svg>
  )
}

const S: Record<string, React.CSSProperties> = {
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
    fontFamily: 'Poppins, sans-serif',
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
  const [fabOpen, setFabOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [note, setNote] = useState('')
  const [recurring, setRecurring] = useState(false)

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
                  Chào Jessica,
                </p>
                <h1 style={{
                  color: '#fff', fontSize: '28px', fontWeight: 800,
                  marginTop: '4px', letterSpacing: '-0.5px', fontFamily: 'Poppins, sans-serif',
                }}>
                  -1.048.546.322 đ
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

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Sơ lược</span>
                  <span style={{ color: '#9ca3af', fontSize: '18px', cursor: 'pointer', letterSpacing: '2px' }}>···</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <MonthCol
                    title="Tháng Này" sub="Tháng 06, 2026"
                    expensePct={87} incomePct={13}
                    income="15.993k đ" expense="-308.825k đ" total="-292.832k đ"
                    incomeColor="#22c55e" expenseColor="#ef4444" totalColor="#ef4444"
                  />
                  <div style={{ width: '1px', background: '#e5e7eb', margin: '0 4px', alignSelf: 'stretch' }} />
                  <MonthCol
                    title="Tháng Trước" sub="Tháng 05, 2026"
                    expensePct={0} incomePct={0} isEmpty
                    income="0 đ" expense="0 đ" total="0 đ"
                    incomeColor="#9ca3af" expenseColor="#9ca3af" totalColor="#9ca3af"
                  />
                </div>
              </div>

              <div style={S.card}>
                <div style={S.cardHeader}>
                  <span style={S.cardTitle}>Chi tiêu - 7 ngày qua</span>
                  <span style={{ fontSize: '18px', cursor: 'pointer' }}>📅</span>
                </div>
                <SpendingChart />
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
                  }}>-568M ▾</span>
                </div>
                <HistoricalChart />
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
                  {TRANSACTIONS.map(tx => (
                    <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                        background: tx.amount >= 0 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.10)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                      }}>
                        {tx.emoji}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: '14px', fontWeight: 600, color: '#121212',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          fontFamily: 'Satoshi, sans-serif',
                        }}>{tx.name}</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{tx.category}</p>
                      </div>
                      <span style={{
                        fontSize: '14px', fontWeight: 700, flexShrink: 0,
                        color: tx.amount >= 0 ? '#22c55e' : '#ef4444',
                        fontFamily: 'Satoshi, sans-serif',
                      }}>
                        {fmtVND(tx.amount)}
                      </span>
                    </div>
                  ))}
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
                onClick={() => setFabOpen(false)}
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
                onClick={() => { setFabOpen(false); setShowModal(true) }}
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
            {([
              { to: '/Home', icon: icon1, label: 'Trang chủ', active: true },
              { to: '/Activity', icon: icon2, label: 'Phân tích', active: false },
              { to: null, icon: null, label: 'THÊM NHANH', center: true },
              { to: '/BarChart', icon: icon3, label: 'Mục tiêu', active: false },
              { to: '/Invoicing', icon: icon4, label: 'Báo cáo', active: false },
            ] as const).map((item, i) => {
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
                <p style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444', letterSpacing: '0.5px' }}>CHI TIÊU</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#7B51F1', border: 'none', color: '#fff',
                  padding: '8px 18px', borderRadius: '20px',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                }}
              >Lưu</button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '14px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{
                width: '70px', height: '48px', borderRadius: '12px', background: '#e5e7eb',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <HalfDonut expensePct={0} incomePct={0} isEmpty size={64} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, marginBottom: '6px', letterSpacing: '1px' }}>SƠ LƯỢC</p>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {[
                    { label: 'Thu nhập:', val: '0đ', color: '#22c55e' },
                    { label: 'Chi phí:', val: '0đ', color: '#ef4444' },
                    { label: 'Tổng cộng:', val: '0đ', color: '#121212' },
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
              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Số tiền</label>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  border: '1.5px solid #e5e7eb', borderRadius: '14px', padding: '0 16px',
                  background: '#fff',
                }}>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: '28px', fontWeight: 800, padding: '12px 0',
                      background: 'transparent', color: '#121212', fontFamily: 'Poppins, sans-serif',
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
                    style={{ ...S.inputBase, appearance: 'none', paddingRight: '36px' }}
                  >
                    <option value="">Chọn hạng mục</option>
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span style={{
                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                    pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                  }}>▾</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Ngày</label>
                <div style={{
                  ...S.inputBase,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>06/10/2026</span>
                  <span style={{ fontSize: '18px' }}>📅</span>
                </div>
              </div>

              <div style={S.fieldWrap}>
                <label style={S.fieldLabel}>Ghi chú</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Thêm ghi chú..."
                  style={S.inputBase}
                />
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', border: '1.5px solid #e5e7eb', borderRadius: '14px',
                marginBottom: '32px',
              }}>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#121212' }}>Định kỳ</p>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Lặp lại giao dịch này</p>
                </div>
                <div
                  onClick={() => setRecurring(r => !r)}
                  style={{
                    width: '48px', height: '28px', borderRadius: '14px',
                    background: recurring ? '#7B51F1' : '#e5e7eb',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.22s ease',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '4px',
                    left: recurring ? '24px' : '4px',
                    width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.22)', transition: 'left 0.22s ease',
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
