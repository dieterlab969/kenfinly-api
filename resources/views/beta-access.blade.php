<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beta Access - {{ config('app.name') }}</title>
    <meta name="robots" content="noindex, nofollow">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #09090b;
            color: #ffffff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1.6;
        }
        
        .container {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 40px;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }
        
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .logo h1 {
            font-size: 28px;
            font-weight: 600;
            color: #ffffff;
        }
        
        .subtitle {
            text-align: center;
            color: #888;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #ccc;
        }
        
        input[type="text"] {
            width: 100%;
            padding: 12px 16px;
            background-color: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            color: #ffffff;
            font-size: 16px;
            transition: border-color 0.2s;
        }
        
        input[type="text"]:focus {
            outline: none;
            border-color: #666;
        }
        
        .btn {
            width: 100%;
            padding: 12px;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .btn:hover {
            background-color: #0056b3;
        }
        
        .error {
            background-color: #dc3545;
            color: white;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .footer {
            text-align: center;
            margin-top: 30px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>{{ config('app.name') }}</h1>
        </div>
        
        <div class="subtitle">
            Beta Access Required
        </div>
        
        @if ($errors->any())
            <div class="error">
                {{ $errors->first('access_code') }}
            </div>
        @endif
        
        <form method="POST" action="{{ route('beta-access.verify') }}">
            @csrf
            <div class="form-group">
                <label for="access_code">Enter Beta Access Code</label>
                <input 
                    type="text" 
                    id="access_code" 
                    name="access_code" 
                    value="{{ old('access_code') }}"
                    placeholder="Enter your access code"
                    required
                    autocomplete="off"
                >
            </div>
            
            <button type="submit" class="btn">
                Access Beta
            </button>
        </form>
        
        <div class="footer">
            This is a private staging environment
        </div>
    </div>
</body>
</html>