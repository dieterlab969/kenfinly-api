<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;

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
     * @param \DateTimeInterface $expiresAt
     * @return void
     * @throws \Exception
     */
    public function sendVerificationEmail(string $to, string $name, string $verificationUrl, \DateTimeInterface $expiresAt): void
    {
        $subject = 'Verify Your Email Address';
        $htmlContent = View::make('emails.verification', [
            'name' => $name,
            'verificationUrl' => $verificationUrl,
            'expiresAt' => $expiresAt,
            'appName' => config('app.name', 'Kenfinly'),
        ]);
        
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
        $htmlContent = View::make('emails.confirmation', [
            'name' => $name,
            'appName' => config('app.name', 'Kenfinly'),
            'loginUrl' => env('FRONTEND_URL', env('APP_URL')) . '/login',
        ]);

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
}
