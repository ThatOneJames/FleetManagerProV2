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

                var domainExists = await CheckDomainExists(domain);

                if (!domainExists)
                {
                    _logger.LogWarning($"Domain does not exist: {domain}");
                    return (false, "Email domain does not exist");
                }

                _logger.LogInformation($"Domain validated successfully: {domain}");
                return (true, "Email domain is valid");
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
                "outlook.com",
                "hotmail.com",
                "live.com",
                "msn.com",
                "icloud.com",
                "aol.com",
                "mail.com",
                "protonmail.com",
                "zoho.com",
                "yandex.com",
                "gmx.com",
                "yahoo.co.uk",
                "yahoo.co.jp",
                "yahoo.fr",
                "outlook.co.uk",
                "outlook.fr",
                "outlook.jp",
                "googlemail.com",
                "me.com",
                "mac.com"
            };

            return commonProviders.Contains(domain);
        }

        private async Task<bool> CheckDomainExists(string domain)
        {
            try
            {
                var addresses = await Dns.GetHostAddressesAsync(domain);
                var exists = addresses != null && addresses.Length > 0;

                _logger.LogInformation($"Domain existence check for {domain}: {exists}");
                return exists;
            }
            catch (SocketException)
            {
                _logger.LogWarning($"Domain does not exist: {domain}");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking domain existence: {domain}");
                return false;
            }
        }
    }
}
