using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagerPro.API.DTOs;
using FleetManagerPro.API.DTOs.Users;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Claims;




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
        public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            return user == null ? NotFound() : Ok(user);
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
            var tokenString = tokenHandler.WriteToken(token);

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
                driver = user.Role == UserRole.Driver ? new
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



        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] EditUserProfileDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            // Update only provided fields
            if (!string.IsNullOrWhiteSpace(dto.Name)) user.Name = dto.Name;
            if (!string.IsNullOrWhiteSpace(dto.Email)) user.Email = dto.Email;

            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

            if (!string.IsNullOrWhiteSpace(dto.Phone)) user.Phone = dto.Phone;
            if (!string.IsNullOrWhiteSpace(dto.Address)) user.Address = dto.Address;

            if (dto.DateOfBirth.HasValue) user.DateOfBirth = dto.DateOfBirth.Value;
            if (dto.HireDate.HasValue) user.HireDate = dto.HireDate.Value;

            if (!string.IsNullOrWhiteSpace(dto.EmergencyContact)) user.EmergencyContact = dto.EmergencyContact;
            if (!string.IsNullOrWhiteSpace(dto.ProfileImageUrl)) user.ProfileImageUrl = dto.ProfileImageUrl;

            var success = await _userRepository.UpdateAsync(user);
            if (!success)
                return BadRequest(new { message = "Failed to update user" });

            // Return a safe DTO instead of exposing PasswordHash
            var result = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Address,
                user.DateOfBirth,
                user.HireDate,
                user.EmergencyContact,
                user.ProfileImageUrl
            };

            return Ok(result);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var success = await _userRepository.DeleteAsync(id);
            return success ? NoContent() : NotFound();
        }
    }
}
