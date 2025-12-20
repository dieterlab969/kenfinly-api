<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Kenfinly') }}</title>
        
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
        
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
