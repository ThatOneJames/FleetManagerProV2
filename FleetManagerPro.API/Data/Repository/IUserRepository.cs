using System.Threading.Tasks;
using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(string id);
        Task DeleteAsync(string id);
    }
}
