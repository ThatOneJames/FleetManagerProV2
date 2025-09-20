using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace FleetManagerPro.API.Data.Repository
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly FleetManagerDbContext _context;

        public UserRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Set<User>().FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _context.Set<User>().FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task DeleteAsync(string id)
        {
            var user = await _context.Set<User>().FirstOrDefaultAsync(u => u.Id == id);
            if (user != null)
            {
                _context.Set<User>().Remove(user);
                await _context.SaveChangesAsync();
            }
        }
    }
}
