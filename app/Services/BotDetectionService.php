<?php

namespace App\Services;

use App\Models\SuspiciousActivity;
use App\Models\BlockedIp;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class BotDetectionService
{
    private const RAPID_REGISTRATION_WINDOW = 10;
    private const RAPID_REGISTRATION_THRESHOLD = 3;
    private const SUSPICIOUS_PATTERN_WINDOW = 60;
    private const IP_SUSPICION_THRESHOLD = 5;
    
    private Request $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function analyzeRegistrationAttempt(string $name, string $email): array
    {
        $ipAddress = $this->getClientIp();
        $userAgent = $this->request->userAgent();
        
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
            'should_block' => false,
        ];

        if (BlockedIp::isBlocked($ipAddress)) {
            $result['is_suspicious'] = true;
            $result['should_block'] = true;
            $result['reasons'][] = 'IP address is blocked';
            $result['risk_score'] = 100;
            
            SuspiciousActivity::log(
                $ipAddress,
                'Blocked IP attempted registration',
                $email,
                $name,
                $userAgent,
                ['email' => $email, 'name' => $name],
                'high'
            );
            
            return $result;
        }

        $checks = [
            $this->checkUsernameSuspiciousPattern($name),
            $this->checkRapidRegistration($ipAddress),
            $this->checkSuspiciousUserAgent($userAgent),
            $this->checkRepeatedFailedAttempts($ipAddress),
            $this->checkSimilarUsernamePattern($name, $ipAddress),
        ];

        foreach ($checks as $check) {
            if ($check['is_suspicious']) {
                $result['is_suspicious'] = true;
                $result['reasons'] = array_merge($result['reasons'], $check['reasons']);
                $result['risk_score'] += $check['risk_score'];
            }
        }

        if ($result['risk_score'] >= 70) {
            $result['should_block'] = true;
            
            SuspiciousActivity::log(
                $ipAddress,
                'High-risk bot pattern detected: ' . implode(', ', $result['reasons']),
                $email,
                $name,
                $userAgent,
                ['checks' => $checks],
                'high'
            );

            $this->autoBlockSuspiciousIp($ipAddress, $result['reasons']);
        } elseif ($result['is_suspicious']) {
            SuspiciousActivity::log(
                $ipAddress,
                'Suspicious registration pattern: ' . implode(', ', $result['reasons']),
                $email,
                $name,
                $userAgent,
                ['risk_score' => $result['risk_score'], 'checks' => $checks],
                $result['risk_score'] >= 40 ? 'medium' : 'low'
            );
        }

        return $result;
    }

    private function checkUsernameSuspiciousPattern(string $name): array
    {
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
        ];

        if (preg_match('/^R\d{5,}$/i', $name)) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Username matches bot pattern (R + numbers)';
            $result['risk_score'] = 40;
        }

        if (preg_match('/^(user|test|temp|bot|spam)\d+$/i', $name)) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Username matches common bot pattern';
            $result['risk_score'] = 35;
        }

        if (preg_match('/^[a-z]\d{8,}$/i', $name)) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Username is single letter followed by many digits';
            $result['risk_score'] = 30;
        }

        if (strlen($name) >= 20 && preg_match('/^[a-z0-9]+$/i', $name)) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Username is unusually long random string';
            $result['risk_score'] = 25;
        }

        return $result;
    }

    private function checkRapidRegistration(string $ipAddress): array
    {
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
        ];

        $recentCount = SuspiciousActivity::countRecentByIp(
            $ipAddress,
            self::RAPID_REGISTRATION_WINDOW
        );

        $recentUserCount = User::where('created_at', '>=', now()->subMinutes(self::RAPID_REGISTRATION_WINDOW))
            ->whereRaw("LOWER(JSON_EXTRACT(request()->json(), '$.ip')) = ?", [strtolower($ipAddress)])
            ->count();

        $totalAttempts = $recentCount + $recentUserCount;

        if ($totalAttempts >= self::RAPID_REGISTRATION_THRESHOLD) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = "Multiple registration attempts in {$totalAttempts} minutes";
            $result['risk_score'] = min(50, $totalAttempts * 10);
        }

        return $result;
    }

    private function checkSuspiciousUserAgent(?string $userAgent): array
    {
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
        ];

        if (empty($userAgent) || $userAgent === 'null') {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Missing or invalid user agent';
            $result['risk_score'] = 20;
            return $result;
        }

        $botPatterns = [
            '/bot|crawler|spider|scraper/i',
            '/curl|wget|python|java|ruby/i',
            '/automated|script|phantom/i',
        ];

        foreach ($botPatterns as $pattern) {
            if (preg_match($pattern, $userAgent)) {
                $result['is_suspicious'] = true;
                $result['reasons'][] = 'User agent indicates automated tool';
                $result['risk_score'] = 45;
                break;
            }
        }

        return $result;
    }

    private function checkRepeatedFailedAttempts(string $ipAddress): array
    {
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
        ];

        $recentSuspicious = SuspiciousActivity::countRecentByIp(
            $ipAddress,
            self::SUSPICIOUS_PATTERN_WINDOW
        );

        if ($recentSuspicious >= self::IP_SUSPICION_THRESHOLD) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = "IP has {$recentSuspicious} suspicious activities in past hour";
            $result['risk_score'] = 40;
        }

        return $result;
    }

    private function checkSimilarUsernamePattern(string $name, string $ipAddress): array
    {
        $result = [
            'is_suspicious' => false,
            'reasons' => [],
            'risk_score' => 0,
        ];

        $recentActivities = SuspiciousActivity::where('ip_address', $ipAddress)
            ->where('created_at', '>=', now()->subMinutes(60))
            ->whereNotNull('username')
            ->pluck('username');

        $similarCount = 0;
        foreach ($recentActivities as $previousName) {
            if ($this->areUsernamesSimilar($name, $previousName)) {
                $similarCount++;
            }
        }

        if ($similarCount >= 2) {
            $result['is_suspicious'] = true;
            $result['reasons'][] = 'Multiple registrations with similar username patterns from same IP';
            $result['risk_score'] = 35;
        }

        return $result;
    }

    private function areUsernamesSimilar(string $name1, string $name2): bool
    {
        $pattern1 = preg_replace('/\d+/', 'N', $name1);
        $pattern2 = preg_replace('/\d+/', 'N', $name2);
        
        return $pattern1 === $pattern2 && $name1 !== $name2;
    }

    private function autoBlockSuspiciousIp(string $ipAddress, array $reasons): void
    {
        $recentHighSeverity = SuspiciousActivity::hasRecentHighSeverity($ipAddress, 30);
        
        if ($recentHighSeverity) {
            BlockedIp::blockIp(
                $ipAddress,
                'Automated blocking: ' . implode(', ', $reasons),
                1440,
                false
            );
            
            Log::warning('IP automatically blocked due to suspicious activity', [
                'ip' => $ipAddress,
                'reasons' => $reasons,
            ]);
        }
    }

    private function getClientIp(): string
    {
        if ($this->request->header('X-Forwarded-For')) {
            $ips = explode(',', $this->request->header('X-Forwarded-For'));
            return trim($ips[0]);
        }

        if ($this->request->header('X-Real-IP')) {
            return $this->request->header('X-Real-IP');
        }

        return $this->request->ip();
    }

    public function logSuspiciousActivity(
        string $reason,
        ?string $email = null,
        ?string $username = null,
        string $severity = 'medium'
    ): void {
        SuspiciousActivity::log(
            $this->getClientIp(),
            $reason,
            $email,
            $username,
            $this->request->userAgent(),
            [
                'url' => $this->request->fullUrl(),
                'method' => $this->request->method(),
            ],
            $severity
        );
    }
}
