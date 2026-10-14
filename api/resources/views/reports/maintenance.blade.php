<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <style>
        @page { margin: 32px 40px; }
        * { box-sizing: border-box; }
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #1B1712;
            font-size: 12px;
            margin: 0;
        }
        .brand { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #B08A15; font-weight: bold; }
        h1 { font-size: 24px; margin: 2px 0 0; }
        .sub { color: #8A8270; font-size: 12px; margin: 2px 0 20px; }

        .summary { width: 100%; background: #1B1712; border-radius: 10px; color: #F7F2E8; margin-bottom: 22px; }
        .summary td { padding: 18px 20px; width: 33%; vertical-align: top; }
        .summary .num { font-size: 26px; font-weight: bold; }
        .summary .num.paid { color: #FFC531; }
        .summary .num.saved { color: #4ADE80; }
        .summary .cap { font-size: 11px; color: #B8B0A0; text-transform: uppercase; letter-spacing: 1px; }
        .summary .head { font-size: 11px; color: #B8B0A0; padding-bottom: 4px; }

        h2 { font-size: 14px; margin: 0 0 10px; }
        table.services { width: 100%; border-collapse: collapse; }
        table.services th {
            text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;
            color: #8A8270; border-bottom: 1px solid rgba(27,23,18,0.12); padding: 6px 8px;
        }
        table.services td { padding: 10px 8px; border-bottom: 1px solid rgba(27,23,18,0.06); vertical-align: top; }
        table.services td.date { color: #8A8270; white-space: nowrap; width: 60px; }
        table.services td.title { font-weight: bold; }
        table.services td.gen { color: #8A8270; }
        table.services td.cost { text-align: right; font-weight: bold; white-space: nowrap; }
        .empty { color: #8A8270; padding: 16px 8px; }

        .foot { margin-top: 26px; color: #948C79; font-size: 10px; border-top: 1px solid rgba(27,23,18,0.10); padding-top: 10px; }
    </style>
</head>
<body>
    <div class="brand">GenTrack AI</div>
    <h1>Maintenance report</h1>
    <div class="sub">
        Full fleet &middot; {{ $report['periodLabel'] }}@if($user->name) &middot; {{ $user->name }}@endif
    </div>

    <table class="summary">
        <tr>
            <td colspan="3" class="head">Summary &middot; {{ $report['periodLabel'] }}</td>
        </tr>
        <tr>
            <td>
                <div class="num">{{ $report['summary']['services'] }}</div>
                <div class="cap">Services</div>
            </td>
            <td>
                <div class="num paid">{{ $report['summary']['totalPaidLabel'] }}</div>
                <div class="cap">Total paid</div>
            </td>
            <td>
                <div class="num saved">{{ $report['summary']['estSavedLabel'] }}</div>
                <div class="cap">Est. saved</div>
            </td>
        </tr>
    </table>

    <h2>Services performed</h2>
    @if(count($report['services']) > 0)
        <table class="services">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Generator</th>
                    <th style="text-align: right;">Cost</th>
                </tr>
            </thead>
            <tbody>
                @foreach($report['services'] as $service)
                    <tr>
                        <td class="date">{{ $service['dateLabel'] }}</td>
                        <td class="title">{{ $service['title'] }}</td>
                        <td class="gen">{{ $service['generatorName'] ?? '—' }}</td>
                        <td class="cost">{{ $service['costLabel'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @else
        <div class="empty">No services recorded in this period.</div>
    @endif

    <div class="foot">{{ $report['note'] }}</div>
</body>
</html>
