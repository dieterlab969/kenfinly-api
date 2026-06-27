<div style="background-color: #f4f4f8; padding: 30px; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">

        {{-- Header --}}
        <div style="background: linear-gradient(135deg, #7B51F1 0%, #5856d6 100%); padding: 32px 36px 28px;">
            <p style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                🔔 Subscription Renewal Reminder
            </p>
            <p style="margin: 6px 0 0; font-size: 14px; color: rgba(255,255,255,0.8);">
                {{ $appName }}
            </p>
        </div>

        {{-- Body --}}
        <div style="padding: 32px 36px;">

            <p style="margin: 0 0 20px; font-size: 16px; color: #333333; line-height: 1.6;">
                Hi <strong>{{ $name }}</strong>,
            </p>

            <p style="margin: 0 0 24px; font-size: 15px; color: #555555; line-height: 1.7;">
                Just a friendly heads-up — your <strong>{{ $serviceName }}</strong> subscription
                is set to renew in <strong>{{ $remindBeforeDays }} day(s)</strong>.
            </p>

            {{-- Subscription card --}}
            <div style="background: #f8f7ff; border: 1.5px solid #e4dafd; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #888888; width: 45%;">Service</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #222222; font-weight: 600;">{{ $serviceName }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #888888;">Amount</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #222222; font-weight: 600;">
                            @if($currency === 'VND')
                                {{ number_format($amount, 0, '.', ',') }} VND
                            @else
                                ${{ number_format($amount, 2) }}
                            @endif
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #888888;">Billing Cycle</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #222222; font-weight: 600;">{{ ucfirst(strtolower($billingCycle)) }}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #888888;">Renewal Date</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #7B51F1; font-weight: 700;">
                            {{ $nextBillingDate->format('F j, Y') }}
                        </td>
                    </tr>
                </table>
            </div>

            {{-- CTA --}}
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="{{ $appUrl }}/Subscription"
                   style="display: inline-block; background: linear-gradient(135deg, #7B51F1, #5856d6);
                          color: #ffffff; text-decoration: none; padding: 13px 32px;
                          border-radius: 8px; font-size: 15px; font-weight: 700;
                          letter-spacing: 0.2px; box-shadow: 0 3px 10px rgba(123,81,241,0.35);">
                    Manage My Subscriptions
                </a>
            </div>

            <p style="margin: 0; font-size: 13px; color: #999999; line-height: 1.6;">
                If you no longer need this subscription, make sure to cancel it before the renewal date to avoid unwanted charges.
            </p>
        </div>

        {{-- Footer --}}
        <div style="background: #f9f9fb; border-top: 1px solid #ebebef; padding: 20px 36px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #aaaaaa; line-height: 1.6;">
                You are receiving this because you enabled renewal reminders in {{ $appName }}.<br>
                &copy; {{ date('Y') }} {{ $appName }}. All rights reserved.
            </p>
        </div>

    </div>
</div>
