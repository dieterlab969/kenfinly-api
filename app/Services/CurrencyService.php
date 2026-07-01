<?php

namespace App\Services;

/**
 * Service for currency conversion and formatting.
 *
 * Provides methods for converting between supported currencies and formatting
 * currency values for display. Currently supports USD and VND conversions.
 */
class CurrencyService
{
    // Exchange rate: 1 USD = ~25,000 VND (approximate rate)
    // You can update this or fetch from an API for real-time rates
    const VND_TO_USD_RATE = 0.00004; // 1 VND = 0.00004 USD
    const USD_TO_VND_RATE = 25000;   // 1 USD = 25,000 VND

    /**
     * Convert amount from one currency to another
     *
     * @param float $amount
     * @param string $fromCurrency
     * @param string $toCurrency
     * @return float
     */
    public static function convert(float $amount, string $fromCurrency, string $toCurrency): float
    {
        // If same currency, no conversion needed
        if ($fromCurrency === $toCurrency) {
            return $amount;
        }

        // Convert from VND to USD
        if ($fromCurrency === 'VND' && $toCurrency === 'USD') {
            return round($amount * self::VND_TO_USD_RATE, 2);
        }

        // Convert from USD to VND
        if ($fromCurrency === 'USD' && $toCurrency === 'VND') {
            return round($amount * self::USD_TO_VND_RATE, 2);
        }

        // If unsupported currency pair, return original amount
        return $amount;
    }

    /**
     * Format currency for display
     *
     * @param float $amount
     * @param string $currency
     * @return string
     */
    public static function format(float $amount, string $currency = 'USD'): string
    {
        if ($currency === 'VND') {
            return number_format($amount, 0, ',', '.') . ' ₫';
        }

        return '$' . number_format($amount, 2, '.', ',');
    }

    /**
     * Get supported currencies
     *
     * @return array
     */
    public static function getSupportedCurrencies(): array
    {
        return [
            'USD' => 'US Dollar',
            'VND' => 'Vietnamese Dong',
        ];
    }
}
