<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class EmailValidationService
{
    private const CACHE_TTL = 3600;
    
    private array $disposableDomains = [
        '10minutemail.com', 'tempmail.com', 'guerrillamail.com', 'mailinator.com',
        'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc',
        'yopmail.com', 'fakeinbox.com', 'trashmail.com', 'disposablemail.com',
        'sharklasers.com', 'guerrillamailblock.com', 'pokemail.net', 'spam4.me',
        'grr.la', 'cool.fr.nf', 'jetable.fr.nf', 'nospam.ze.tc',
        'nomail.xl.cx', 'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
        'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf', 'mailcatch.com',
        'emailondeck.com', 'sute.jp', 'rmqkr.net', '10mail.org',
        'mailnesia.com', 'filzmail.com', 'tmails.net', 'moakt.com',
        'mohmal.com', 'thankyou2010.com', 'trash-mail.com', 'mytemp.email',
        'dropmail.me', 'tempmail.net', 'emailfake.com', 'temp-mail.io',
        'internxt.com', 'dispostable.com', 'emailtemporanea.net', 'fakemail.net',
    ];

    public function validate(string $email): array
    {
        $result = [
            'valid' => true,
            'errors' => [],
            'warnings' => [],
            'checks' => [],
        ];

        $email = strtolower(trim($email));

        if (!$this->validateSyntax($email)) {
            $result['valid'] = false;
            $result['errors'][] = 'Invalid email format';
            return $result;
        }
        $result['checks'][] = 'Syntax validation passed';

        list($username, $domain) = explode('@', $email);

        if ($this->isDisposableEmail($domain)) {
            $result['valid'] = false;
            $result['errors'][] = 'Disposable email addresses are not allowed';
            $result['checks'][] = 'Disposable email detected';
            return $result;
        }
        $result['checks'][] = 'Not a disposable email';

        if ($this->isRoleBasedEmail($username)) {
            $result['warnings'][] = 'Role-based email address detected';
            $result['checks'][] = 'Role-based email warning';
        }

        $dnsCheck = $this->checkDNS($domain);
        if (!$dnsCheck['valid']) {
            $result['valid'] = false;
            $result['errors'][] = $dnsCheck['message'];
            $result['checks'][] = 'DNS/MX validation failed';
            return $result;
        }
        $result['checks'][] = 'DNS/MX validation passed';

        return $result;
    }

    private function validateSyntax(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    private function isDisposableEmail(string $domain): bool
    {
        return in_array(strtolower($domain), $this->disposableDomains);
    }

    private function isRoleBasedEmail(string $username): bool
    {
        $roleBasedPrefixes = [
            'admin', 'info', 'support', 'sales', 'contact', 'help',
            'service', 'office', 'noreply', 'no-reply', 'postmaster',
            'webmaster', 'abuse', 'security', 'privacy', 'billing',
        ];

        return in_array(strtolower($username), $roleBasedPrefixes);
    }

    private function checkDNS(string $domain): array
    {
        $cacheKey = "dns_check:{$domain}";
        
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $hasMX = checkdnsrr($domain, 'MX');
            $hasA = checkdnsrr($domain, 'A');
            
            if ($hasMX) {
                $result = [
                    'valid' => true,
                    'message' => 'Domain has valid MX records',
                ];
            } elseif ($hasA) {
                $result = [
                    'valid' => true,
                    'message' => 'Domain has A record (no MX, but may accept mail)',
                ];
            } else {
                $result = [
                    'valid' => false,
                    'message' => 'Domain does not have valid MX or A records',
                ];
            }

            Cache::put($cacheKey, $result, self::CACHE_TTL);
            return $result;

        } catch (\Exception $e) {
            Log::warning('DNS check failed', [
                'domain' => $domain,
                'error' => $e->getMessage(),
            ]);

            return [
                'valid' => true,
                'message' => 'DNS check failed, allowing email to pass',
            ];
        }
    }

    public function getTypoSuggestion(string $email): ?string
    {
        $commonDomains = [
            'gmail.com' => ['gmai.com', 'gmial.com', 'gmal.com', 'gamil.com'],
            'yahoo.com' => ['yaho.com', 'yahooo.com', 'yhoo.com'],
            'outlook.com' => ['outloo.com', 'outlok.com', 'outlok.com'],
            'hotmail.com' => ['hotmai.com', 'hotmal.com', 'hotmial.com'],
        ];

        list($username, $domain) = explode('@', strtolower($email));

        foreach ($commonDomains as $correctDomain => $typos) {
            if (in_array($domain, $typos)) {
                return $username . '@' . $correctDomain;
            }
        }

        return null;
    }

    public function addDisposableDomain(string $domain): void
    {
        $domain = strtolower(trim($domain));
        if (!in_array($domain, $this->disposableDomains)) {
            $this->disposableDomains[] = $domain;
        }
    }

    public function isValid(string $email): bool
    {
        $result = $this->validate($email);
        return $result['valid'];
    }
}
