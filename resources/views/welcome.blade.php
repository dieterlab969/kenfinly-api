<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Kenfinly') }}</title>
        
        <!-- Google tag (gtag.js) -->
        @if($googleTagManagerId = App\Models\AppSetting::getGoogleTagManagerId())
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $googleTagManagerId }}"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '{{ $googleTagManagerId }}');
        </script>
        @endif
        
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    </head>
    <body>
        <div id="app"></div>
    </body>
</html>
