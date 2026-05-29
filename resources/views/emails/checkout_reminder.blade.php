<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Halo Check-out Reminder</title>
    <style>
        body { margin: 0; padding: 0; background: #0a1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #e5e7eb; }
        .wrapper { max-width: 560px; margin: 40px auto; background: #112240; border: 1px solid #1e3a5f; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0d3d2e 0%, #0a2a1f 100%); padding: 32px 36px 24px; text-align: center; border-bottom: 1px solid #1e3529; }
        .ring-icon { width: 64px; height: 64px; margin: 0 auto 16px; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #4ade80; letter-spacing: -0.02em; }
        .header p { margin: 8px 0 0; font-size: 13px; color: #86efac; }
        .body { padding: 32px 36px; }
        .greeting { font-size: 16px; font-weight: 600; color: #f3f4f6; margin-bottom: 16px; }
        .message { font-size: 14px; line-height: 1.7; color: #9ca3af; margin-bottom: 24px; }
        .alert-box { background: #1a1a0a; border: 1px solid #d97706; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
        .alert-box .alert-title { font-size: 13px; font-weight: 700; color: #fbbf24; margin: 0 0 6px; }
        .alert-box .alert-body { font-size: 13px; color: #d97706; margin: 0; line-height: 1.5; }
        .cta-btn { display: block; width: fit-content; margin: 0 auto 8px; background: #22c55e; color: #052e16; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; letter-spacing: 0.03em; }
        .reminder-count { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 28px; }
        .consequence { background: #1a0a0a; border: 1px solid #7f1d1d; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; }
        .consequence p { margin: 0; font-size: 13px; color: #f87171; line-height: 1.5; }
        .footer { border-top: 1px solid #1e3a5f; padding: 20px 36px; text-align: center; font-size: 11px; color: #4b5563; }
        .footer strong { color: #6b7280; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <svg class="ring-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="26" stroke="#1e3529" stroke-width="6"/>
                <circle cx="32" cy="32" r="26" stroke="#22c55e" stroke-width="6"
                    stroke-linecap="round" stroke-dasharray="163" stroke-dashoffset="82"
                    transform="rotate(-90 32 32)"
                    style="filter: drop-shadow(0 0 4px #22c55e)"/>
            </svg>
            <h1>⚡ Halo Check-out Reminder</h1>
            <p>{{ $appName }}</p>
        </div>

        <div class="body">
            <p class="greeting">Hey {{ $userName }},</p>

            <p class="message">
                You still have an active Halo session open from today. The check-out
                deadline is <strong style="color:#fbbf24;">8:00 PM</strong>. If you don't
                check out in time, your attendance circle for today will be forfeited.
            </p>

            <div class="alert-box">
                <p class="alert-title">⏰ Action Required</p>
                <p class="alert-body">
                    Open the Kenfinly app, go to your Halo Dashboard, and tap
                    <strong>DONE</strong> to complete today's session.
                </p>
            </div>

            <a href="{{ $appUrl }}/halo" class="cta-btn">Complete My Session →</a>
            <p class="reminder-count">Reminder {{ $reminderNumber }} of 2</p>

            @if ($reminderNumber >= 2)
            <div class="consequence">
                <p>
                    <strong>This is your final reminder.</strong> If your session is not
                    completed by 10:00 PM, the system will automatically forfeit your
                    attendance circle for today.
                </p>
            </div>
            @endif

            <p class="message" style="font-size:13px; color:#6b7280;">
                The Halo system enforces real-world attendance discipline. Consistent
                check-out behaviour strengthens your streak and protects your Halo Points.
            </p>
        </div>

        <div class="footer">
            <strong>{{ $appName }}</strong> &mdash; The Currency of Sovereignty<br>
            You are receiving this email because you have an active Halo session.<br>
            Getkenka Ltd · 81 CMT8 Street, Ben Thanh Ward, Dist 1, HCMC
        </div>
    </div>
</body>
</html>
