<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="robots" content="noindex">
    {{-- Fallback bounce for browsers where the immediate JS redirect is blocked. --}}
    <meta http-equiv="refresh" content="1;url={{ $deepLink }}">
    <title>{{ $title }} · GenTrack</title>
    <style>
        :root {
            --gold: #FFC531;
            --cream: #F7F2E8;
            --ink: #1B1712;
            --muted: #8A8270;
            --white: #FFFFFF;
            --border: rgba(27, 23, 18, 0.08);
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; margin: 0; }
        body {
            background: var(--cream);
            color: var(--ink);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            -webkit-font-smoothing: antialiased;
        }
        .card {
            width: 100%;
            max-width: 360px;
            background: var(--white);
            border: 1px solid var(--border);
            border-radius: 22px;
            padding: 32px 26px;
            text-align: center;
            box-shadow: 0 18px 40px -24px rgba(27, 23, 18, 0.35);
        }
        .mark {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            border-radius: 18px;
            background: var(--gold);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            line-height: 1;
        }
        h1 { font-size: 22px; margin: 0 0 8px; letter-spacing: -0.01em; }
        p { font-size: 15px; line-height: 1.5; color: var(--muted); margin: 0 0 24px; }
        .btn {
            display: inline-block;
            width: 100%;
            padding: 15px 20px;
            border-radius: 16px;
            background: var(--ink);
            color: var(--white);
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
        }
        .hint { margin: 16px 0 0; font-size: 12.5px; color: var(--muted); }
    </style>
</head>
<body>
    <main class="card">
        <div class="mark">{{ $title === 'Checkout canceled' ? '↩' : '⚡' }}</div>
        <h1>{{ $title }}</h1>
        <p>{{ $body }}</p>
        <a class="btn" href="{{ $deepLink }}">Return to GenTrack</a>
        <p class="hint">If nothing happens, tap the button above — then you can close this tab.</p>
    </main>

    <script>
        // Bounce straight back into the app. expo-web-browser's auth session
        // intercepts this deep link and closes the in-app browser automatically.
        (function () {
            var target = @json($deepLink);
            try { window.location.replace(target); } catch (e) { window.location.href = target; }
        })();
    </script>
</body>
</html>
