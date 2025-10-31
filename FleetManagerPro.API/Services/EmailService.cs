using System.Net;
using System.Net.Mail;
using SendGrid;
using SendGrid.Helpers.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FleetManagerPro.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
        Task SendVerificationEmailAsync(string email, string name, string token);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendVerificationEmailAsync(string email, string name, string token)
        {
            try
            {
                var appUrl = _configuration["AppUrl"] ?? "http://localhost:4200";
                var verificationLink = $"{appUrl}/verify-email?email={Uri.EscapeDataString(email)}&token={token}";

                var subject = "Verify Your FleetManagerPro Account";
                var body = $@"
                    <!DOCTYPE html>
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;'>
                            <div style='background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;'>
                                <h2>FleetManagerPro</h2>
                            </div>
                            <div style='padding: 20px;'>
                                <h3>Welcome, {name}!</h3>
                                <p>Thank you for registering with FleetManagerPro. Please verify your email address to activate your account.</p>
                                <p>Click the button below to verify your email:</p>
                                <p style='margin: 30px 0;'>
                                    <a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verify Email</a>
                                </p>
                                <p style='margin-top: 20px; font-size: 12px; color: #666;'>
                                    Or copy and paste this link in your browser:<br/>
                                    <small>{verificationLink}</small>
                                </p>
                                <p style='margin-top: 20px; font-size: 12px; color: #999;'>This link expires in 24 hours.</p>
                            </div>
                            <div style='padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;'>
                                <p>&copy; 2025 FleetManagerPro. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                await SendEmailAsync(email, subject, body);
                _logger.LogInformation($"[EMAIL] Verification email sent to: {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"[EMAIL] Error sending verification email: {ex.Message}");
                throw;
            }
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY")
                         ?? _configuration["SendGrid:ApiKey"];

            if (!string.IsNullOrEmpty(apiKey))
            {
                // Send email with SendGrid
                try
                {
                    var client = new SendGridClient(apiKey);

                    var from = new EmailAddress(
                        Environment.GetEnvironmentVariable("EMAIL_SENDER_EMAIL")
                        ?? _configuration["EmailSettings:SenderEmail"],
                        Environment.GetEnvironmentVariable("EMAIL_SENDER_NAME")
                        ?? _configuration["EmailSettings:SenderName"]);

                    var to = new EmailAddress(toEmail);
                    var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent: null, htmlContent: body);

                    var response = await client.SendEmailAsync(msg);

                    if (response.IsSuccessStatusCode)
                    {
                        _logger.LogInformation("SendGrid: Email sent successfully to {Email}", toEmail);
                    }
                    else
                    {
                        _logger.LogError("SendGrid: Failed to send email to {Email}. Status: {Status}", toEmail, response.StatusCode);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"[EMAIL] SendGrid Error: {ex.Message}");
                    throw;
                }
            }
            else
            {
                // Fallback to SMTP Gmail
                var smtpServer = _configuration["EmailSettings:SmtpServer"];
                var smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
                var senderEmail = _configuration["EmailSettings:SenderEmail"];
                var senderName = _configuration["EmailSettings:SenderName"];
                var username = _configuration["EmailSettings:Username"];
                var password = _configuration["EmailSettings:Password"];

                try
                {
                    using var client = new SmtpClient(smtpServer, smtpPort)
                    {
                        Credentials = new NetworkCredential(username, password),
                        EnableSsl = true
                    };

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail, senderName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(toEmail);

                    await client.SendMailAsync(mailMessage);
                    _logger.LogInformation("SMTP: Email sent successfully to {Email}", toEmail);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "SMTP: Failed to send email to {Email}", toEmail);
                    throw;
                }
            }
        }
    }
}
