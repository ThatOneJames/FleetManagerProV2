using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
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

        public async Task<IEnumerable<User>> GetAllAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task<User?> GetByIdAsync(string id)
        {
            return await _context.Users.FindAsync(id);
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == email.ToLower().Trim());
        }

        public async Task<User?> GetDriverByEmailAsync(string email)
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Driver)
                .FirstOrDefaultAsync(u => u.Email.ToLower().Trim() == email.ToLower().Trim());
        }

        public async Task<IEnumerable<User>> GetAllDriversAsync()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Driver)
                .ToListAsync();
        }


        public async Task<bool> DeleteAsync(string id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return false;
            }

            _context.Users.Remove(user);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<User> CreateAsync(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        public async Task<bool> UpdateAsync(User user)
        {
            _context.Users.Update(user);
            return await _context.SaveChangesAsync() > 0;
        }
    }
}
