using FleetManagerPro.API.Models;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Services
{
    public interface IAuthService
    {
        Task<string> GenerateJwtToken(User user);
        Task<string> HashPassword(string password);
        Task<bool> VerifyPassword(string password, string passwordHash);
        Task<User?> GetUserByEmailAsync(string email);
    }
}