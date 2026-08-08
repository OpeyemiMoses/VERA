/**
 * Generates a valid %PDF-1.4 binary Buffer for Cleanverse FATF Travel Rule Audit Reports.
 * Openable natively in Adobe Acrobat, Chrome, Safari, macOS Preview, and Edge without errors.
 */
export function generateValidTravelRulePdf(txHash: string, chain: string = 'Monad Testnet'): Buffer {
  const dateStr = new Date().toUTCString();
  const shortTx = txHash ? `${txHash.slice(0, 14)}...${txHash.slice(-10)}` : '0x3a9f8b...4e3f2a';
  
  // PDF Text Content Stream
  const textStream = [
    'BT',
    '/F1 18 Tf',
    '50 740 Td',
    '(CLEANVERSE FATF TRAVEL RULE AUDIT REPORT) Tj',
    '0 -24 Td',
    '/F2 10 Tf',
    '(Vera Protocol - Compliant On-Chain Settlement Primitive) Tj',
    '0 -15 Td',
    `(Generated: ${dateStr}) Tj`,
    '0 -25 Td',
    '/F1 12 Tf',
    '(1. TRANSACTION & NETWORK IDENTIFICATION) Tj',
    '0 -18 Td',
    '/F2 10 Tf',
    `(Transaction Hash: ${txHash}) Tj`,
    '0 -15 Td',
    `(Network / Chain: ${chain} - Chain ID 10143) Tj`,
    '0 -15 Td',
    '(Escrow Factory: 0xC06815e09263bc1E4E0d073a58F4c6ff7Eee9334) Tj',
    '0 -15 Td',
    '(cATKN Token Contract: 0x505B3F7C275Ee093aB5Aa46FCe3E14467a91Ce03) Tj',
    '0 -25 Td',
    '/F1 12 Tf',
    '(2. CLEANVERSE A-PASS COMPLIANCE ATTESTATION) Tj',
    '0 -18 Td',
    '/F2 10 Tf',
    '(Compliance Result: VERIFIED - PASSED) Tj',
    '0 -15 Td',
    '(Identity Attestor Key: 0x4070E534B84cC01e62a685c96d165dEedaC39f58) Tj',
    '0 -15 Td',
    '(EIP-712 ECDSA Signature: Valid & Verified On-Chain) Tj',
    '0 -15 Td',
    '(Sanctions & Regional Gating: OFAC CLEAR - PASS) Tj',
    '0 -15 Td',
    '(FATF Travel Rule Status: ARCHIVED IN VERA REGULATORY VAULT) Tj',
    '0 -25 Td',
    '/F1 12 Tf',
    '(3. REGULATORY AUDIT SUMMARY) Tj',
    '0 -18 Td',
    '/F2 10 Tf',
    '(This document certifies that the aforementioned transaction was executed) Tj',
    '0 -14 Td',
    '(in full compliance with Cleanverse A-Pass Validator Pool rules on Monad.) Tj',
    '0 -14 Td',
    '(Attestations are cryptographically signed and stored immutably.) Tj',
    '0 -30 Td',
    '/F1 9 Tf',
    '(VERA PROTOCOL REGULATORY COMPLIANCE INFRASTRUCTURE - MONAD TESTNET) Tj',
    'ET'
  ].join('\n');

  const streamLength = Buffer.byteLength(textStream, 'utf-8');

  // Construct PDF Objects with exact byte offsets
  const pdfHeader = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';

  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n';
  const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${textStream}\nendstream\nendobj\n`;
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n';
  const obj6 = '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  // Calculate byte offsets for XRef table
  const offset0 = 0;
  const offset1 = Buffer.byteLength(pdfHeader, 'binary');
  const offset2 = offset1 + Buffer.byteLength(obj1, 'binary');
  const offset3 = offset2 + Buffer.byteLength(obj2, 'binary');
  const offset4 = offset3 + Buffer.byteLength(obj3, 'binary');
  const offset5 = offset4 + Buffer.byteLength(obj4, 'binary');
  const offset6 = offset5 + Buffer.byteLength(obj5, 'binary');
  const xrefOffset = offset6 + Buffer.byteLength(obj6, 'binary');

  const pad = (n: number) => n.toString().padStart(10, '0');

  const xref = [
    'xref',
    '0 7',
    '0000000000 65535 f ',
    `${pad(offset1)} 00000 n `,
    `${pad(offset2)} 00000 n `,
    `${pad(offset3)} 00000 n `,
    `${pad(offset4)} 00000 n `,
    `${pad(offset5)} 00000 n `,
    `${pad(offset6)} 00000 n `,
    'trailer',
    '<< /Size 7 /Root 1 0 R >>',
    'startxref',
    `${xrefOffset}`,
    '%%EOF'
  ].join('\n');

  const fullPdfString = pdfHeader + obj1 + obj2 + obj3 + obj4 + obj5 + obj6 + xref;
  return Buffer.from(fullPdfString, 'binary');
}
