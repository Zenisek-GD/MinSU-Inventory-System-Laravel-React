/**
 * BorrowerSlip.jsx
 * Renders an official MinSU Borrower's Slip printable form.
 * Trigger with window.print() after mounting inside a print container,
 * or open in a new browser tab for the user to print.
 */
import React from 'react';

const SLIP_ROWS = 12; // number of blank rows in the item table

const styles = {
    page: {
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        color: '#000',
        background: '#fff',
        padding: '18px 24px',
        maxWidth: '800px',
        margin: '0 auto',
        boxSizing: 'border-box',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '2px solid #000',
        paddingBottom: '8px',
        marginBottom: '6px',
    },
    logoBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flex: 1,
    },
    logoImg: {
        width: '56px',
        height: '56px',
        objectFit: 'contain',
    },
    universityText: {
        textAlign: 'center',
        flex: 1,
    },
    uniName: {
        fontSize: '17px',
        fontWeight: 'bold',
        margin: 0,
        letterSpacing: '1px',
    },
    uniAddress: {
        fontSize: '9px',
        margin: '1px 0',
        color: '#333',
    },
    formNum: {
        fontSize: '9px',
        fontWeight: 'bold',
        textAlign: 'right',
        whiteSpace: 'nowrap',
    },
    docTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '13px',
        textDecoration: 'underline',
        margin: '8px 0 6px',
        letterSpacing: '2px',
    },
    section: {
        margin: '4px 0',
        fontSize: '11px',
    },
    label: {
        fontWeight: 'bold',
    },
    checkRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginLeft: '16px',
        fontSize: '11px',
    },
    checkBox: {
        width: '11px',
        height: '11px',
        border: '1px solid #000',
        display: 'inline-block',
        marginRight: '4px',
        verticalAlign: 'middle',
        flexShrink: 0,
    },
    checkedBox: {
        width: '11px',
        height: '11px',
        border: '1px solid #000',
        display: 'inline-block',
        marginRight: '4px',
        verticalAlign: 'middle',
        flexShrink: 0,
        background: '#000',
    },
    borrowerNote: {
        margin: '6px 0',
        fontSize: '11px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        border: '1px solid #000',
        margin: '6px 0',
    },
    th: {
        border: '1px solid #000',
        padding: '4px 6px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '10px',
        background: '#f0f0f0',
    },
    td: {
        border: '1px solid #000',
        padding: '0 4px',
        height: '20px',
        fontSize: '10px',
    },
    tdCenter: {
        border: '1px solid #000',
        padding: '0 4px',
        height: '20px',
        fontSize: '10px',
        textAlign: 'center',
    },
    purposeRow: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        margin: '6px 0',
        fontSize: '11px',
    },
    underline: {
        flex: 1,
        borderBottom: '1px solid #000',
        minHeight: '14px',
    },
    termsBox: {
        margin: '8px 0',
        fontSize: '10.5px',
    },
    termsTitle: {
        fontWeight: 'bold',
        marginBottom: '2px',
    },
    sigGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        border: '1px solid #000',
        marginTop: '10px',
    },
    sigCell: {
        border: '1px solid #000',
        padding: '4px 8px',
        fontSize: '10px',
    },
    sigLabel: {
        fontWeight: 'bold',
        display: 'block',
        marginBottom: '2px',
        textAlign: 'center',
        fontSize: '10.5px',
    },
    sigLine: {
        display: 'flex',
        alignItems: 'flex-end',
        gap: '4px',
        marginTop: '2px',
        fontSize: '10px',
    },
    sigLineLabel: {
        whiteSpace: 'nowrap',
    },
    sigLineValue: {
        flex: 1,
        borderBottom: '1px solid #000',
        minHeight: '14px',
        fontSize: '10px',
        paddingLeft: '2px',
    },
    issuedName: {
        fontWeight: 'bold',
        textAlign: 'center',
        display: 'block',
        margin: '18px 0 2px',
        fontSize: '11px',
    },
    issuedTitle: {
        textAlign: 'center',
        display: 'block',
        fontSize: '10px',
    },
    footer: {
        marginTop: '10px',
        borderTop: '1px solid #666',
        paddingTop: '6px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        fontSize: '9px',
        color: '#555',
    },
};

/**
 * @param {object} props
 * @param {object[]} props.borrows  – array of borrow records to include in the slip
 * @param {string}  props.borrowerName
 * @param {string}  props.borrowerDesignation
 * @param {boolean} props.availableYes – custodian: availability = yes
 */
export default function BorrowerSlip({ borrows = [], borrowerName = '', borrowerDesignation = '', availableYes = true }) {
    const formatDateTime = (dt) => {
        if (!dt) return '';
        try {
            return new Date(dt).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch { return dt; }
    };

    const today = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

    // Pad rows to at least SLIP_ROWS
    const rows = [...borrows];
    while (rows.length < SLIP_ROWS) rows.push(null);

    return (
        <div style={styles.page}>

            {/* ── University Header ───────────────────────────────────────────── */}
            <div style={styles.header}>
                {/* Left logo placeholder */}
                <div style={{ width: 60, height: 60, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999', flexShrink: 0 }}>
                    LOGO
                </div>

                <div style={styles.universityText}>
                    <p style={styles.uniName}>MINDORO STATE UNIVERSITY</p>
                    <p style={styles.uniAddress}>Victoria, Oriental Mindoro 5205, Philippines</p>
                    <p style={styles.uniAddress}>www.minsu.edu.ph &nbsp;|&nbsp; info@admin.minsu.edu.ph &nbsp;|&nbsp; +63 (043) 200-0000</p>
                </div>

                {/* Right logo placeholder */}
                <div style={{ width: 60, height: 60, border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999', flexShrink: 0 }}>
                    SEAL
                </div>
            </div>

            {/* form number */}
            <div style={{ textAlign: 'right', fontSize: '9px', marginBottom: '2px' }}>MRC-B01G</div>

            {/* ── Document Title ──────────────────────────────────────────────── */}
            <div style={styles.docTitle}>BORROWER'S SLIP</div>

            {/* ── Custodian Section ───────────────────────────────────────────── */}
            <div style={styles.section}>
                <span style={styles.label}>For Custodian:</span>
            </div>
            <div style={styles.checkRow}>
                <span>Availability of Equipment:</span>
                <span>
                    <span style={availableYes ? styles.checkedBox : styles.checkBox} />
                    YES
                </span>
                <span>
                    <span style={!availableYes ? styles.checkedBox : styles.checkBox} />
                    NO
                </span>
            </div>

            {/* ── Borrower Section ────────────────────────────────────────────── */}
            <div style={{ ...styles.borrowerNote, marginTop: '8px' }}>
                <span style={styles.label}>For Borrower:</span>
            </div>
            <div style={{ ...styles.borrowerNote, marginLeft: '16px', fontStyle: 'italic', fontSize: '10.5px' }}>
                I acknowledge to have received from the <strong>SCHOOL'S PROPERTY</strong> of the <strong>MinSU Bongabong Campus</strong> the following:
            </div>

            {/* ── Items Table ─────────────────────────────────────────────────── */}
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={{ ...styles.th, width: '28%' }}>Item/s</th>
                        <th style={{ ...styles.th, width: '6%' }}>QTY</th>
                        <th style={{ ...styles.th, width: '17%' }}>Time/Date<br />(Released)</th>
                        <th style={{ ...styles.th, width: '17%' }}>Time/Date (Expected<br />to return)</th>
                        <th style={{ ...styles.th, width: '17%' }}>Time/Date<br />(Returned)</th>
                        <th style={{ ...styles.th, width: '15%' }}>Remarks</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((b, idx) => (
                        <tr key={idx}>
                            <td style={styles.td}>{b?.item?.name || ''}</td>
                            <td style={styles.tdCenter}>{b ? (b.quantity || 1) : ''}</td>
                            <td style={styles.tdCenter}>{b ? formatDateTime(b.borrow_date || b.created_at) : ''}</td>
                            <td style={styles.tdCenter}>{b ? formatDateTime(b.expected_return_date) : ''}</td>
                            <td style={styles.tdCenter}>{b?.returned_at ? formatDateTime(b.returned_at) : ''}</td>
                            <td style={styles.td}>{b?.notes || ''}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* ── Purpose ─────────────────────────────────────────────────────── */}
            <div style={styles.purposeRow}>
                <span style={styles.label}>Purpose:</span>
                <span style={styles.underline}>
                    {borrows.length > 0 ? borrows[0].purpose || '' : ''}
                </span>
            </div>
            <div style={{ ...styles.purposeRow, marginTop: '0' }}>
                <span style={{ ...styles.underline, marginLeft: '54px' }}></span>
            </div>

            {/* ── Terms & Conditions ──────────────────────────────────────────── */}
            <div style={styles.termsBox}>
                <div style={styles.termsTitle}>TERMS and CONDITIONS:</div>
                <div>That I (the borrower) shall:</div>
                <ol style={{ margin: '2px 0 0 18px', padding: 0, listStyleType: 'decimal' }}>
                    <li>Personally return <strong>IMMEDIATELY</strong> after use <strong>ALL</strong> borrowed items listed above to make it/them available for other users;</li>
                    <li>Make sure to check the completeness and cleanliness of items borrowed;</li>
                    <li>Be held responsible for <strong>LOSS &amp; DAMAGES</strong> while the items are in my custody; and</li>
                    <li><strong>REPORT</strong> and <strong>REPLACE</strong> the item(s) lost or damaged.</li>
                </ol>
            </div>

            {/* ── Signature Section ───────────────────────────────────────────── */}
            <div style={styles.sigGrid}>
                {/* Borrowed by */}
                <div style={styles.sigCell}>
                    <span style={styles.sigLabel}>Borrowed by:</span>
                    {[['Signature:', ''], ['Name:', borrowerName], ['Designation:', borrowerDesignation], ['Date:', today]].map(([lbl, val]) => (
                        <div key={lbl} style={styles.sigLine}>
                            <span style={styles.sigLineLabel}>{lbl}</span>
                            <span style={styles.sigLineValue}>{val}</span>
                        </div>
                    ))}
                </div>

                {/* Issued by */}
                <div style={styles.sigCell}>
                    <span style={styles.sigLabel}>Issued by:</span>
                    <span style={styles.issuedName}>RONALD F. GUTIERREZ</span>
                    <span style={styles.issuedTitle}>Supply Officer I</span>
                </div>

                {/* Noted by */}
                <div style={styles.sigCell}>
                    <span style={styles.sigLabel}>Noted by:</span>
                    <span style={styles.issuedName}>MARY JEANE S. LUBOS, Ph.D.</span>
                    <span style={styles.issuedTitle}>Campus Executive Director</span>
                </div>
            </div>

            {/* ── Footer campus list ───────────────────────────────────────────── */}
            <div style={styles.footer}>
                <span>• Main Campus, Alcate, Victoria</span>
                <span>• Bongabong Campus, Labasan, Bongabong</span>
                <span>• Calapan City Campus, Masipit, Calapan City</span>
            </div>

        </div>
    );
}
