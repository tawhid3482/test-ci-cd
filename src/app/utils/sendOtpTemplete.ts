// utils/emailTemplates/sendOtpTemplate.ts
export const sendOtpTemplate = (data: {
  name?: string;
  otp: string;
  expiresIn?: string;
}) => {
  const subject = "🔐 Your OTP Code";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d7539ff,#d11372ff); padding:20px 30px;">
              <h2 style="margin:0; color:#ffffff;">OTP Verification</h2>
              <p style="margin:5px 0 0; color:#ffe6d1; font-size:14px;">
                Secure login for Your Tuition
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#374151; font-size:15px;">
              <p>Hi ${data.name ?? "there"},</p>

              <p>
                Your One-Time Password (OTP) is:
              </p>

              <div style="margin:25px 0; text-align:center;">
                <span style="
                  display:inline-block;
                  font-size:28px;
                  letter-spacing:6px;
                  font-weight:bold;
                  background:#f9fafb;
                  padding:15px 25px;
                  border-radius:8px;
                  color:#04693f;
                  border:1px dashed #04693f;
                ">
                  ${data.otp}
                </span>
              </div>

              <p>
                This OTP will expire in <strong>${data.expiresIn ?? "5 minutes"}</strong>.
              </p>

              <p style="color:#6b7280; font-size:13px;">
                If you didn’t request this, please ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:15px 30px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} Your Tuition
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return { subject, html };
};
