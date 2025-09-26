using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs
{
    // Your existing UserDto - corrected based on database schema
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // For AuthController
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }
        public string EmergencyContact { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        // Driver fields - based on your database schema
        public string LicenseNumber { get; set; } = string.Empty;
        public string LicenseClass { get; set; } = string.Empty;
        public DateTime? LicenseExpiry { get; set; }
        public int ExperienceYears { get; set; }
        public decimal SafetyRating { get; set; }
        public decimal TotalMilesDriven { get; set; }
        public bool IsAvailable { get; set; } = true;
        public bool HasHelper { get; set; } = false;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // DTO for updating existing users/drivers
    public class UpdateUserDto
    {
        public string? Name { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        public string? Password { get; set; }

        public string? Phone { get; set; }

        public string? Address { get; set; }

        public DateTime? DateOfBirth { get; set; }

        public DateTime? HireDate { get; set; }

        public string? EmergencyContact { get; set; }

        public string? ProfileImageUrl { get; set; }

        public string? Status { get; set; }

        // Driver-specific fields
        public string? LicenseNumber { get; set; }

        public string? LicenseClass { get; set; }

        public DateTime? LicenseExpiry { get; set; }

        [Range(0, 50)]
        public int? ExperienceYears { get; set; }

        [Range(0.0, 5.0)]
        public decimal? SafetyRating { get; set; }

        [Range(0, double.MaxValue)]
        public decimal? TotalMilesDriven { get; set; }

        public bool? IsAvailable { get; set; }

        public bool? HasHelper { get; set; }
    }

    // Response DTO without sensitive information
    public class UserResponseDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public DateTime? HireDate { get; set; }
        public string EmergencyContact { get; set; } = string.Empty;
        public string ProfileImageUrl { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;

        // Driver fields
        public string LicenseNumber { get; set; } = string.Empty;
        public string LicenseClass { get; set; } = string.Empty;
        public DateTime? LicenseExpiry { get; set; }
        public int ExperienceYears { get; set; }
        public decimal SafetyRating { get; set; }
        public decimal TotalMilesDriven { get; set; }
        public bool IsAvailable { get; set; }
        public bool HasHelper { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // Quick update DTOs
    public class UpdateStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }

    public class UpdateAvailabilityDto
    {
        [Required]
        public bool IsAvailable { get; set; }
    }

    // DTO for creating new drivers
    public class CreateDriverDto
    {
        [Required]
        [StringLength(255, MinimumLength = 2)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        public string? Phone { get; set; }
        public string? Address { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? EmergencyContact { get; set; }
        public string? LicenseNumber { get; set; }
        public string? LicenseClass { get; set; }
        public DateTime? LicenseExpiry { get; set; }

        [Range(0, 50)]
        public int ExperienceYears { get; set; } = 0;

        [Range(0.0, 5.0)]
        public decimal SafetyRating { get; set; } = 0.0m;

        // Default values for new drivers
        public string Role { get; set; } = "Driver";
        public string Status { get; set; } = "Active";
        public bool IsAvailable { get; set; } = true;
        public bool HasHelper { get; set; } = false;
        public decimal TotalMilesDriven { get; set; } = 0.0m;
    }
}