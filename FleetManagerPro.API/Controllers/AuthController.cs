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

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password");
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role) // Direct string assignment
            };

            var jwtKey = _config["Jwt:Key"];
            if (string.IsNullOrEmpty(jwtKey))
            {
                return StatusCode(500, "JWT configuration is missing");
            }

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
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
                token = tokenHandler.WriteToken(token),
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role, // Direct string assignment
                phone = user.Phone,
                address = user.Address,
                dateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                hireDate = user.HireDate?.ToString("yyyy-MM-dd"),
                emergencyContact = user.EmergencyContact,
                profileImageUrl = user.ProfileImageUrl,
                driver = user.Role == "Driver" ? new // String comparison
                {
                    fullName = user.Name,
                    licenseNumber = user.LicenseNumber,
                    licenseClass = user.LicenseClass,
                    contactNumber = user.Phone,
                    experienceYears = user.ExperienceYears,
                    safetyRating = user.SafetyRating,
                    totalMilesDriven = user.TotalMilesDriven,
                    currentVehicleId = user.CurrentVehicleId
                } : null
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] FleetManagerPro.API.DTOs.UserDto userDto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
            {
                return BadRequest(new { message = "Email already exists" });
            }

            var hashedPassword = await _authService.HashPassword(userDto.Password);

            var user = new User
            {
                Id = Guid.NewGuid().ToString(),
                Email = userDto.Email,
                Name = userDto.Name,
                PasswordHash = hashedPassword,
                Role = userDto.Role, // Direct string assignment
                Status = "Active", // Direct string assignment
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            // If registering a driver, initialize driver-specific fields
            if (user.Role == "Driver") // String comparison
            {
                user.LicenseNumber = Guid.NewGuid().ToString();
                user.LicenseClass = "N/A";
                user.ExperienceYears = 0;
                user.SafetyRating = 0;
                user.TotalMilesDriven = 0;
                user.IsAvailable = true;
                user.HasHelper = false;
            }

            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully" });
        }
    }
}