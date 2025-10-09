using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

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
        private readonly HttpClient _httpClient;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger, IHttpClientFactory httpClientFactory)
        {
            _configuration = configuration;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var apiKey = Environment.GetEnvironmentVariable("BREVO_API_KEY")
                         ?? _configuration["EmailSettings:BrevoApiKey"];

            try
            {
                var payload = new
                {
                    sender = new
                    {
                        name = _configuration["EmailSettings:SenderName"] ?? "FleetManagerPro",
                        email = "noreply@fleetmanagerpro.com" // Can be any email - Brevo doesn't require verification
                    },
                    to = new[]
                    {
                        new { email = toEmail }
                    },
                    subject = subject,
                    htmlContent = body
                };

                var jsonContent = JsonSerializer.Serialize(payload);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

                var response = await _httpClient.PostAsync("https://api.brevo.com/v3/smtp/email", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Brevo API failed: {Status} - {Error}", response.StatusCode, error);
                    throw new Exception($"Brevo API failed: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
                throw;
            }
        }
    }
}
