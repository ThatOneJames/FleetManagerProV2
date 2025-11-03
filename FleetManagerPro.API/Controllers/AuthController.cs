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
using System.Text.Json;
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
        private readonly IEmailDomainValidator _emailDomainValidator;
        private readonly ILogger<AuthController> _logger;
        private readonly IAuditService _auditService;

        public AuthController(
            FleetManagerDbContext context,
            IConfiguration config,
            IAuthService authService,
            IUserRepository userRepository,
            IEmailDomainValidator emailDomainValidator,
            IAuditService auditService,
            ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _authService = authService;
            _userRepository = userRepository;
            _auditService = auditService;
            _emailDomainValidator = emailDomainValidator;
            _logger = logger;
        }

        [HttpPost("login")]
        [AllowAnonymous]
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

                if (!user.IsEmailVerified)
                {
                    return Unauthorized(new { message = "Please verify your email before logging in. Check your inbox for verification code." });
                }

                if (user.Status == "Suspended" || user.Status == "Archived" || user.Status == "Inactive")
                {
                    return Unauthorized(new { message = "Your account is suspended, archived, or inactive. Please contact the administrator." });
                }

                Console.WriteLine($"[AUTH] User found: {user.Id}, Role: {user.Role}");

                // Log the successful login
                await _auditService.LogActionAsync(
                    userId: user.Id,
                    actionType: "Login",
                    entityType: "User",
                    entityId: user.Id,
                    description: $"User {user.Name} logged in successfully.",
                    status: "SUCCESS");

                // Generate JWT token and return user info (as is your current code)
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


        [HttpPost("request-verification-code")]
        [AllowAnonymous]
        public async Task<IActionResult> RequestVerificationCode([FromBody] RequestCodeDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.Email))
                {
                    Console.WriteLine("[AUTH] Email is null or empty");
                    return BadRequest(new { message = "Email is required" });
                }

                string email = dto.Email.ToLower().Trim();
                Console.WriteLine($"[AUTH] Requesting verification code for: {email}");

                var (isValidDomain, domainMessage) = await _emailDomainValidator.ValidateEmailDomain(email);
                if (!isValidDomain)
                {
                    Console.WriteLine($"[AUTH] Invalid email domain: {domainMessage}");
                    return BadRequest(new { message = "Invalid email domain", error = domainMessage });
                }

                if (await _context.Users.AnyAsync(u => u.Email == email))
                {
                    Console.WriteLine($"[AUTH] Email already registered: {email}");
                    return BadRequest(new { message = "Email already registered" });
                }

                var verificationCode = new Random().Next(100000, 999999).ToString();
                Console.WriteLine($"[AUTH] Generated code: {verificationCode}");

                var notification = new Notification
                {
                    Title = "Your Verification Code",
                    Message = $"Your verification code is: {verificationCode}. Valid for 5 minutes.",
                    Type = "VerificationCode",
                    Category = "Verification",
                    SendEmail = true,
                    SendSms = false,
                    IsSent = false,
                    CreatedAt = DateTime.UtcNow,
                    RelatedEntityType = "VerificationCode",
                    RelatedEntityId = email
                };

                await _context.Notifications.AddAsync(notification);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[AUTH] Verification code created and notification sent for: {email}");

                return Ok(new { message = "Verification code sent to email", email = email });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Error requesting code: {ex.Message}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error requesting code", error = ex.Message });
            }
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                Console.WriteLine($"[AUTH] Register endpoint called");

                if (dto == null || string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.Password) || string.IsNullOrEmpty(dto.Name))
                {
                    Console.WriteLine("[AUTH] Missing required fields");
                    return BadRequest(new { message = "Email, name, and password are required" });
                }

                // ✅ CHECK IF VERIFICATION CODE PROVIDED
                if (!string.IsNullOrEmpty(dto.VerificationCode))
                {
                    Console.WriteLine($"[AUTH] Verification code provided - using verified registration flow");
                    return await RegisterWithVerificationCode(dto);
                }

                // ✅ NO VERIFICATION CODE - DIRECT ADMIN REGISTRATION
                Console.WriteLine($"[AUTH] No verification code - direct registration (admin creating user)");

                string email = dto.Email.ToLower().Trim();

                if (await _context.Users.AnyAsync(u => u.Email == email))
                {
                    Console.WriteLine($"[AUTH] Email already registered: {email}");
                    return BadRequest(new { message = "Email already registered" });
                }

                var hashedPassword = await _authService.HashPassword(dto.Password);
                var nextEmployeeId = await GenerateNextEmployeeId();

                var user = new User
                {
                    Id = nextEmployeeId,
                    Email = email,
                    Name = dto.Name.Trim(),
                    PasswordHash = hashedPassword,
                    Role = dto.Role ?? "Driver",
                    Status = "Active",
                    IsEmailVerified = true,
                    EmailVerifiedAt = DateTime.UtcNow,
                    Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                    Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
                    DateOfBirth = dto.DateOfBirth,
                    HireDate = dto.HireDate ?? DateTime.UtcNow,
                    EmergencyContact = string.IsNullOrWhiteSpace(dto.EmergencyContact) ? null : dto.EmergencyContact.Trim(),
                    ProfileImageUrl = string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (user.Role == "Driver")
                {
                    user.LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? null : dto.LicenseNumber.Trim();
                    user.LicenseClass = string.IsNullOrWhiteSpace(dto.LicenseClass) ? null : dto.LicenseClass.Trim();
                    user.LicenseExpiry = dto.LicenseExpiry;
                    user.ExperienceYears = dto.ExperienceYears;
                    user.SafetyRating = dto.SafetyRating;
                    user.TotalMilesDriven = dto.TotalMilesDriven;
                    user.IsAvailable = dto.IsAvailable;
                    user.HasHelper = dto.HasHelper;
                }

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[AUTH] User registered successfully: {user.Email} with ID: {user.Id}");

                return Ok(new
                {
                    message = "User created successfully!",
                    userId = user.Id,
                    email = user.Email,
                    name = user.Name,
                    role = user.Role
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Registration error: {ex.Message}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Error creating user", error = ex.Message });
            }
        }

        private async Task<IActionResult> RegisterWithVerificationCode(RegisterDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.Email) || string.IsNullOrEmpty(dto.VerificationCode) || string.IsNullOrEmpty(dto.Password) || string.IsNullOrEmpty(dto.Name))
                {
                    Console.WriteLine("[AUTH] Missing required fields");
                    return BadRequest(new { message = "Email, verification code, name, and password are required" });
                }

                string email = dto.Email.ToLower().Trim();
                Console.WriteLine($"[AUTH] Register attempt with code for: {email}");

                // Find the notification with the code
                var notification = await _context.Notifications
                    .Where(n => n.RelatedEntityId == email &&
                                n.RelatedEntityType == "VerificationCode" &&
                                n.Message.Contains(dto.VerificationCode))
                    .OrderByDescending(n => n.CreatedAt)
                    .FirstOrDefaultAsync();

                if (notification == null)
                {
                    Console.WriteLine($"[AUTH] No verification code found for: {email}");
                    return BadRequest(new { message = "No verification code found. Request a new one." });
                }

                // Check if code is expired (5 minutes)
                if (DateTime.UtcNow > notification.CreatedAt.AddMinutes(5))
                {
                    Console.WriteLine($"[AUTH] Verification code expired for: {email}");
                    return BadRequest(new { message = "Verification code expired. Request a new one." });
                }

                Console.WriteLine($"[AUTH] Code verified for: {email}");

                // Validate domain
                var (isValidDomain, domainMessage) = await _emailDomainValidator.ValidateEmailDomain(email);
                if (!isValidDomain)
                {
                    Console.WriteLine($"[AUTH] Invalid email domain: {domainMessage}");
                    return BadRequest(new { message = "Invalid email domain", error = domainMessage });
                }

                // Check email not already registered
                if (await _context.Users.AnyAsync(u => u.Email == email))
                {
                    Console.WriteLine($"[AUTH] Email already registered: {email}");
                    return BadRequest(new { message = "Email already registered" });
                }

                // Code valid - proceed with registration
                var hashedPassword = await _authService.HashPassword(dto.Password);
                var nextEmployeeId = await GenerateNextEmployeeId();

                var user = new User
                {
                    Id = nextEmployeeId,
                    Email = email,
                    Name = dto.Name.Trim(),
                    PasswordHash = hashedPassword,
                    Role = dto.Role ?? "Driver",
                    Status = "Active",
                    IsEmailVerified = true,
                    EmailVerifiedAt = DateTime.UtcNow,
                    Phone = string.IsNullOrWhiteSpace(dto.Phone) ? null : dto.Phone.Trim(),
                    Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address.Trim(),
                    DateOfBirth = dto.DateOfBirth,
                    HireDate = dto.HireDate ?? DateTime.UtcNow,
                    EmergencyContact = string.IsNullOrWhiteSpace(dto.EmergencyContact) ? null : dto.EmergencyContact.Trim(),
                    ProfileImageUrl = string.IsNullOrWhiteSpace(dto.ProfileImageUrl) ? null : dto.ProfileImageUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (user.Role == "Driver")
                {
                    user.LicenseNumber = string.IsNullOrWhiteSpace(dto.LicenseNumber) ? null : dto.LicenseNumber.Trim();
                    user.LicenseClass = string.IsNullOrWhiteSpace(dto.LicenseClass) ? null : dto.LicenseClass.Trim();
                    user.LicenseExpiry = dto.LicenseExpiry;
                    user.ExperienceYears = dto.ExperienceYears;
                    user.SafetyRating = dto.SafetyRating;
                    user.TotalMilesDriven = dto.TotalMilesDriven;
                    user.IsAvailable = dto.IsAvailable;
                    user.HasHelper = dto.HasHelper;
                }

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                Console.WriteLine($"[AUTH] User registered successfully: {user.Email} with ID: {user.Id}");

                return Ok(new
                {
                    message = "Registration successful! You can now login.",
                    userId = user.Id,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Registration error: {ex.Message}");
                Console.WriteLine($"[AUTH] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        [HttpPost("verify-email")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
        {
            try
            {
                Console.WriteLine($"[AUTH] Verifying email: {dto.Email}");

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim() &&
                                               u.EmailVerificationToken == dto.Token);

                if (user == null)
                {
                    Console.WriteLine($"[AUTH] Verification failed: Invalid email or token");
                    return BadRequest(new { message = "Invalid verification link or email" });
                }

                if (user.IsEmailVerified)
                    return Ok(new { message = "Email already verified. You can now login." });

                user.IsEmailVerified = true;
                user.EmailVerificationToken = null;
                user.EmailVerifiedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                Console.WriteLine($"[AUTH] Email verified successfully: {user.Email}");

                return Ok(new { message = "Email verified successfully! You can now login." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Email verification error: {ex.Message}");
                return StatusCode(500, new { message = "Error verifying email" });
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

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userName = User.FindFirst(ClaimTypes.Name)?.Value;

                await _auditService.LogActionAsync(
                    userId: userId,
                    actionType: "Logout",
                    entityType: "Session",
                    entityId: userId ?? string.Empty,
                    description: $"User {userName} (Role: {userRole}) logged out.",
                    status: "SUCCESS"
                );

                return Ok(new { message = "Logged out and audit logged." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AUTH] Error during logout for user: {UserId}", User?.Identity?.Name);
                return StatusCode(500, new { message = "Error during logout", error = ex.Message });
            }
        }


    }

    // ✅ BASE DTO - CORRECTED TYPES
    public class RegisterDto
    {
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";
        public string? Role { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }
        public string? EmergencyContact { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? LicenseExpiry { get; set; }
        public int? ExperienceYears { get; set; }
        public decimal? SafetyRating { get; set; }
        public decimal? TotalMilesDriven { get; set; }
        public bool IsAvailable { get; set; } = true;
        public bool HasHelper { get; set; } = false;
        public string? VerificationCode { get; set; }
    }

    public class RegisterWithCodeDto : RegisterDto
    {
        // Inherits everything from base class
    }

    public class RequestCodeDto
    {
        public string Email { get; set; } = "";
    }

    public class VerifyEmailDto
    {
        public string Email { get; set; } = "";
        public string Token { get; set; } = "";
    }

    public class EmailValidationRequest
    {
        public string Email { get; set; } = "";
    }
}
