import React from "react";

/**
 * ICSForm — Inventory Custodian Slip
 * Matches the official MinSU Bongabong Campus layout (Appendix 59).
 *
 * Usage:
 *   <ICSForm mr={mrObject} items={itemsArray} printRef={ref} />
 */
const ICSForm = React.forwardRef(function ICSForm({ mr, items = [] }, ref) {
  if (!mr) return null;

  const grandTotal = items.reduce((sum, item) => {
    const total = parseFloat(item.total_cost ?? item.qty * item.unit_cost) || 0;
    return sum + total;
  }, 0);

  const formatAmount = (value) =>
    parseFloat(value || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateStr) => {
    // e.g "MARCH 3, 2026"
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).toUpperCase();
  };

  const icsNo = mr.ics_no || mr.mr_number || "";

  // Pad rows to minimum of 15 for a clean print layout
  const MIN_ROWS = 15;
  const paddedItems = [...items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push(null);
  }

  return (
    <div ref={ref} className="ics-form-container">
      <style>{`
        .ics-form-container {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 13px;
          color: #000;
          background: #fff;
          width: 100%;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0.5in;
          box-sizing: border-box;
        }

        .ics-top-right {
          text-align: right;
          font-style: italic;
          font-size: 14px;
          margin-bottom: 25px;
        }

        .ics-title {
          text-align: center;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 30px;
        }

        .ics-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 8px;
        }
        .ics-meta-line {
          font-size: 13px;
          display: flex;
        }
        .ics-meta-line label {
          min-width: 130px;
        }
        .ics-meta-value {
          border-bottom: 1px solid #000;
          font-weight: bold;
          min-width: 250px;
          padding: 0 4px;
        }
        
        .ics-meta-top {
          display: flex;
          justify-content: space-between;
        }

        /* TABLE */
        .ics-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-bottom: 0px;
          font-size: 12px;
        }
        .ics-table th, .ics-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          vertical-align: top;
        }
        .ics-table th {
          text-align: center;
          font-weight: bold;
        }

        .col-qty { width: 6%; text-align: center; }
        .col-unit { width: 6%; text-align: center; }
        .col-amount-group { text-align: center; }
        .col-ucost { width: 12%; text-align: right; }
        .col-tcost { width: 12%; text-align: right; }
        .col-desc { width: 34%; }
        .col-inv { width: 15%; text-align: center; font-size: 11px; }
        .col-life { width: 15%; text-align: center; font-size: 11px; }

        .ics-table .empty-row td {
          height: 24px;
        }

        /* SIGNATURES */
        .ics-signatures {
          display: flex;
          border: 1px solid #000;
          border-top: none;
        }
        .ics-sig-box {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 140px;
        }
        .ics-sig-box:first-child {
          border-right: 1px solid #000;
        }
        .ics-sig-top {
          padding: 4px 6px;
          font-size: 12px;
        }
        .ics-sig-content {
          margin-top: auto;
          text-align: center;
          padding-bottom: 10px;
        }
        .ics-sig-name {
          font-weight: bold;
          font-size: 13px;
          text-transform: uppercase;
        }
        .ics-sig-subtext {
          font-size: 11px;
          margin-top: 2px;
          font-style: italic;
        }
        .ics-sig-normal {
          font-size: 11px;
          margin-top: 2px;
        }

        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { margin: 0; padding: 0; }
          .ics-form-container {
            width: 210mm;
            min-height: 297mm;
            max-width: 210mm;
            margin: 0;
            padding: 12mm 14mm;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .ics-table { page-break-inside: auto; }
          .ics-table tr { page-break-inside: avoid; page-break-after: auto; }
          .ics-signatures { page-break-inside: avoid; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      {/* Appendix */}
      <div className="ics-top-right">
        Appendix 59
      </div>

      {/* Title */}
      <div className="ics-title">INVENTORY CUSTODIAN SLIP</div>

      {/* Meta Headers */}
      <div className="ics-meta">
        <div className="ics-meta-line">
          <label>Entity Name:</label>
          <strong>{mr.entity_name || "Mindoro State University Bongabong Campus"}</strong>
        </div>

        <div className="ics-meta-top">
          <div className="ics-meta-line">
            <label>Fund Cluster :</label>
            <span className="ics-meta-value">{mr.fund_cluster || "MDS"}</span>
          </div>
          <div className="ics-meta-line" style={{ justifyContent: "flex-end", paddingRight: 10 }}>
            <label style={{ minWidth: "auto", marginRight: 8, fontWeight: "bold" }}>ICS No :</label>
            <span className="ics-meta-value" style={{ minWidth: 140 }}>{icsNo}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="ics-table">
        <thead>
          <tr>
            <th rowSpan={2} className="col-qty">Quantity</th>
            <th rowSpan={2} className="col-unit">Unit</th>
            <th colSpan={2} className="col-amount-group">Amount</th>
            <th rowSpan={2} className="col-desc">Description</th>
            <th rowSpan={2} className="col-inv">Inventory<br />Item No.</th>
            <th rowSpan={2} className="col-life">Estimated<br />Useful Life</th>
          </tr>
          <tr>
            <th className="col-ucost">Unit Cost</th>
            <th className="col-tcost">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, index) =>
            item ? (
              <tr key={index}>
                <td className="col-qty">{item.qty}</td>
                <td className="col-unit">{item.unit}</td>
                <td className="col-ucost">{formatAmount(item.unit_cost)}</td>
                <td className="col-tcost">
                  {formatAmount(item.total_cost ?? item.qty * item.unit_cost)}
                </td>
                <td className="col-desc" style={{ whiteSpace: 'pre-wrap' }}>{item.item_name}</td>
                <td className="col-inv">#{index + 1} of {items.length}</td>
                <td className="col-life">{item.estimated_useful_life || "5 years"}</td>
              </tr>
            ) : (
              <tr key={index} className="empty-row">
                <td className="col-qty"></td>
                <td className="col-unit"></td>
                <td className="col-ucost"></td>
                <td className="col-tcost"></td>
                <td className="col-desc"></td>
                <td className="col-inv"></td>
                <td className="col-life"></td>
              </tr>
            )
          )}
        </tbody>
      </table>

      {/* Signatures */}
      <div className="ics-signatures">
        {/* Left - Received From */}
        <div className="ics-sig-box">
          <div className="ics-sig-top">Received from:</div>
          <div className="ics-sig-content">
            <div className="ics-sig-name">{mr.received_from || mr.issued_by || "RONALD F. GUTIERREZ"}</div>
            <div className="ics-sig-subtext">Signature Over Printed Name</div>
            <div className="ics-sig-normal">AO-I/Supply Officer I</div>
            <div className="ics-sig-subtext">Position/Office</div>
            <div className="ics-sig-name" style={{ marginTop: 10 }}>{formatDate(mr.date_issued)}</div>
            <div className="ics-sig-subtext">Date</div>
          </div>
        </div>

        {/* Right - Received By */}
        <div className="ics-sig-box">
          <div className="ics-sig-top">Received by:</div>
          <div className="ics-sig-content">
            <div className="ics-sig-name">{mr.accountable_officer || ""}</div>
            <div className="ics-sig-subtext">Signature Over Printed Name</div>
            <div className="ics-sig-normal">{mr.position && mr.office ? `${mr.position} / ${mr.office}` : (mr.position || mr.office || "Campus Executive Director")}</div>
            <div className="ics-sig-subtext">Position/Office</div>
            <div className="ics-sig-name" style={{ marginTop: 10 }}>{formatDate(mr.date_issued)}</div>
            <div className="ics-sig-subtext">Date</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ICSForm;
