import { priorityStatus } from "@prisma/client";

interface ContactMailData {
  title: string;
  message: string;
  email: string;
  priority: priorityStatus;
  createdAt?: Date;
}

export const contactMailTemplate = (data: ContactMailData) => {
  const subject = `📩 New Contact Message (${data.priority})`;

  const priorityColor = data.priority === "Urgent" ? "#dc2626" : "#2563eb";

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>New Contact Message</title>
</head>
<body style="margin:0; padding:0; background:#f3f4f6; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d7539ff,#d11372ff); padding:20px 30px;">
              <h2 style="margin:0; color:#ffffff;">New Contact Message</h2>
              <p style="margin:5px 0 0; color:#ffe6d1; font-size:14px;">
                TR Tuition Contact Form
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#374151; font-size:15px;">
              <p><strong>Title:</strong> ${data.title}</p>

              <p>
                <strong>Priority:</strong>
                <span style="
                  color:#ffffff;
                  background:${priorityColor};
                  padding:4px 10px;
                  border-radius:999px;
                  font-size:12px;
                ">
                  ${data.priority}
                </span>
              </p>

              <p><strong>Sender Email:</strong> ${data.email}</p>

              <hr style="border:none; border-top:1px solid #e5e7eb; margin:20px 0;" />

              <p style="white-space:pre-line;">
                ${data.message}
              </p>

              <p style="margin-top:25px; font-size:13px; color:#6b7280;">
                Received at: ${data.createdAt?.toLocaleString() ?? "Just now"}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:15px 30px; text-align:center;">
              <p style="margin:0; font-size:12px; color:#9ca3af;">
                © ${new Date().getFullYear()} TR Tuition
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
