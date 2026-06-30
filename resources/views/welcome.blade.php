<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <title>{{ config('app.name', 'Kenfinly') }}</title>

        {{-- PWA: Web App Manifest --}}
        <link rel="manifest" href="/manifest.json">

        {{-- PWA: Theme & status bar --}}
        <meta name="theme-color" content="#3B5BDB">
        <meta name="msapplication-TileColor" content="#3B5BDB">
        <meta name="msapplication-TileImage" content="/icons/icon-192.png">

        {{-- PWA: iOS / Safari full-screen support --}}
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="{{ config('app.name', 'Kenfinly') }}">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png">
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png">

        {{-- PWA: iOS splash screens (portrait, most common sizes) --}}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

        {{-- SEO & social --}}
        <meta name="description" content="Track expenses, manage budgets, and understand your finances better with Kenfinly.">
        <meta name="application-name" content="{{ config('app.name', 'Kenfinly') }}">

        @php
            $favicon = \App\Models\AppSetting::where('key', 'favicon')->value('value');
        @endphp

        @if($favicon && file_exists(public_path('storage/' . $favicon)))
            <link rel="icon" href="{{ asset('storage/' . $favicon) }}">
        @else
            <link rel="icon" href="{{ asset('favicon.png') }}">
        @endif

        <!-- Google Tag Manager (noscript) -->
        @if(App\Models\AppSetting::isGA4Enabled() && ($googleTagManagerId = App\Models\AppSetting::getGoogleTagManagerId()))
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id={{ $googleTagManagerId }}"
        height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>

        <!-- Google Tag Manager (gtag.js) -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $googleTagManagerId }}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '{{ $googleTagManagerId }}', {
            'anonymize_ip': true,
            'allow_google_signals': true,
            'allow_ad_personalization_signals': true
          });
        </script>
        @endif

        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
