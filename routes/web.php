<?php

use Illuminate\Support\Facades\Route;

Route::get('/up', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
