import { BorrowerFlag } from '../../applications/enums/application.enums';

const FLAG_LABELS: Record<BorrowerFlag, string> = {
  [BorrowerFlag.JOINT_APPLICATION_DETECTED]:
    'Joint application detected — verify co-borrower identity',
  [BorrowerFlag.ADDRESS_DISCREPANCY]:
    'Address discrepancy across documents — manual review required',
  [BorrowerFlag.INCOME_VARIANCE]:
    'Income variance detected — cross-check income sources',
  [BorrowerFlag.LOW_EXTRACTION_CONFIDENCE]:
    'Some fields have low extraction confidence — verify manually',
  [BorrowerFlag.MISSING_SSN]:
    'SSN could not be extracted — borrower follow-up needed',
};

export function extractionCompleteHtml(params: {
  borrowerName: string;
  applicationId: string;
  flags: BorrowerFlag[];
  reviewUrl: string;
}): string {
  const { borrowerName, applicationId, flags, reviewUrl } = params;
  const shortId = applicationId.slice(0, 8).toUpperCase();
  const hasFlags = flags.length > 0;

  const flagsSection = hasFlags
    ? `
      <!-- Flags -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin:0 0 28px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 10px;color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">
              &#9888;&nbsp; ${flags.length} item${flags.length > 1 ? 's' : ''} require${flags.length === 1 ? 's' : ''} your attention
            </p>
            <ul style="margin:0;padding:0 0 0 18px;color:#78350f;font-size:13px;line-height:1.8;">
              ${flags.map((f) => `<li>${FLAG_LABELS[f]}</li>`).join('\n              ')}
            </ul>
          </td>
        </tr>
      </table>`
    : `
      <!-- All clear -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;margin:0 0 28px;">
        <tr>
          <td style="padding:14px 20px;">
            <p style="margin:0;color:#065f46;font-size:13px;font-weight:600;">
              &#10003;&nbsp; All fields extracted successfully — no issues detected
            </p>
          </td>
        </tr>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application Ready for Review</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#065f46;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <!-- Logo -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="vertical-align:middle;padding-right:10px;">
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="32" height="32" rx="8" fill="#059669"/>
                      <rect x="8" y="9" width="16" height="2" rx="1" fill="white"/>
                      <rect x="8" y="14" width="11" height="2" rx="1" fill="rgba(255,255,255,0.65)"/>
                      <rect x="8" y="19" width="14" height="2" rx="1" fill="rgba(255,255,255,0.65)"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">LoanPro</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Application Ready for Review</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                All documents submitted by <strong>${borrowerName}</strong> have been processed. The structured data has been extracted and is ready for your review in the dashboard.
              </p>

              <!-- Application Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;margin:0 0 20px;overflow:hidden;">
                <tr style="background:#f9fafb;">
                  <td style="padding:12px 20px;border-bottom:1px solid #e5e7eb;">
                    <p style="margin:0;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Borrower</p>
                    <p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">${borrowerName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px;">
                    <p style="margin:0;color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Application ID</p>
                    <p style="margin:4px 0 0;color:#374151;font-size:14px;font-family:monospace;">${shortId}&hellip;</p>
                  </td>
                </tr>
              </table>

              ${flagsSection}

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center">
                    <a href="${reviewUrl}"
                       style="display:inline-block;background:#047857;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Review Application &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If this application was not expected, please contact support. Do not reply to this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;">
                This is an automated message from the loan document portal. Please do not reply.
              </p>
              <p style="margin:0;color:#d1d5db;font-size:11px;">
                &copy; ${new Date().getFullYear()} All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
