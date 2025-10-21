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

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY")
                         ?? _configuration["SendGrid:ApiKey"];

            if (!string.IsNullOrEmpty(apiKey))
            {
                // Send email with SendGrid
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
