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
            var apiKey = Environment.GetEnvironmentVariable("RESEND_API_KEY")
                         ?? _configuration["EmailSettings:ResendApiKey"];

            try
            {
                var payload = new
                {
                    from = _configuration["EmailSettings:SenderEmail"],
                    to = new[] { toEmail },
                    subject = subject,
                    html = body
                };

                var jsonContent = JsonSerializer.Serialize(payload);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

                var response = await _httpClient.PostAsync("https://api.resend.com/emails", content);

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Resend API failed: {Status} - {Error}", response.StatusCode, error);
                    throw new Exception($"Resend API failed: {response.StatusCode}");
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
