using Microsoft.AspNetCore.Mvc;
using FleetManager.Models;   // adjust to your namespace
using FleetManager.Services;
using FleetManager.Data;     // if using EF DbContext
using System.Linq;

namespace FleetManager.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;

        public AuthController(AppDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public IActionResult Register([FromBody] UserDto userDto)
        {
            if (_context.Users.Any(u => u.Username == userDto.Username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            var user = new User
            {
                Username = userDto.Username,
                PasswordHash = _authService.HashPassword(userDto.Password),
                Role = "User" // default role
            };

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok(new { message = "User registered successfully" });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto loginDto)
        {
            var user = _context.Users.SingleOrDefault(u => u.Username == loginDto.Username);
            if (user == null || !_authService.VerifyPassword(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            var token = _authService.GenerateJwtToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                role = user.Role
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
