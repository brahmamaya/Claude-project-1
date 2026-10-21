// MVP: log the OTP to the server console. Replace with SES / MSG91 / Resend before launch.
export async function sendOtp(email: string, code: string) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("sendOtp: configure an email/SMS provider in src/lib/mail.ts");
  }
  console.log(`\n[DEV OTP] ${email} -> ${code}\n`);
}
