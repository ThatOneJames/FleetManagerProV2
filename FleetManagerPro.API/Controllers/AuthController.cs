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
            try
            {
                Console.WriteLine($"[AUTH] Login attempt for: {loginDto.Email}");

                var user = await _userRepository.GetByEmailAsync(loginDto.Email);

                if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    Console.WriteLine($"[AUTH] Login failed for: {loginDto.Email}");
                    return Unauthorized("Invalid email or password");
                }

                Console.WriteLine($"[AUTH] User found: {user.Id}, Role: {user.Role}");

                // FIXED: Create claims WITHOUT duplicates - use only the standard types
                var claims = new[]
                {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

                var jwtKey = _config["Jwt:Key"];
                var jwtIssuer = _config["Jwt:Issuer"];
                var jwtAudience = _config["Jwt:Audience"];

                Console.WriteLine($"[AUTH] JWT Config - Issuer: {jwtIssuer}, Audience: {jwtAudience}");

                if (string.IsNullOrEmpty(jwtKey))
                {
                    Console.WriteLine("[AUTH] ERROR: JWT Key is missing from configuration");
                    return StatusCode(500, "JWT configuration is missing");
                }

                // Use HmacSha256 to match Program.cs
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Subject = new ClaimsIdentity(claims),
                    Expires = DateTime.Now.AddDays(1),
                    SigningCredentials = creds,
                    Issuer = jwtIssuer,
                    Audience = jwtAudience
                };

                var tokenHandler = new JwtSecurityTokenHandler();
                var token = tokenHandler.CreateToken(tokenDescriptor);
                var tokenString = tokenHandler.WriteToken(token);

                Console.WriteLine($"[AUTH] Token created successfully for user: {user.Id}");
                Console.WriteLine($"[AUTH] Token (first 50 chars): {tokenString.Substring(0, Math.Min(50, tokenString.Length))}...");

                return Ok(new
                {
                    token = tokenString,
                    id = user.Id,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    status = user.Status,
                    phone = user.Phone,
                    address = user.Address,
                    dateOfBirth = user.DateOfBirth,
                    emergencyContact = user.EmergencyContact,
                    profileImageUrl = user.ProfileImageUrl,
                    vehicleId = user.CurrentVehicleId,

                    licenseNumber = user.LicenseNumber,
                    licenseClass = user.LicenseClass,
                    licenseExpiry = user.LicenseExpiry,
                    experienceYears = user.ExperienceYears,
                    safetyRating = user.SafetyRating,

                    createdAt = user.CreatedAt,
                    updatedAt = user.UpdatedAt,

                    driver = user.Role == "Driver" ? new
                    {
                        fullName = user.Name,
                        licenseNumber = user.LicenseNumber,
                        licenseClass = user.LicenseClass,
                        licenseExpiry = user.LicenseExpiry,
                        contactNumber = user.Phone,
                        experienceYears = user.ExperienceYears,
                        safetyRating = user.SafetyRating,
                        totalMilesDriven = user.TotalMilesDriven,
                        currentVehicleId = user.CurrentVehicleId,
                        isAvailable = user.IsAvailable,
                        hasHelper = user.HasHelper
                    } : null
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Login error: {ex.Message}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error during authentication" });
            }
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] FleetManagerPro.API.DTOs.UserDto userDto)
        {
            try
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
                    Role = userDto.Role,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // If registering a driver, initialize driver-specific fields
                if (user.Role == "Driver")
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

                Console.WriteLine($"[AUTH] User registered successfully: {user.Email}");

                return Ok(new { message = "User registered successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Registration error: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error during registration" });
            }
        }

        // Debug endpoint to verify auth controller is working
        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new
            {
                message = "Auth controller is working",
                timestamp = DateTime.Now,
                jwtConfig = new
                {
                    issuer = _config["Jwt:Issuer"],
                    audience = _config["Jwt:Audience"],
                    keyExists = !string.IsNullOrEmpty(_config["Jwt:Key"])
                }
            });
        }
    }
}