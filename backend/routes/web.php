<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Models\Category;
use Illuminate\Support\Facades\Route;

Route::get('/', [ProductController::class, 'index'])->name('home');

Route::get('/hello', function () {
    return 'Hello, World!';
});

Route::get('/user/{name}', function ($name) {
    return "User: " . htmlspecialchars($name);
});

Route::get('/user/{name?}', function ($name = 'Guest') {
    return "User: " . htmlspecialchars($name);
});

Route::get('/about', function () {
    return view('about');
});

Route::get('/contact', function () {
    $email = 'jean@gmail.com';
    return view('contact',['email' => $email]);
});



Route::resource('products', ProductController::class);
Route::resource('categories', CategoryController::class);