using FleetManagerPro.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Data.Repository
{
    public interface IUserRepository : IRepository<User>
    {
        Task<IEnumerable<User>> GetAllAsync();
        Task<User?> GetByIdAsync(string id);
        Task<User?> GetByEmailAsync(string email);
        Task<bool> DeleteAsync(string id);
        Task<User> CreateAsync(User user);
        Task<bool> UpdateAsync(User user);
        Task<IEnumerable<User>> GetAllDriversWithUserAsync();
    }
}
