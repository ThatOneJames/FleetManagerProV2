using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagerPro.API.DTOs;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace FleetManagerPro.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly PasswordHasher<User> _passwordHasher;
        private readonly IConfiguration _config;

        public UsersController(IUserRepository userRepository, IConfiguration config)
        {
            _userRepository = userRepository;
            _passwordHasher = new PasswordHasher<User>();
            _config = config;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            var userDtos = users.Select(u => MapToResponseDto(u));
            return Ok(userDtos);
        }

        // GET: api/users/drivers - Get only drivers
        [HttpGet("drivers")]
        public async Task<ActionResult<IEnumerable<UserResponseDto>>> GetAllDrivers()
        {
            var users = await _userRepository.GetAllAsync();
            var drivers = users.Where(u => u.Role == UserRole.Driver)
                              .Select(u => MapToResponseDto(u));
            return Ok(drivers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });

            var userDto = MapToResponseDto(user);
            return Ok(userDto);
        }

        [HttpGet("current")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound("User not found");

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
                token = tokenHandler.WriteToken(token),
                id = user.Id,
                name = user.Name,
                email = user.Email,
                role = user.Role.ToString(),
                phone = user.Phone,
                address = user.Address,
                dateOfBirth = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                hireDate = user.HireDate?.ToString("yyyy-MM-dd"),
                emergencyContact = user.EmergencyContact,
                profileImageUrl = user.ProfileImageUrl,
                status = user.Status.ToString(),
                driver = user.Role == UserRole.Driver ? new
                {
                    fullName = user.Name,
                    licenseNumber = user.LicenseNumber,
                    licenseClass = user.LicenseClass,
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

        // Enhanced PUT method using UpdateUserDto
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Update basic user fields only if provided
            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;
            if (!string.IsNullOrWhiteSpace(dto.Phone)) user.Phone = dto.Phone;
            if (!string.IsNullOrWhiteSpace(dto.Address)) user.Address = dto.Address;
            if (!string.IsNullOrWhiteSpace(dto.EmergencyContact)) user.EmergencyContact = dto.EmergencyContact;
            if (!string.IsNullOrWhiteSpace(dto.ProfileImageUrl)) user.ProfileImageUrl = dto.ProfileImageUrl;

            // Update dates
            if (dto.DateOfBirth.HasValue) user.DateOfBirth = dto.DateOfBirth.Value;
            if (dto.HireDate.HasValue) user.HireDate = dto.HireDate.Value;

            // Update status if provided
            if (!string.IsNullOrWhiteSpace(dto.Status))
            {
                if (Enum.TryParse<UserStatus>(dto.Status, true, out var status))
                    user.Status = status;
            }

            // Update driver-specific fields
            if (!string.IsNullOrWhiteSpace(dto.LicenseNumber)) user.LicenseNumber = dto.LicenseNumber;
            if (!string.IsNullOrWhiteSpace(dto.LicenseClass)) user.LicenseClass = dto.LicenseClass;
            if (dto.LicenseExpiry.HasValue) user.LicenseExpiry = dto.LicenseExpiry.Value;
            if (dto.ExperienceYears.HasValue) user.ExperienceYears = dto.ExperienceYears.Value;
            if (dto.SafetyRating.HasValue) user.SafetyRating = dto.SafetyRating.Value;
            if (dto.TotalMilesDriven.HasValue) user.TotalMilesDriven = dto.TotalMilesDriven.Value;
            if (dto.IsAvailable.HasValue) user.IsAvailable = dto.IsAvailable.Value;
            if (dto.HasHelper.HasValue) user.HasHelper = dto.HasHelper.Value;

            // Update password if provided
            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            user.UpdatedAt = DateTime.UtcNow;

            var success = await _userRepository.UpdateAsync(user);
            if (!success)
                return BadRequest(new { message = "Failed to update user" });

            // Return the updated user as DTO
            var responseDto = MapToResponseDto(user);
            return Ok(responseDto);
        }

        // PATCH: api/users/{id}/status - Quick status update
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(string id, [FromBody] UpdateStatusDto statusDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (Enum.TryParse<UserStatus>(statusDto.Status, true, out var status))
            {
                user.Status = status;
                user.UpdatedAt = DateTime.UtcNow;

                var success = await _userRepository.UpdateAsync(user);
                if (!success)
                    return BadRequest(new { message = "Failed to update user status" });

                return Ok(new { message = "Status updated successfully", status = user.Status.ToString() });
            }

            return BadRequest(new { message = "Invalid status value" });
        }

        // PATCH: api/users/{id}/availability - Quick availability toggle
        [HttpPatch("{id}/availability")]
        public async Task<IActionResult> UpdateDriverAvailability(string id, [FromBody] UpdateAvailabilityDto availabilityDto)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.Role != UserRole.Driver)
                return BadRequest(new { message = "User is not a driver" });

            user.IsAvailable = availabilityDto.IsAvailable;
            user.UpdatedAt = DateTime.UtcNow;

            var success = await _userRepository.UpdateAsync(user);
            if (!success)
                return BadRequest(new { message = "Failed to update driver availability" });

            return Ok(new { message = "Availability updated successfully", isAvailable = user.IsAvailable });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            var success = await _userRepository.DeleteAsync(id);
            if (!success)
                return BadRequest(new { message = "Failed to delete user" });

            return Ok(new { message = "User deleted successfully" });
        }

        // Helper method to map User to UserResponseDto
        private UserResponseDto MapToResponseDto(User user)
        {
            return new UserResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                Phone = user.Phone ?? string.Empty,
                Address = user.Address ?? string.Empty,
                DateOfBirth = user.DateOfBirth,
                HireDate = user.HireDate,
                EmergencyContact = user.EmergencyContact ?? string.Empty,
                ProfileImageUrl = user.ProfileImageUrl ?? string.Empty,
                Status = user.Status.ToString(),
                LicenseNumber = user.LicenseNumber ?? string.Empty,
                LicenseClass = user.LicenseClass ?? string.Empty,
                LicenseExpiry = user.LicenseExpiry,
                ExperienceYears = user.ExperienceYears ?? 0,
                SafetyRating = user.SafetyRating ?? 0m,
                TotalMilesDriven = user.TotalMilesDriven ?? 0m,
                // Use direct assignment for non-nullable bools
                IsAvailable = user.IsAvailable,
                HasHelper = user.HasHelper,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };
        }
    }
}