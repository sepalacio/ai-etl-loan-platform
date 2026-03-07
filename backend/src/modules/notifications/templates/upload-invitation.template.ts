export function uploadInvitationHtml(params: {
  borrowerName: string;
  requestedAmount: number;
  uploadUrl: string;
}): string {
  const { borrowerName, requestedAmount, uploadUrl } = params;
  const formattedAmount = requestedAmount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Upload Your Loan Documents</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#1e40af;border-radius:8px 8px 0 0;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#93c5fd;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Secure Document Portal</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">Action Required</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Hello,</p>
              <h2 style="margin:0 0 24px;color:#111827;font-size:22px;font-weight:700;">${borrowerName}</h2>

              <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
                Your lender has opened a loan application on your behalf and is requesting that you securely upload your supporting documents to move forward.
              </p>

              <!-- Application Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin:0 0 28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Requested Loan Amount</p>
                    <p style="margin:0;color:#111827;font-size:26px;font-weight:700;">${formattedAmount}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;color:#374151;font-size:15px;line-height:1.6;">
                Please click the button below to access your secure upload portal. You will be able to submit all required documents directly from your browser — no account required.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr>
                  <td align="center">
                    <a href="${uploadUrl}"
                       style="display:inline-block;background:#1e40af;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.3px;">
                      Upload My Documents &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:0 6px 6px 0;margin:0 0 28px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;color:#1e40af;font-size:13px;line-height:1.5;">
                      <strong>Security notice:</strong> This link is unique to your application and expires after use. Never share it with anyone. Your lender will never ask for your login credentials via email.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                If you have questions about your application, please contact your lender directly. Do not reply to this email.
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
