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
                // Basic format check
                if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                {
                    return (false, "Invalid email format");
                }

                // Extract domain from email
                var domain = email.Split('@')[1].ToLower().Trim();

                _logger.LogInformation($"Validating domain: {domain}");

                // Check if domain has MX records (Mail Exchange records)
                var hasMxRecords = await CheckMxRecords(domain);

                if (!hasMxRecords)
                {
                    // If no MX records, try to check if domain exists via A record
                    var domainExists = await CheckDomainExists(domain);

                    if (!domainExists)
                    {
                        _logger.LogWarning($"Domain does not exist: {domain}");
                        return (false, "Email domain does not exist or is not configured to receive emails");
                    }

                    _logger.LogWarning($"Domain exists but has no MX records: {domain}");
                    return (false, "Email domain is not configured to receive emails");
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

        private async Task<bool> CheckMxRecords(string domain)
        {
            try
            {
                // Use DNS lookup to check for MX records
                var hostEntry = await Dns.GetHostEntryAsync(domain);

                // Try to resolve MX records using nslookup command
                var process = new System.Diagnostics.Process
                {
                    StartInfo = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = "nslookup",
                        Arguments = $"-type=MX {domain}",
                        RedirectStandardOutput = true,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    }
                };

                process.Start();
                var output = await process.StandardOutput.ReadToEndAsync();
                await process.WaitForExitAsync();

                // Check if MX records exist in output
                var hasMx = output.Contains("mail exchanger") || output.Contains("MX preference");

                _logger.LogInformation($"MX record check for {domain}: {hasMx}");
                return hasMx;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"MX record check failed for {domain}, trying A record");
                return false;
            }
        }

        private async Task<bool> CheckDomainExists(string domain)
        {
            try
            {
                // Check if domain resolves to an IP address (A record)
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
