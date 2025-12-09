<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Class SendGridService
 */
class SendGridService
{
    /**
     * @var string|null
     */
    private ?string $apiKey = null;
    /**
     * @var string|null
     */
    private ?string $fromEmail = null;

    /**
     *
     */
    public function __construct()
    {
        $this->initializeCredentials();
    }

    /**
     * @return void
     */
    private function initializeCredentials(): void
    {
        try {
            $this->apiKey = env('SENDGRID_API_KEY');
            $this->fromEmail = env('SENDGRID_FROM_EMAIL');

            if ($this->apiKey && $this->fromEmail) {
                return;
            }

            $hostname = env('REPLIT_CONNECTORS_HOSTNAME');
            $xReplitToken = env('REPL_IDENTITY')
                ? 'repl ' . env('REPL_IDENTITY')
                : (env('WEB_REPL_RENEWAL')
                    ? 'depl ' . env('WEB_REPL_RENEWAL')
                    : null);

            if ($xReplitToken && $hostname) {
                $response = Http::withHeaders([
                    'Accept' => 'application/json',
                    'X_REPLIT_TOKEN' => $xReplitToken
                ])->get('https://' . $hostname . '/api/v2/connection?include_secrets=true&connector_names=sendgrid');

                $data = $response->json();
                $connectionSettings = $data['items'][0] ?? null;

                if ($connectionSettings &&
                    isset($connectionSettings['settings']['api_key']) &&
                    isset($connectionSettings['settings']['from_email'])) {
                    $this->apiKey = $connectionSettings['settings']['api_key'];
                    $this->fromEmail = $connectionSettings['settings']['from_email'];
                    return;
                }
            }

            if (!$this->apiKey || !$this->fromEmail) {
                Log::warning('SendGrid credentials not configured. Email functionality will be disabled.');
            }

        } catch (\Exception $e) {
            Log::error('Failed to initialize SendGrid credentials', [
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * @param string $to
     * @param string $name
     * @param string $verificationUrl
     * @param $expiresAt
     * @return void
     * @throws \Exception
     */
    public function sendVerificationEmail(string $to, string $name, string $verificationUrl, $expiresAt): void
    {
        $subject = 'Verify Your Email Address';
        $htmlContent = $this->getVerificationEmailTemplate($name, $verificationUrl, $expiresAt);

        $this->sendEmail($to, $subject, $htmlContent);
    }

    /**
     * @param string $to
     * @param string $name
     * @return void
     * @throws \Exception
     */
    public function sendConfirmationEmail(string $to, string $name): void
    {
        $subject = 'Email Verified Successfully';
        $htmlContent = $this->getConfirmationEmailTemplate($name);

        $this->sendEmail($to, $subject, $htmlContent);
    }

    /**
     * @param string $to
     * @param string $subject
     * @param string $htmlContent
     * @return void
     * @throws \Illuminate\Http\Client\ConnectionException
     */
    private function sendEmail(string $to, string $subject, string $htmlContent): void
    {
        if (!$this->apiKey || !$this->fromEmail) {
            Log::warning('Skipping email send - SendGrid credentials not configured', [
                'to' => $to,
                'subject' => $subject
            ]);
            return;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post('https://api.sendgrid.com/v3/mail/send', [
                'personalizations' => [
                    [
                        'to' => [
                            ['email' => $to]
                        ],
                        'subject' => $subject
                    ]
                ],
                'from' => [
                    'email' => $this->fromEmail,
                    'name' => config('app.name', 'Kenfinly')
                ],
                'content' => [
                    [
                        'type' => 'text/html',
                        'value' => $htmlContent
                    ]
                ]
            ]);

            if (!$response->successful()) {
                throw new \Exception('SendGrid API error: ' . $response->body());
            }

            Log::info('Email sent successfully via SendGrid', [
                'to' => $to,
                'subject' => $subject
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send email via SendGrid', [
                'to' => $to,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * @param string $name
     * @param string $verificationUrl
     * @param $expiresAt
     * @return string
     */
    private function getVerificationEmailTemplate(string $name, string $verificationUrl, $expiresAt): string
    {
        $appName = config('app.name', 'Kenfinly');
        $expirationTime = $expiresAt->format('F j, Y \a\t g:i A');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #5856d6; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to {$appName}!</h1>
    </div>

    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #333;">Hello {$name},</h2>

        <p>Thank you for registering with {$appName}! To complete your registration and start using our platform, please verify your email address.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{$verificationUrl}"
               style="background-color: #5856d6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Verify Email Address
            </a>
        </div>

        <p>Or copy and paste this link into your browser:</p>
        <p style="background-color: #fff; padding: 10px; border: 1px solid #ddd; word-break: break-all; font-size: 12px;">
            {$verificationUrl}
        </p>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>⚠️ Important:</strong> This verification link will expire on <strong>{$expirationTime}</strong>.</p>
        </div>

        <p>If you didn't create an account with {$appName}, please ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="font-size: 12px; color: #666;">
            For security reasons, never share this email or verification link with anyone.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
        <p>&copy; 2025 {$appName}. All rights reserved.</p>
    </div>
</body>
</html>
HTML;
    }

    /**
     * @param string $name
     * @return string
     */
    private function getConfirmationEmailTemplate(string $name): string
    {
        $appName = config('app.name', 'Kenfinly');
        $loginUrl = env('FRONTEND_URL', env('APP_URL')) . '/login';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #28a745; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;">
        <h1 style="color: white; margin: 0;">✓ Email Verified!</h1>
    </div>

    <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px;">
        <h2 style="color: #333;">Hello {$name},</h2>

        <p>Great news! Your email address has been successfully verified.</p>

        <p>Your account is now active and you can access all features of {$appName}.</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{$loginUrl}"
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
            If you didn't register for a {$appName} account, please contact us immediately.
        </p>
    </div>

    <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
        <p>&copy; 2025 {$appName}. All rights reserved.</p>
    </div>
</body>
</html>
HTML;
    }
}
