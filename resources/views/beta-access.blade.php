<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Beta Access - Kenfinly</title>
    <meta name="robots" content="noindex, nofollow">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #09090b;
            color: #e4e4e7;
        }

        body {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            width: 100%;
            max-width: 400px;
        }

        .gate-wrapper {
            background-color: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 40px 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
        }

        .logo {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo h1 {
            font-size: 24px;
            font-weight: 600;
            color: #fafafa;
            letter-spacing: -0.5px;
        }

        .logo p {
            font-size: 12px;
            color: #71717a;
            margin-top: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            color: #d4d4d8;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px 14px;
            font-size: 14px;
            background-color: #27272a;
            border: 1px solid #3f3f46;
            border-radius: 6px;
            color: #fafafa;
            transition: border-color 0.2s, background-color 0.2s;
        }

        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #52525b;
            background-color: #2d2d30;
        }

        .error-message {
            color: #ef4444;
            font-size: 12px;
            margin-top: 6px;
            display: block;
        }

        button {
            width: 100%;
            padding: 12px 16px;
            font-size: 14px;
            font-weight: 600;
            background-color: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.2s;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        button:hover {
            background-color: #2563eb;
        }

        button:active {
            background-color: #1d4ed8;
        }

        .info-text {
            font-size: 12px;
            color: #71717a;
            margin-top: 20px;
            text-align: center;
            line-height: 1.5;
        }

        .alert {
            padding: 12px 14px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
        }

        .alert-error {
            background-color: #7f1d1d;
            border: 1px solid #dc2626;
            color: #fecaca;
        }

        .alert-warning {
            background-color: #78350f;
            border: 1px solid #d97706;
            color: #fcd34d;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="gate-wrapper">
            <div class="logo">
                <h1>Kenfinly</h1>
                <p>Beta Access</p>
            </div>

            @if ($errors->any())
                <div class="alert alert-error">
                    @foreach ($errors->all() as $error)
                        <div>{{ $error }}</div>
                    @endforeach
                </div>
            @endif

            <form method="POST" action="/beta-access/verify">
                @csrf

                <div class="form-group">
                    <label for="code">Access Code</label>
                    <input
                        type="password"
                        id="code"
                        name="code"
                        placeholder="Enter beta access code"
                        required
                        autofocus
                        value="{{ old('code') }}"
                    >
                    @if ($errors->has('code'))
                        <span class="error-message">{{ $errors->first('code') }}</span>
                    @endif
                </div>

                <button type="submit">Unlock Access</button>

                <div class="info-text">
                    This is a private beta staging environment.
                    <br>Unauthorized access is prohibited.
                </div>
            </form>
        </div>
    </div>
</body>
</html>
