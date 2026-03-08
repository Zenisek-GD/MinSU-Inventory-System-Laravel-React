<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Memorandum Receipt #{{ $mr->id }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            background: white;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border: 2px solid #1976d2;
            border-radius: 8px;
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .header p {
            font-size: 14px;
            opacity: 0.9;
        }

        .content {
            padding: 30px;
        }

        .section {
            margin-bottom: 25px;
        }

        .section-title {
            background-color: #1976d2;
            color: white;
            padding: 10px 15px;
            font-weight: 700;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .section-content {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #1976d2;
        }

        .info-row {
            display: flex;
            margin-bottom: 12px;
            align-items: flex-start;
        }

        .info-label {
            font-weight: 700;
            width: 35%;
            color: #1565c0;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            flex: 1;
            font-size: 14px;
            word-break: break-word;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .items-table th {
            background-color: #1976d2;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            border: none;
        }

        .items-table td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
            font-size: 13px;
        }

        .items-table tr:nth-child(even) {
            background-color: #f8f9fa;
        }

        .items-table tr:hover {
            background-color: #e3f2fd;
        }

        .footer {
            padding: 20px 30px;
            background-color: #f5f5f5;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: #666;
        }

        .footer p {
            margin: 5px 0;
        }

        .signature-section {
            display: flex;
            justify-content: space-around;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
        }

        .signature-box {
            width: 45%;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #333;
            width: 100%;
            margin: 40px 0 5px 0;
        }

        .signature-label {
            font-size: 12px;
            font-weight: 700;
            color: #333;
        }

        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
        }

        .badge-equipment {
            background-color: #e3f2fd;
            color: #1565c0;
        }

        .badge-consumable {
            background-color: #f3e5f5;
            color: #6a1b9a;
        }

        @media print {
            body {
                padding: 0;
            }

            .container {
                border: none;
                box-shadow: none;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📋 Memorandum Receipt</h1>
            <p>MinSU Real-Time Supply Operations Management System</p>
            <p style="margin-top: 5px; font-size: 12px;">Receipt No. #{{ str_pad($mr->id, 6, '0', STR_PAD_LEFT) }} |
                Generated: {{ now()->format('M d, Y H:i') }}</p>
        </div>

        <!-- Main Content -->
        <div class="content">

            <!-- Receipt Details Section -->
            <div class="section">
                <div class="section-title">📌 Receipt Information</div>
                <div class="section-content">
                    <div class="info-row">
                        <span class="info-label">Receipt Number:</span>
                        <span class="info-value">#{{ str_pad($mr->id, 6, '0', STR_PAD_LEFT) }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Date Created:</span>
                        <span class="info-value">{{ $mr->created_at->format('F d, Y') }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Status:</span>
                        <span class="info-value">
                            <span class="badge" style="background-color: #c8e6c9; color: #2e7d32;">COMPLETED</span>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Header Information -->
            <div class="section">
                <div class="section-title">👥 Officials Information</div>
                <div class="section-content">
                    <div class="info-row">
                        <span class="info-label">Fund Cluster:</span>
                        <span class="info-value">{{ $mr->fund_cluster ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Office:</span>
                        <span class="info-value">{{ $mr->office->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Receiving Officer:</span>
                        <span class="info-value">{{ $mr->officer->name ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Position:</span>
                        <span class="info-value">{{ $mr->position ?? 'N/A' }}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Received From:</span>
                        <span class="info-value">{{ $mr->received_from ?? 'N/A' }}</span>
                    </div>
                </div>
            </div>

            <!-- Items Section -->
            <div class="section">
                <div class="section-title">📦 Items Received</div>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 5%;">#</th>
                            <th style="width: 35%;">Item Description</th>
                            <th style="width: 15%;">Category</th>
                            <th style="width: 15%;">Type</th>
                            <th style="width: 12%;">Quantity</th>
                            <th style="width: 18%;">Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($mr->items as $index => $item)
                            <tr>
                                <td>{{ $index + 1 }}</td>
                                <td>
                                    <strong>{{ $item->name }}</strong>
                                    @if($item->description)
                                        <br><small style="color: #666;">{{ $item->description }}</small>
                                    @endif
                                </td>
                                <td>{{ $item->category->name ?? 'Uncategorized' }}</td>
                                <td>
                                    @if($item->item_type === 'equipment')
                                        <span class="badge badge-equipment">Equipment</span>
                                    @else
                                        <span class="badge badge-consumable">Consumable</span>
                                    @endif
                                </td>
                                <td style="text-align: center;">
                                    {{ $item->pivot->quantity ?? 1 }}
                                </td>
                                <td>{{ $item->unit ?? $item->pivot->unit ?? 'pcs' }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="6" style="text-align: center; color: #999; padding: 20px;">
                                    No items recorded in this receipt
                                </td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <!-- Summary -->
            <div class="section">
                <div class="section-title">📊 Receipt Summary</div>
                <div class="section-content">
                    <div class="info-row">
                        <span class="info-label">Total Items:</span>
                        <span class="info-value"><strong>{{ count($mr->items) }}</strong></span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Receipt Status:</span>
                        <span class="info-value">
                            <strong style="color: #2e7d32;">✓ Completed</strong>
                        </span>
                    </div>
                </div>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
                <div class="signature-box">
                    <p style="font-size: 12px; color: #666; margin-bottom: 50px;">
                        <strong>Received By:</strong><br>
                        (Receiving Officer)
                    </p>
                    <div class="signature-line"></div>
                    <div class="signature-label">{{ $mr->officer->name ?? 'Name' }}</div>
                    <div style="font-size: 11px; color: #666;">{{ $mr->created_at->format('F d, Y') }}</div>
                </div>

                <div class="signature-box">
                    <p style="font-size: 12px; color: #666; margin-bottom: 50px;">
                        <strong>Approved By:</strong><br>
                        (Supply Officer)
                    </p>
                    <div class="signature-line"></div>
                    <div class="signature-label">Supply Officer</div>
                    <div style="font-size: 11px; color: #666;">Date: ___________</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>MinSU Real-Time Supply Operations Management System</strong></p>
            <p>This is an auto-generated document. No signature required for electronic copies.</p>
            <p style="margin-top: 10px; color: #999;">Generated on: {{ now()->format('F d, Y @ H:i:s A') }}</p>
        </div>
    </div>
</body>

</html>