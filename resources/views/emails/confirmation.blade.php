<div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
    <h2 style="color: #333;">Hello {{ $name }},</h2>

    <p>Great news! Your email address has been successfully verified.</p>

    <p>Your account is now active and you can access all features of {{ $appName }}.</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $loginUrl }}"
           style="background-color: #5856d6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Sign In Now
        </a>
    </div>

    <p>Here's what you can do next:</p>
    <ul>
        <li>Set up your financial accounts</li>
        <li>Start tracking your expenses</li>
        <li>Create budgets and financial goals</li>
        <li>Explore our premium features</li>
    </ul>

    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
        If you didn't register for a {{ $appName }} account, please contact us immediately.
    </p>
</div>

<div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
    <p>&copy; 2025 {{ $appName }}. All rights reserved.</p>
</div>
