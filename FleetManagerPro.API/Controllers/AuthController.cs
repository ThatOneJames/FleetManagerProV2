using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using FleetManagerPro.API.Services;
using FleetManagerPro.API.Data.Repository;

namespace FleetManager.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FleetManagerDbContext _context;
        private readonly IConfiguration _config;
        private readonly IAuthService _authService;
        private readonly IUserRepository _userRepository;

        public AuthController(FleetManagerDbContext context, IConfiguration config, IAuthService authService, IUserRepository userRepository)
        {
            _context = context;
            _config = config;
            _authService = authService;
            _userRepository = userRepository;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password");
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512Signature);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.Now.AddDays(1),
                SigningCredentials = creds,
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return Ok(new
            {
                token,
                email = user.Email,
                role = user.Role.ToString(),
                driver = user.Driver // Added this line to include the Driver object
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] FleetManagerPro.API.DTOs.UserDto userDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            if (!Enum.TryParse(userDto.Role, true, out UserRole userRole))
            {
                return BadRequest(new { message = "Invalid role specified" });
            }

            var hashedPassword = await _authService.HashPassword(userDto.Password);

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = userDto.Email,
                Name = userDto.Name,
                PasswordHash = hashedPassword,
                Role = userRole,
                Status = UserStatus.Active,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Check if the user is a driver and create a new Driver record
            if (user.Role == UserRole.Driver)
            {
                var driver = new Driver
                {
                    UserId = user.Id,
                    FullName = user.Name,
                    LicenseNumber = Guid.NewGuid().ToString(), // Corrected to generate a unique license number
                    ExperienceYears = 0,
                    IsActive = true,
                    IsAvailable = true,
                    // The rest of the properties can be set to default values
                    ContactNumber = "N/A",
                    LicenseClass = "N/A",
                    LicenseExpiry = DateTime.MinValue,
                    TotalMilesDriven = 0.0,
                    SafetyRating = 0.0,
                    LastLocationLat = null,
                    LastLocationLng = null,
                    LastLocationUpdated = null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Drivers.Add(driver);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "User registered successfully" });
        }
    }
}
