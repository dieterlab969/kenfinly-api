<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pricing — {{ config('app.name', 'Kenfinly') }}</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $favicon = \App\Models\AppSetting::where('key', 'favicon')->value('value');
    @endphp
    @if($favicon && file_exists(public_path('storage/' . $favicon)))
        <link rel="icon" href="{{ asset('storage/' . $favicon) }}">
    @else
        <link rel="icon" href="{{ asset('favicon.png') }}">
    @endif
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
        }

        /* ── Navbar ── */
        .navbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 2rem;
            background: rgba(15,23,42,0.9);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(99,102,241,0.2);
            position: sticky;
            top: 0;
            z-index: 50;
        }
        .navbar-logo img { height: 36px; }
        .navbar-logo span {
            font-size: 1.4rem;
            font-weight: 700;
            color: #818cf8;
            letter-spacing: -0.5px;
        }
        .navbar-links { display: flex; gap: 1rem; }
        .navbar-links a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 0.9rem;
            padding: 0.4rem 0.9rem;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .navbar-links a:hover { color: #e2e8f0; background: rgba(99,102,241,0.15); }
        .btn-nav-login {
            background: #4f46e5;
            color: #fff !important;
            font-weight: 600;
        }
        .btn-nav-login:hover { background: #4338ca !important; }

        /* ── Hero ── */
        .hero {
            text-align: center;
            padding: 5rem 1rem 3rem;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.4);
            color: #818cf8;
            font-size: 0.8rem;
            font-weight: 600;
            padding: 0.35rem 0.9rem;
            border-radius: 999px;
            margin-bottom: 1.5rem;
            letter-spacing: 0.03em;
            text-transform: uppercase;
        }
        .hero h1 {
            font-size: clamp(2rem, 5vw, 3.2rem);
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #e2e8f0 30%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .hero p {
            color: #94a3b8;
            font-size: 1.1rem;
            max-width: 520px;
            margin: 0 auto 0.5rem;
        }
        .trial-note {
            color: #4ade80;
            font-size: 0.85rem;
            font-weight: 600;
            margin-top: 0.5rem;
        }

        /* ── Flash messages ── */
        .flash {
            max-width: 480px;
            margin: 0 auto 1rem;
            padding: 0.8rem 1.2rem;
            border-radius: 10px;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: center;
        }
        .flash-success { background: rgba(74,222,128,0.12); border: 1px solid rgba(74,222,128,0.35); color: #4ade80; }
        .flash-cancel  { background: rgba(251,191,36,0.12); border: 1px solid rgba(251,191,36,0.35); color: #fbbf24; }
        .flash-error   { background: rgba(248,113,113,0.12); border: 1px solid rgba(248,113,113,0.35); color: #f87171; }

        /* ── Cards ── */
        .cards-wrapper {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            justify-content: center;
            padding: 1rem 1.5rem 5rem;
            max-width: 1100px;
            margin: 0 auto;
        }

        .card {
            background: #1e293b;
            border: 1px solid rgba(99,102,241,0.2);
            border-radius: 18px;
            padding: 2rem 1.8rem;
            width: 320px;
            display: flex;
            flex-direction: column;
            transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
            position: relative;
            overflow: hidden;
        }
        .card:hover {
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        /* Featured card */
        .card.featured {
            border-color: #4f46e5;
            background: linear-gradient(160deg, #1e1b4b 0%, #1e293b 100%);
            box-shadow: 0 0 0 1px #4f46e5, 0 8px 32px rgba(79,70,229,0.25);
        }
        .card.featured:hover {
            box-shadow: 0 0 0 1px #4f46e5, 0 24px 48px rgba(79,70,229,0.35);
        }
        .popular-badge {
            position: absolute;
            top: 0;
            right: 1.5rem;
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            color: #fff;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            padding: 0.3rem 0.8rem;
            border-radius: 0 0 10px 10px;
        }

        .plan-icon {
            font-size: 2rem;
            margin-bottom: 0.8rem;
        }
        .plan-name {
            font-size: 1.2rem;
            font-weight: 700;
            color: #e2e8f0;
            margin-bottom: 0.3rem;
        }
        .plan-desc {
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 1.5rem;
        }

        .price-block { margin-bottom: 1.8rem; }
        .price-amount {
            font-size: 2.4rem;
            font-weight: 800;
            color: #e2e8f0;
            line-height: 1;
        }
        .price-amount.free { color: #4ade80; }
        .price-currency {
            font-size: 1rem;
            color: #94a3b8;
            margin-right: 2px;
        }
        .price-period {
            font-size: 0.85rem;
            color: #64748b;
            margin-top: 0.2rem;
        }
        .price-saving {
            font-size: 0.78rem;
            color: #4ade80;
            font-weight: 600;
            margin-top: 0.3rem;
        }

        .divider {
            height: 1px;
            background: rgba(99,102,241,0.15);
            margin-bottom: 1.5rem;
        }

        .features-list {
            list-style: none;
            flex: 1;
            margin-bottom: 2rem;
        }
        .features-list li {
            display: flex;
            align-items: flex-start;
            gap: 0.6rem;
            font-size: 0.88rem;
            color: #cbd5e1;
            padding: 0.35rem 0;
        }
        .features-list li .check {
            color: #4ade80;
            font-size: 0.9rem;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .features-list li .cross {
            color: #475569;
            font-size: 0.9rem;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .features-list li.disabled { color: #475569; }

        /* Buttons */
        .btn {
            display: block;
            width: 100%;
            padding: 0.85rem 1rem;
            border-radius: 10px;
            font-size: 0.95rem;
            font-weight: 700;
            text-align: center;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            text-decoration: none;
        }
        .btn-free {
            background: rgba(99,102,241,0.12);
            border: 1px solid rgba(99,102,241,0.3);
            color: #818cf8;
        }
        .btn-free:hover {
            background: rgba(99,102,241,0.2);
            border-color: rgba(99,102,241,0.5);
        }
        .btn-primary {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            color: #fff;
            box-shadow: 0 4px 15px rgba(79,70,229,0.35);
        }
        .btn-primary:hover {
            background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
            box-shadow: 0 6px 20px rgba(79,70,229,0.5);
            transform: translateY(-1px);
        }
        .btn-secondary {
            background: rgba(30,41,59,0.6);
            border: 1px solid rgba(99,102,241,0.25);
            color: #818cf8;
        }
        .btn-secondary:hover {
            background: rgba(79,70,229,0.15);
            border-color: rgba(99,102,241,0.5);
        }

        /* Loading state */
        .btn.loading { opacity: 0.7; pointer-events: none; }
        .btn.loading::after {
            content: ' ⏳';
        }

        /* Error inline */
        .inline-error {
            display: none;
            color: #f87171;
            font-size: 0.8rem;
            text-align: center;
            margin-top: 0.6rem;
        }

        /* FAQ strip */
        .faq-strip {
            text-align: center;
            padding: 0 1.5rem 4rem;
            color: #64748b;
            font-size: 0.88rem;
        }
        .faq-strip a { color: #818cf8; text-decoration: none; }
        .faq-strip a:hover { text-decoration: underline; }

        @media (max-width: 640px) {
            .cards-wrapper { gap: 1rem; }
            .card { width: 100%; max-width: 360px; }
        }
    </style>
</head>
<body>

<!-- Navbar -->
<nav class="navbar">
    <a href="/" class="navbar-logo" style="text-decoration:none;display:flex;align-items:center;gap:0.5rem;">
        @if(file_exists(public_path('logos/logo-white.png')))
            <img src="{{ asset('logos/logo-white.png') }}" alt="{{ config('app.name') }}">
        @else
            <span>{{ config('app.name', 'Kenfinly') }}</span>
        @endif
    </a>
    <div class="navbar-links">
        <a href="/">Home</a>
        <a href="/pricing" style="color:#818cf8;">Pricing</a>
        <a href="/login" class="btn-nav-login">Sign In</a>
    </div>
</nav>

<!-- Hero -->
<section class="hero">
    <div class="badge">💎 Pricing Plans</div>
    <h1>Simple, Transparent Pricing</h1>
    <p>Start free, upgrade when you need more. Cancel anytime.</p>
    <p class="trial-note">✓ All new accounts get a 7-day free trial of Pro features</p>

    @php
        $payment = request('payment');
    @endphp
    @if($payment === 'success')
        <div class="flash flash-success" style="margin-top:1.5rem;">
            🎉 Payment successful! Your subscription is now active.
        </div>
    @elseif($payment === 'cancelled')
        <div class="flash flash-cancel" style="margin-top:1.5rem;">
            ⚠️ Payment was cancelled. Your plan has not changed.
        </div>
    @endif
</section>

<!-- Pricing Cards -->
<div class="cards-wrapper">

    <!-- FREE -->
    <div class="card">
        <div class="plan-icon">🆓</div>
        <div class="plan-name">Forever Free</div>
        <div class="plan-desc">Essential tools to get you started</div>

        <div class="price-block">
            <div class="price-amount free">Free</div>
            <div class="price-period">No credit card required</div>
        </div>

        <div class="divider"></div>

        <ul class="features-list">
            <li><span class="check">✓</span> Expense &amp; income tracking</li>
            <li><span class="check">✓</span> 1 wallet account</li>
            <li><span class="check">✓</span> Basic categories</li>
            <li><span class="check">✓</span> 7-day transaction history</li>
            <li class="disabled"><span class="cross">✗</span> Multi-account support</li>
            <li class="disabled"><span class="cross">✗</span> Advanced analytics</li>
            <li class="disabled"><span class="cross">✗</span> Report exports</li>
            <li class="disabled"><span class="cross">✗</span> Budget planning</li>
        </ul>

        <a href="/login" class="btn btn-free">Get Started Free</a>
    </div>

    <!-- MONTHLY (Featured) -->
    <div class="card featured">
        <div class="popular-badge">Most Popular</div>
        <div class="plan-icon">🚀</div>
        <div class="plan-name">Monthly Pro</div>
        <div class="plan-desc">Full power, billed monthly</div>

        <div class="price-block">
            <div style="display:flex;align-items:baseline;gap:0.2rem;">
                <span class="price-amount">
                    <span class="price-currency">₫</span>{{ number_format(config('payos.plans.monthly.amount')) }}
                </span>
            </div>
            <div class="price-period">per month · VND</div>
        </div>

        <div class="divider"></div>

        <ul class="features-list">
            <li><span class="check">✓</span> Everything in Free</li>
            <li><span class="check">✓</span> Unlimited wallet accounts</li>
            <li><span class="check">✓</span> Multi-currency support</li>
            <li><span class="check">✓</span> Advanced analytics &amp; charts</li>
            <li><span class="check">✓</span> Budget planning &amp; goals</li>
            <li><span class="check">✓</span> CSV import &amp; export</li>
            <li><span class="check">✓</span> Saving habit tracker</li>
            <li><span class="check">✓</span> Priority support</li>
        </ul>

        <button class="btn btn-primary" onclick="buyPlan('monthly', this)">Buy Now — Monthly</button>
        <div class="inline-error" id="err-monthly"></div>
    </div>

    <!-- YEARLY -->
    <div class="card">
        <div class="plan-icon">🏆</div>
        <div class="plan-name">Yearly Pro</div>
        <div class="plan-desc">Best value for power users</div>

        <div class="price-block">
            <div style="display:flex;align-items:baseline;gap:0.2rem;">
                <span class="price-amount">
                    <span class="price-currency">₫</span>{{ number_format(config('payos.plans.yearly.amount')) }}
                </span>
            </div>
            <div class="price-period">per year · VND</div>
            <div class="price-saving">
                💰 Save ~{{ round(100 - (config('payos.plans.yearly.amount') / (config('payos.plans.monthly.amount') * 12)) * 100) }}% vs monthly
            </div>
        </div>

        <div class="divider"></div>

        <ul class="features-list">
            <li><span class="check">✓</span> Everything in Monthly Pro</li>
            <li><span class="check">✓</span> 12 months for the price of ~{{ floor(config('payos.plans.yearly.amount') / config('payos.plans.monthly.amount')) }}</li>
            <li><span class="check">✓</span> Early access to new features</li>
            <li><span class="check">✓</span> Dedicated support channel</li>
            <li><span class="check">✓</span> Team collaboration (coming soon)</li>
            <li><span class="check">✓</span> API access (coming soon)</li>
            <li><span class="check">✓</span> Custom report builder</li>
            <li><span class="check">✓</span> Audit trail &amp; history</li>
        </ul>

        <button class="btn btn-primary" style="background:linear-gradient(135deg,#0f766e,#0891b2);" onclick="buyPlan('yearly', this)">Buy Now — Yearly</button>
        <div class="inline-error" id="err-yearly"></div>
    </div>

</div>

<div class="faq-strip">
    All payments are processed securely via <strong style="color:#e2e8f0;">PayOS / VietQR</strong>. &nbsp;
    Questions? <a href="mailto:{{ config('mail.from.address', 'purchasevn@getkenka.com') }}">Contact us</a>
</div>

<script>
    async function buyPlan(plan, btn) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        if (!token) {
            window.location.href = '/login?redirect=pricing&plan=' + plan;
            return;
        }

        btn.classList.add('loading');
        const errEl = document.getElementById('err-' + plan);
        errEl.style.display = 'none';

        try {
            const res = await fetch('/api/payment/payos/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Failed to create payment link.');
            }

            window.location.href = data.checkout_url;
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
            btn.classList.remove('loading');
        }
    }
</script>
</body>
</html>
