using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Services;
using System.Threading.Tasks;
// REMOVED: using FleetManagerPro.API.DTOs;

namespace FleetManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(FleetManagerDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] FleetManagerPro.API.DTOs.UserDto userDto) // UPDATED
        {
            if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = userDto.Email,
                Name = userDto.Name,
                PasswordHash = await _authService.HashPassword(userDto.Password),
                Role = UserRole.Driver,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully" });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] FleetManagerPro.API.DTOs.LoginDto loginDto) // UPDATED
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == loginDto.Email);
            if (user == null || !await _authService.VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var token = await _authService.GenerateJwtToken(user);

            return Ok(new
            {
                token,
                email = user.Email,
                role = user.Role.ToString()
            });
        }
    }

    // --- DTOs ---
    // DO NOT REMOVE THESE
    public class UserDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}