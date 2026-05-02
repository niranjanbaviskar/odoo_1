import nodemailer from "nodemailer";

function getTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
    });
}

async function sendMail(to: string, subject: string, html: string) {
    const transporter = getTransporter();

    if (!transporter) {
        console.info(`[mail:mock] ${subject} -> ${to}`);
        return true;
    }

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        html,
    });

    return true;
}

export async function sendOtpEmail(to: string, otp: string, purpose: "verify-email" | "reset-password") {
    const label = purpose === "verify-email" ? "Verify your email" : "Reset your password";
    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>${label}</h2>
      <p>Your OTP code is:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:700">${otp}</div>
      <p>This code expires in 10 minutes.</p>
    </div>
  `;

    return sendMail(to, label, html);
}

export async function sendBookingConfirmationEmail(to: string, booking: { serviceName: string; date: string; time: string; providerName: string; status: string }) {
    const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Your booking is ${booking.status}</h2>
      <p><strong>Service:</strong> ${booking.serviceName}</p>
      <p><strong>Date:</strong> ${booking.date}</p>
      <p><strong>Time:</strong> ${booking.time}</p>
      <p><strong>Provider:</strong> ${booking.providerName}</p>
    </div>
  `;

    return sendMail(to, "Appointment booking confirmation", html);
}
