using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body);
    }

    public class EmailService : IEmailService
    {
        public Task SendEmailAsync(string to, string subject, string body)
        {
            // TODO: Add real email sending (e.g., SMTP, SendGrid)
            return Task.CompletedTask;
        }
    }
}
