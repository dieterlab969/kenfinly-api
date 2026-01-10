<div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
    <h2 style="color: #333;">Hello {{ $name }},</h2>

    <p>Thank you for registering with {{ $appName }}! To complete your registration and start using our platform, please verify your email address.</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $verificationUrl }}"
           style="background-color: #5856d6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email Address
        </a>
    </div>

    <p>Or copy and paste this link into your browser:</p>
    <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all; font-size: 12px;">
        {{ $verificationUrl }}
    </p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <p style="margin: 0;"><strong>⚠️ Important:</strong> This verification link will expire on <strong>{{ $expiresAt->format('F j, Y \a\t g:i A') }}</strong>.</p>
    </div>

    <p>If you didn't create an account with {{ $appName }}, please ignore this email.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
        For security reasons, never share this email or verification link with anyone.
    </p>
</div>

<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    <p>&copy; 2025 {{ $appName }}. All rights reserved.</p>
</div>