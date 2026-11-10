import { Injectable, Logger } from "@nestjs/common";
import type { ApiEnvironment } from "../config.js";

export interface VerificationEmailPayload {
  to: string;
  token: string;
  expiresAt: Date;
}

export interface EmailDeliveryResult {
  accepted: boolean;
  messageId?: string;
  providerResponse?: unknown;
}

@Injectable()
export class BrevoEmailAdapter {
  private readonly logger = new Logger(BrevoEmailAdapter.name);
  private readonly apiKey: string;
  private readonly senderEmail: string;
  private readonly senderName: string;
  private readonly baseUrl = "https://api.brevo.com/v3/smtp/email";

  constructor(environment: Pick<ApiEnvironment, "EMAIL_BREVO_API_KEY" | "EMAIL_SENDER_EMAIL" | "EMAIL_SENDER_NAME">) {
    this.apiKey = environment.EMAIL_BREVO_API_KEY;
    this.senderEmail = environment.EMAIL_SENDER_EMAIL;
    this.senderName = environment.EMAIL_SENDER_NAME;
  }

  async sendVerificationEmail(payload: VerificationEmailPayload): Promise<EmailDeliveryResult> {
    const verificationUrl = `${this.getAppOrigin()}/verify-email?token=${encodeURIComponent(payload.token)}`;
    const expiresAt = payload.expiresAt.toISOString();

    const htmlContent = this.buildVerificationHtml(payload.token, verificationUrl, expiresAt);
    const textContent = this.buildVerificationText(payload.token, verificationUrl, expiresAt);

    const body = {
      sender: { email: this.senderEmail, name: this.senderName },
      to: [{ email: payload.to }],
      subject: "Verify your MakeMyMarrige account",
      htmlContent,
      textContent,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        this.logger.warn({ status: response.status, body: result }, "brevo_verification_email_failed");
        return { accepted: false, providerResponse: result };
      }

      this.logger.debug({ messageId: result.messageId }, "brevo_verification_email_sent");
      return { accepted: true, messageId: result.messageId, providerResponse: result };
    } catch (error) {
      this.logger.error({ error: error instanceof Error ? error.message : String(error) }, "brevo_verification_email_exception");
      return { accepted: false };
    }
  }

  private buildVerificationHtml(token: string, url: string, expiresAt: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #282522; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #FAF8F4; border-radius: 8px; padding: 32px;">
            <h1 style="color: #7A2E42; font-family: 'Playfair Display', Georgia, serif; margin-bottom: 24px;">Verify your email</h1>
            <p style="margin-bottom: 16px;">Welcome to MakeMyMarrige. Please verify your email address to activate your account.</p>
            <p style="margin-bottom: 24px;">Your verification token: <strong style="font-family: monospace; background: #EAE4DA; padding: 4px 8px; border-radius: 4px;">${token}</strong></p>
            <p style="margin-bottom: 24px;">Or click the link below (expires ${new Date(expiresAt).toLocaleString()}):</p>
            <p style="text-align: center; margin: 24px 0;">
              <a href="${url}" style="display: inline-block; background: #7A2E42; color: #FFFFFF; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: 500;">Verify Email</a>
            </p>
            <hr style="border: none; border-top: 1px solid #EAE4DA; margin: 24px 0;" />
            <p style="font-size: 12px; color: #77716B;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;
  }

  private buildVerificationText(token: string, url: string, expiresAt: string): string {
    return `
Verify your MakeMyMarrige account

Welcome to MakeMyMarrige. Please verify your email address to activate your account.

Your verification token: ${token}

Or visit this link (expires ${new Date(expiresAt).toLocaleString()}):
${url}

If you didn't create an account, you can safely ignore this email.
    `.trim();
  }

  private getAppOrigin(): string {
    return process.env.APP_ORIGIN ?? "http://localhost:3000";
  }
}