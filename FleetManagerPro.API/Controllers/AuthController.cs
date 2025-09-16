using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // Add this line
using System.Linq;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Services;
using System.Threading.Tasks;

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
        public async Task<IActionResult> Register([FromBody] UserDto userDto)
        {
            if (await _context.Users.AnyAsync(u => u.Username == userDto.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var user = new User
            {
                Username = userDto.Username,
                PasswordHash = await _authService.HashPassword(userDto.Password),
                Role = UserRole.User // Assuming UserRole is an enum
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully" });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Username == loginDto.Username);
            if (user == null || !await _authService.VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var token = await _authService.GenerateJwtToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                role = user.Role.ToString()
            });
        }
    }

    // --- DTOs ---
    public class UserDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class LoginDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
}
