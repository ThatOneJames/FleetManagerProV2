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

        public AuthController(
            FleetManagerDbContext context,
            IConfiguration config,
            IAuthService authService,
            IUserRepository userRepository,
            IEmailDomainValidator emailDomainValidator,
            ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _authService = authService;
            _userRepository = userRepository;
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

                // ✅ Check if email is verified
                if (!user.IsEmailVerified)
                {
                    return Unauthorized(new { message = "Please verify your email before logging in. Check your inbox for verification link." });
                }

                if (user.Status == "Suspended" || user.Status == "Archived" || user.Status == "Inactive")
                {
                    return Unauthorized(new { message = "Your account is suspended, archived, or inactive. Please contact the administrator." });
                }

                Console.WriteLine($"[AUTH] User found: {user.Id}, Role: {user.Role}");

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

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] UserDto userDto)
        {
            try
            {
                if (userDto == null || string.IsNullOrEmpty(userDto.Email) || string.IsNullOrEmpty(userDto.Password))
                {
                    return BadRequest(new { message = "Missing required fields" });
                }

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

                if (await _context.Users.AnyAsync(u => u.Email == userDto.Email))
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                var hashedPassword = await _authService.HashPassword(userDto.Password);
                var nextEmployeeId = await GenerateNextEmployeeId();
                var verificationToken = Guid.NewGuid().ToString();

                var user = new User
                {
                    Id = nextEmployeeId,
                    Email = userDto.Email.ToLower().Trim(),
                    Name = userDto.Name.Trim(),
                    PasswordHash = hashedPassword,
                    Role = userDto.Role ?? "Driver",
                    Status = "Active",
                    IsEmailVerified = false,
                    EmailVerificationToken = verificationToken,
                    Phone = string.IsNullOrWhiteSpace(userDto.Phone) ? null : userDto.Phone.Trim(),
                    Address = string.IsNullOrWhiteSpace(userDto.Address) ? null : userDto.Address.Trim(),
                    DateOfBirth = userDto.DateOfBirth,
                    HireDate = userDto.HireDate ?? DateTime.UtcNow,
                    EmergencyContact = string.IsNullOrWhiteSpace(userDto.EmergencyContact) ? null : userDto.EmergencyContact.Trim(),
                    ProfileImageUrl = string.IsNullOrWhiteSpace(userDto.ProfileImageUrl) ? null : userDto.ProfileImageUrl,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                if (user.Role == "Driver")
                {
                    user.LicenseNumber = string.IsNullOrWhiteSpace(userDto.LicenseNumber) ? null : userDto.LicenseNumber.Trim();
                    user.LicenseClass = string.IsNullOrWhiteSpace(userDto.LicenseClass) ? null : userDto.LicenseClass.Trim();
                    user.LicenseExpiry = userDto.LicenseExpiry;
                    user.ExperienceYears = userDto.ExperienceYears;
                    user.SafetyRating = userDto.SafetyRating;
                    user.TotalMilesDriven = userDto.TotalMilesDriven;
                    user.IsAvailable = userDto.IsAvailable;
                    user.HasHelper = userDto.HasHelper;
                }

                await _context.Users.AddAsync(user);
                await _context.SaveChangesAsync();

                try
                {
                    await SendVerificationEmail(user.Email, user.Name, verificationToken);
                    Console.WriteLine($"[AUTH] Verification email sent to: {user.Email}");
                }
                catch (Exception emailEx)
                {
                    Console.WriteLine($"[AUTH] Warning: Email sending failed: {emailEx.Message}");
                }

                Console.WriteLine($"[AUTH] User registered successfully: {user.Email}");

                return Ok(new
                {
                    message = "Registration successful! Check your email to verify your account.",
                    userId = user.Id,
                    email = user.Email
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Registration error: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error during registration", error = ex.Message });
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

        private async Task SendVerificationEmail(string email, string name, string token)
        {
            try
            {
                var appUrl = _config["AppUrl"] ?? "http://localhost:4200";
                var verificationLink = $"{appUrl}/verify-email?email={Uri.EscapeDataString(email)}&token={token}";

                var subject = "Verify Your FleetManagerPro Account";
                var body = $@"
                    <!DOCTYPE html>
                    <html>
                    <body style='font-family: Arial, sans-serif;'>
                        <div style='max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 5px;'>
                            <div style='background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0;'>
                                <h2>FleetManagerPro</h2>
                            </div>
                            <div style='padding: 20px;'>
                                <h3>Welcome, {name}!</h3>
                                <p>Thank you for registering with FleetManagerPro. Please verify your email address to activate your account.</p>
                                <p>Click the button below to verify your email:</p>
                                <p style='margin: 30px 0;'>
                                    <a href='{verificationLink}' style='background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verify Email</a>
                                </p>
                                <p style='margin-top: 20px; font-size: 12px; color: #666;'>
                                    Or copy and paste this link in your browser:<br/>
                                    <small>{verificationLink}</small>
                                </p>
                                <p style='margin-top: 20px; font-size: 12px; color: #999;'>This link expires in 24 hours.</p>
                            </div>
                            <div style='padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;'>
                                <p>&copy; 2025 FleetManagerPro. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                ";

                var sendGridKey = _config["SendGrid:ApiKey"];
                if (!string.IsNullOrEmpty(sendGridKey))
                {
                    var client = new SendGrid.SendGridClient(sendGridKey);
                    var from = new SendGrid.Helpers.Mail.EmailAddress("noreply@fleetmanagerpro.com", "FleetManagerPro");
                    var to = new SendGrid.Helpers.Mail.EmailAddress(email, name);
                    var msg = SendGrid.Helpers.Mail.MailHelper.CreateSingleEmail(from, to, subject, body, body);
                    await client.SendEmailAsync(msg);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AUTH] Error sending verification email: {ex.Message}");
                throw;
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
