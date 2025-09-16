using System.Threading.Tasks;
using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Services
{
    public interface IAuthService
    {
        Task<User?> AuthenticateAsync(string email, string password);
        Task<string> GenerateJwtToken(User user);
        Task<string> HashPassword(string password);
        Task<bool> VerifyPassword(string enteredPassword, string storedHash);
    }
}
