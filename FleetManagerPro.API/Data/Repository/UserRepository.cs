using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FleetManagerPro.API.Data.Repository
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        private readonly FleetManagerDbContext _context;

        public UserRepository(FleetManagerDbContext context) : base(context)
        {
            _context = context;
        }

        public async new Task<User?> GetByUsernameAsync(string username)
        {
            return await _context.Set<User>().FirstOrDefaultAsync(u => u.Username == username);
        }
    }
}
