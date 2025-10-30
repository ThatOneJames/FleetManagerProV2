using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Linq;
using System.Collections.Generic;
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
        private readonly IEmailDomainValidator _emailDomainValidator; // ADD THIS

        public AuthController(
            FleetManagerDbContext context,
            IConfiguration config,
            IAuthService authService,
            IUserRepository userRepository,
            IEmailDomainValidator emailDomainValidator) // ADD THIS
        {
            _context = context;
            _config = config;
            _authService = authService;
            _userRepository = userRepository;
            _emailDomainValidator = emailDomainValidator; // ADD THIS
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

                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Role, user.Role)
                };

                if (user.Status == "Suspended" || user.Status == "Archived" || user.Status == "Inactive")
                {
                    return Unauthorized(new { message = "Your account is suspended, archived, or inactive. Please contact the administrator." });
                }

                var jwtKey = _config["Jwt:Key"];
                var jwtIssuer = _config["Jwt:Issuer"];
                var jwtAudience = _config["Jwt:Audience"];

                Console.WriteLine($"[AUTH] JWT Config - Issuer: {jwtIssuer}, Audience: {jwtAudience}");

                if (string.IsNullOrEmpty(jwtKey))
                {
                    Console.WriteLine("[AUTH] ERROR: JWT Key is missing from configuration");
                    return StatusCode(500, "JWT configuration is missing");
                }

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
                // Validate model state (includes basic email validation)
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();

                    Console.WriteLine($"[AUTH] Registration validation failed: {string.Join(", ", errors)}");
                    return BadRequest(new { message = "Validation failed", errors = errors });
                }

                // VALIDATE EMAIL DOMAIN - CHECK IF REAL EMAIL
                Console.WriteLine($"[AUTH] Validating email domain for: {userDto.Email}");
                var (isValidDomain, domainMessage) = await _emailDomainValidator.ValidateEmailDomain(userDto.Email);

                if (!isValidDomain)
                {
                    Console.WriteLine($"[AUTH] Email domain validation failed: {domainMessage}");
                    return BadRequest(new
                    {
                        message = "Invalid email address",
                        error = domainMessage,
                        details = "Please use a valid email address from a registered domain (e.g., Gmail, Yahoo, etc.)"
                    });
                }

                Console.WriteLine($"[AUTH] Email domain validation successful for: {userDto.Email}");

                // Check if email already exists
                if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                var hashedPassword = await _authService.HashPassword(userDto.Password);
                var nextEmployeeId = await GenerateNextEmployeeId();

                var user = new User
                {
                    Id = nextEmployeeId,
                    Email = userDto.Email.ToLower().Trim(), // Normalize email
                    Name = userDto.Name.Trim(),
                    PasswordHash = hashedPassword,
                    Role = userDto.Role,
                    Status = string.IsNullOrWhiteSpace(userDto.Status) ? "Active" : userDto.Status,
                    Phone = string.IsNullOrWhiteSpace(userDto.Phone) ? null : userDto.Phone.Trim(),
                    Address = string.IsNullOrWhiteSpace(userDto.Address) ? null : userDto.Address.Trim(),
                    DateOfBirth = userDto.DateOfBirth,
                    HireDate = userDto.HireDate ?? DateTime.UtcNow,
                    EmergencyContact = string.IsNullOrWhiteSpace(userDto.EmergencyContact) ? null : userDto.EmergencyContact.Trim(),
                    ProfileImageUrl = string.IsNullOrWhiteSpace(userDto.ProfileImageUrl) ? null : userDto.ProfileImageUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                // Driver-specific fields (UserDto has non-nullable types, so direct assignment works)
                if (user.Role == "Driver")
                {
                    user.LicenseNumber = string.IsNullOrWhiteSpace(userDto.LicenseNumber) ? null : userDto.LicenseNumber.Trim();
                    user.LicenseClass = string.IsNullOrWhiteSpace(userDto.LicenseClass) ? null : userDto.LicenseClass.Trim();
                    user.LicenseExpiry = userDto.LicenseExpiry;
                    user.ExperienceYears = userDto.ExperienceYears; // int to int? - OK
                    user.SafetyRating = userDto.SafetyRating;       // decimal to decimal? - OK
                    user.TotalMilesDriven = userDto.TotalMilesDriven; // decimal to decimal? - OK
                    user.IsAvailable = userDto.IsAvailable;
                    user.HasHelper = userDto.HasHelper;
                }

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[AUTH] User registered successfully: {user.Email} with ID: {user.Id}");

                return Ok(new
                {
                    message = "User registered successfully",
                    userId = user.Id,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Registration error: {ex.Message}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error during registration", error = ex.Message });
            }
        }


        private async Task<string> GenerateNextEmployeeId()
        {
            var existingIds = await _context.Users
                .Where(u => u.Id.StartsWith("EID-"))
                .Select(u => u.Id)
                .ToListAsync();

            int maxNumber = 0;
            foreach (var id in existingIds)
            {
                var numericPart = id.Replace("EID-", "");
                if (int.TryParse(numericPart, out int number))
                {
                    if (number > maxNumber)
                        maxNumber = number;
                }
            }

            int nextNumber = maxNumber + 1;
            return $"EID-{nextNumber:D6}";
        }

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

        [HttpPost("validate-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateEmail([FromBody] EmailValidationRequest request)
        {
            var (isValid, message) = await _emailDomainValidator.ValidateEmailDomain(request.Email);
            return Ok(new
            {
                email = request.Email,
                isValid = isValid,
                message = message
            });
        }
    }

    public class EmailValidationRequest
    {
        public string Email { get; set; } = "";
    }
}
