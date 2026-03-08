import React from "react";

/**
 * PARForm — Property Acknowledgment Receipt
 * Matches the official MinSU Bongabong Campus layout from photo.
 *
 * Usage:
 *   <PARForm mr={mrObject} items={itemsArray} printRef={ref} />
 */
const PARForm = React.forwardRef(function PARForm({ mr, items = [] }, ref) {
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
    // e.g "FEBRUARY 26, 2026"
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).toUpperCase();
  };

  const shortDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    // Format to match whatever acquired date looks like, usually simple short date
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const parNo = mr.par_no || mr.mr_number || "";

  // Pad rows to minimum of 20 for a full page layout
  const MIN_ROWS = 20;
  const paddedItems = [...items];
  while (paddedItems.length < MIN_ROWS) {
    paddedItems.push(null);
  }

  return (
    <div ref={ref} className="par-form-container">
      <style>{`
        .par-form-container {
          font-family: 'Times New Roman', Times, serif;
          font-size: 13px;
          color: #000;
          background: #fff;
          width: 100%;
          max-width: 8.5in; /* Standard Letter Width approx */
          margin: 0 auto;
          padding: 0.5in;
          box-sizing: border-box;
        }

        /* HEADER SECTION */
        .par-header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .par-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .par-header-center {
          text-align: center;
          flex: 1;
          line-height: 1.2;
        }
        .par-header-repub {
          font-size: 14px;
        }
        .par-header-minsu {
          font-size: 18px;
          font-weight: bold;
          font-family: 'Times New Roman', serif;
        }
        .par-header-campus {
          font-size: 14px;
        }
        .par-header-address {
          font-size: 13px;
        }

        /* FORM TITLE */
        .par-title {
          text-align: center;
          font-weight: bold;
          font-size: 16px;
          margin-bottom: 25px;
        }

        /* META FIELDS (Fund Cluster & PAR No) */
        .par-meta-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .par-meta-line {
          font-size: 13px;
        }
        .par-meta-value {
          border-bottom: 1px solid #000;
          display: inline-block;
          min-width: 120px;
          font-weight: bold;
        }

        /* TABLE */
        .par-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000;
          margin-bottom: 0px; 
        }
        .par-table th, .par-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          vertical-align: top;
        }
        .par-table th {
          text-align: center;
          font-weight: bold;
          font-size: 13px;
          padding: 10px 4px;
        }
        .col-qty { width: 8%; text-align: center; }
        .col-unit { width: 8%; text-align: center; }
        .col-desc { width: 38%; }
        .col-prop { width: 14%; text-align: center; }
        .col-date { width: 14%; text-align: center; }
        .col-amt { width: 18%; text-align: right; }

        .par-table .empty-row td {
          height: 24px;
        }

        /* TOTAL ROW */
        .par-total-row th {
          text-align: right;
          padding-right: 10px;
          font-size: 14px;
        }

        /* SIGNATURE AREA */
        .par-signatures {
          display: flex;
          border: 1px solid #000;
          border-top: none;
        }
        .par-sig-box {
          flex: 1;
          padding: 12px;
          display: flex;
          flex-direction: column;
          min-height: 140px;
        }
        .par-sig-box:first-child {
          border-right: 1px solid #000;
        }
        .par-sig-label {
          font-size: 13px;
        }
        .par-sig-content {
          margin-top: auto; /* Push to bottom */
          text-align: center;
        }
        .par-sig-name {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
        }
        .par-sig-subtext {
          font-size: 11px;
          margin-top: 2px;
        }

        @media print {
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { margin: 0; padding: 0; }
          .par-form-container {
            width: 210mm;
            min-height: 297mm;
            max-width: 210mm;
            margin: 0;
            padding: 12mm 14mm;
            box-sizing: border-box;
            page-break-inside: avoid;
          }
          .par-table { page-break-inside: auto; }
          .par-table tr { page-break-inside: avoid; page-break-after: auto; }
          .par-signatures { page-break-inside: avoid; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      {/* HEADER SECTION */}
      <div className="par-header-container">
        <img src="/minsu-logo.png" alt="MinSU Logo" className="par-logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        <div style={{ width: 80, height: 80, border: '1px solid #ccc', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: 10, borderRadius: '50%' }}>LOGO</div>

        <div className="par-header-center">
          <div className="par-header-repub">Republic of the Philippines</div>
          <div className="par-header-minsu">MINDORO STATE UNIVERSITY</div>
          <div className="par-header-campus">BONGABONG CAMPUS</div>
          <div className="par-header-address">Labasan, Bongabong, Oriental Mindoro</div>
        </div>

        <img src="/bagong-pilipinas.png" alt="Bagong Pilipinas" className="par-logo" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        <div style={{ width: 80, height: 80, border: '1px solid #ccc', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: 10, borderRadius: '50%' }}>BP LOGO</div>
      </div>

      {/* FORM TITLE */}
      <div className="par-title">PROPERTY ACKNOWLEDGMENT RECEIPT</div>

      {/* META FIELDS */}
      <div className="par-meta-container">
        <div className="par-meta-line">
          Fund Cluster: <span className="par-meta-value" style={{ borderBottom: 'none' }}>{mr.fund_cluster || "MDS"}</span>
        </div>
        <div className="par-meta-line">
          PAR No.: <span className="par-meta-value">{parNo}</span>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <table className="par-table">
        <thead>
          <tr>
            <th className="col-qty">Quantity</th>
            <th className="col-unit">Unit</th>
            <th className="col-desc">Description</th>
            <th className="col-prop">Property<br />Number</th>
            <th className="col-date">Date<br />Acquired</th>
            <th className="col-amt">Amount</th>
          </tr>
        </thead>
        <tbody>
          {paddedItems.map((item, index) =>
            item ? (
              <tr key={index}>
                <td className="col-qty">{item.qty}</td>
                <td className="col-unit">{item.unit}</td>
                <td className="col-desc" style={{ whiteSpace: 'pre-wrap' }}>{item.item_name}</td>
                <td className="col-prop">{item.property_number}</td>
                <td className="col-date">{shortDate(item.acquisition_date)}</td>
                <td className="col-amt">{formatAmount(item.total_cost ?? item.qty * item.unit_cost)}</td>
              </tr>
            ) : (
              <tr key={index} className="empty-row">
                <td className="col-qty"></td>
                <td className="col-unit"></td>
                <td className="col-desc"></td>
                <td className="col-prop"></td>
                <td className="col-date"></td>
                <td className="col-amt"></td>
              </tr>
            )
          )}
          {/* TOTAL ROW */}
          <tr className="par-total-row">
            <th colSpan={5}>TOTAL</th>
            <th className="col-amt" style={{ paddingRight: 8 }}>{formatAmount(grandTotal)}</th>
          </tr>
        </tbody>
      </table>

      {/* SIGNATURES */}
      <div className="par-signatures">
        {/* Left - Received By */}
        <div className="par-sig-box">
          <div className="par-sig-label">Received by:</div>
          <div className="par-sig-content">
            <div className="par-sig-name">{mr.accountable_officer || ""}</div>
            <div className="par-sig-subtext">{mr.position && mr.office ? `${mr.position} / ${mr.office}` : (mr.position || mr.office || "Administrative Aide VI (Clerk III)")}</div>
            <div className="par-sig-subtext">Position/Office</div>
            <div className="par-sig-subtext" style={{ marginTop: 10 }}>{formatDate(mr.date_issued)}</div>
            <div className="par-sig-subtext">Date</div>
          </div>
        </div>

        {/* Right - Issued By */}
        <div className="par-sig-box">
          <div className="par-sig-label">Issued by:</div>
          <div className="par-sig-content">
            <div className="par-sig-name">{mr.received_from || mr.issued_by || "RONALD F. GUTIERREZ"}</div>
            <div className="par-sig-subtext">ADMINISTRATIVE OFFICER I /SUPPLY OFFICER I</div>
            <div className="par-sig-subtext">Position/Office</div>
            <div className="par-sig-subtext" style={{ marginTop: 10 }}>{formatDate(mr.date_issued)}</div>
            <div className="par-sig-subtext">Date</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PARForm;
