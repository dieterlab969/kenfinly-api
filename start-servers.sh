#!/bin/bash

cleanup() {
    echo "Stopping servers..."
    kill $LARAVEL_PID 2>/dev/null
    kill $WP_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting Laravel server on port 5000..."
php artisan serve --host=0.0.0.0 --port=5000 &
LARAVEL_PID=$!

echo "Starting WordPress server on port 8080..."
cd public/wordpress && php -S 0.0.0.0:8080 &
WP_PID=$!

echo "Both servers started. Laravel: http://0.0.0.0:5000, WordPress: http://0.0.0.0:8080"

wait
