import { OrderStatus, PaymentStatus } from "@prisma/client";

const statusLabelMap: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const paymentLabelMap: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const sendOrderStatusTemplate = (data: {
  customerName?: string | null;
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
}) => {
  const subject = `Order Update: ${statusLabelMap[data.status]}`;
  const orderCode = data.orderId.slice(-6).toUpperCase();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Order Status Update</title>
</head>
<body style="margin:0; padding:0; background:#f5f7fb; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="background:#0f766e; padding:20px 28px; color:#ffffff;">
              <h2 style="margin:0; font-size:22px;">Your order status has been updated</h2>
            </td>
          </tr>
          <tr>
            <td style="padding:28px; color:#334155; font-size:15px; line-height:1.6;">
              <p style="margin-top:0;">Hello ${data.customerName || "Customer"},</p>
              <p>Your order is now at the following stage.</p>
              <p style="margin:18px 0; padding:16px; background:#f8fafc; border-radius:10px;">
                <strong>Order ID:</strong> #${orderCode}<br />
                <strong>Status:</strong> ${statusLabelMap[data.status]}<br />
                <strong>Payment:</strong> ${paymentLabelMap[data.paymentStatus]}<br />
                <strong>Total:</strong> BDT ${data.totalAmount.toFixed(2)}
              </p>
              <p>You can check your account for more details.</p>
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
