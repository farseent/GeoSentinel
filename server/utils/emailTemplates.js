const resultReadyEmail = ({ userName, requestId, dateFrom, dateTo, changePercentage }) => {
  const formattedFrom = new Date(dateFrom).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const formattedTo   = new Date(dateTo).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const shortId       = requestId.slice(-8).toUpperCase();

  return {
    subject: `🛰️ Your Change Detection Results Are Ready — #${shortId}`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:36px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:8px;">🛰️</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                GeoSentinel
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                Satellite Change Detection Platform
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#374151;font-size:15px;">
                Hi <strong>${userName}</strong>,
              </p>
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.6;">
                Your satellite change detection analysis has been completed successfully.
                Here's a summary of your request:
              </p>

              <!-- Info Card -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                          <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Request ID</span><br/>
                          <span style="color:#111827;font-size:14px;font-weight:600;font-family:monospace;">#${shortId}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                          <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date 1 (Before)</span><br/>
                          <span style="color:#111827;font-size:14px;font-weight:600;">${formattedFrom}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;border-bottom:1px solid #e9ecef;">
                          <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Date 2 (After)</span><br/>
                          <span style="color:#111827;font-size:14px;font-weight:600;">${formattedTo}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <span style="color:#9ca3af;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Change Detected</span><br/>
                          <span style="color:#2563eb;font-size:20px;font-weight:700;">${changePercentage}%</span>
                          <span style="color:#6b7280;font-size:12px;margin-left:4px;">of selected area</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="http://localhost:3000/results/${requestId}"
                      style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                      View Full Results →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;text-align:center;">
                Results include binary map, heatmap, overlays, contours, and more.<br/>
                All outputs are available for download on the results page.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e9ecef;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                © 2025 GeoSentinel · Satellite Change Detection Platform<br/>
                Department of Computer Science, IET, University of Calicut
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `
  };
};

module.exports = { resultReadyEmail };