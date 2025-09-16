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
    }
}