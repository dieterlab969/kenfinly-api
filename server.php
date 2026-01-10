<?php
/**
 * Custom PHP Built-in Server Router
 * Handles both Laravel and WordPress in /wordpress subdirectory
 * 
 * Usage: php -S 0.0.0.0:5000 server.php
 */

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));

$mimeTypes = [
    'css' => 'text/css',
    'js' => 'application/javascript',
    'json' => 'application/json',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif' => 'image/gif',
    'svg' => 'image/svg+xml',
    'ico' => 'image/x-icon',
    'woff' => 'font/woff',
    'woff2' => 'font/woff2',
    'ttf' => 'font/ttf',
    'eot' => 'application/vnd.ms-fontobject',
    'map' => 'application/json',
    'pdf' => 'application/pdf',
];

function serveStaticFile($path) {
    global $mimeTypes;
    if (is_file($path)) {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }
        readfile($path);
        return true;
    }
    return false;
}

if (strpos($uri, '/wordpress') === 0) {
    $wordpressRoot = __DIR__ . '/public/wordpress';
    $wordpressUri = substr($uri, strlen('/wordpress'));
    
    if ($wordpressUri === '' || $wordpressUri === '/') {
        $wordpressUri = '/index.php';
    }
    
    $wordpressPath = $wordpressRoot . $wordpressUri;
    
    if (is_file($wordpressPath)) {
        $ext = strtolower(pathinfo($wordpressPath, PATHINFO_EXTENSION));
        
        if ($ext === 'php') {
            $_SERVER['SCRIPT_NAME'] = '/wordpress' . $wordpressUri;
            $_SERVER['SCRIPT_FILENAME'] = $wordpressPath;
            $_SERVER['PHP_SELF'] = '/wordpress' . $wordpressUri;
            $_SERVER['DOCUMENT_ROOT'] = $wordpressRoot;
            
            chdir($wordpressRoot);
            require $wordpressPath;
            return true;
        }
        
        if (isset($mimeTypes[$ext])) {
            header('Content-Type: ' . $mimeTypes[$ext]);
        }
        readfile($wordpressPath);
        return true;
    }
    
    $_SERVER['SCRIPT_NAME'] = '/wordpress/index.php';
    $_SERVER['SCRIPT_FILENAME'] = $wordpressRoot . '/index.php';
    $_SERVER['PHP_SELF'] = '/wordpress/index.php';
    $_SERVER['DOCUMENT_ROOT'] = $wordpressRoot;
    
    chdir($wordpressRoot);
    require $wordpressRoot . '/index.php';
    return true;
}

$publicPath = __DIR__ . '/public' . $uri;
if ($uri !== '/' && is_file($publicPath)) {
    $ext = strtolower(pathinfo($publicPath, PATHINFO_EXTENSION));
    if (isset($mimeTypes[$ext])) {
        header('Content-Type: ' . $mimeTypes[$ext]);
    }
    readfile($publicPath);
    return true;
}

chdir(__DIR__ . '/public');
require_once __DIR__ . '/public/index.php';
