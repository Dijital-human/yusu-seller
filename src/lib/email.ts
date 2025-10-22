import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const msg = {
      to: options.to,
      from: process.env.FROM_EMAIL || 'noreply@yusu.com',
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await sgMail.send(msg);
    console.log('Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
}

// Password reset email template
export function generatePasswordResetEmail(resetToken: string, userEmail: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`;
  
  return {
    to: userEmail,
    subject: 'Şifrə Bərpa / Password Reset - Yusu',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Şifrə Bərpa / Password Reset</h1>
        <p>Salam / Hello,</p>
        <p>Şifrənizi bərpa etmək üçün aşağıdakı linkə klik edin:</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Şifrəni Bərpa Et / Reset Password
        </a>
        <p style="margin-top: 20px; color: #666;">
          Bu link 1 saat etibarlıdır. / This link is valid for 1 hour.
        </p>
        <p style="color: #666;">
          Əgər siz bu tələbi göndərməmisinizsə, bu email-i gözardı edin. / If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `Şifrə Bərpa / Password Reset\n\nŞifrənizi bərpa etmək üçün: ${resetUrl}\n\nBu link 1 saat etibarlıdır.`
  };
}
