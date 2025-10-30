using System.Net;
using System.Net.Sockets;

namespace FleetManagerPro.API.Services
{
    public interface IEmailDomainValidator
    {
        Task<(bool IsValid, string Message)> ValidateEmailDomain(string email);
    }

    public class EmailDomainValidator : IEmailDomainValidator
    {
        private readonly ILogger<EmailDomainValidator> _logger;

        public EmailDomainValidator(ILogger<EmailDomainValidator> logger)
        {
            _logger = logger;
        }

        public async Task<(bool IsValid, string Message)> ValidateEmailDomain(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                {
                    return (false, "Invalid email format");
                }

                var domain = email.Split('@')[1].ToLower().Trim();

                _logger.LogInformation($"Validating domain: {domain}");

                if (IsCommonEmailProvider(domain))
                {
                    _logger.LogInformation($"Domain is a known email provider: {domain}");
                    return (true, "Email domain is valid");
                }

                _logger.LogWarning($"Domain not in approved list: {domain}");
                return (false, "Please use a recognized email provider (Gmail, Yahoo, Outlook, etc.)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error validating email domain: {email}");
                return (false, "Unable to verify email domain. Please check your email address.");
            }
        }

        private bool IsCommonEmailProvider(string domain)
        {
            var commonProviders = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "gmail.com",
                "yahoo.com",
                "evocargoexpress.com",
            };

            return commonProviders.Contains(domain);
        }
    }
}
