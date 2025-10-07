using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = ""; // Empty - will be set in controller

        [Required]
        [Column("name")]
        public string Name { get; set; } = "";

        [Required]
        [Column("email")]
        public string Email { get; set; } = "";

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = "";

        [Required]
        [Column("role")]
        public string Role { get; set; } = "";

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("hire_date")]
        public DateTime? HireDate { get; set; }

        [Column("emergency_contact")]
        public string? EmergencyContact { get; set; }

        [Required]
        [Column("status")]
        public string Status { get; set; } = "Active";

        [Column("profile_image_url")]
        public string? ProfileImageUrl { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Driver-specific fields
        [Column("license_number")]
        public string? LicenseNumber { get; set; } // Plain text - NO HASHING

        [Column("license_class")]
        public string? LicenseClass { get; set; }

        [Column("license_expiry")]
        public DateTime? LicenseExpiry { get; set; }

        [Column("experience_years")]
        public int? ExperienceYears { get; set; } = 0;

        [Column("safety_rating")]
        public decimal? SafetyRating { get; set; }

        [Column("total_miles_driven")]
        public decimal? TotalMilesDriven { get; set; }

        [Column("current_vehicle_id")]
        public string? CurrentVehicleId { get; set; }

        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("has_helper")]
        public bool HasHelper { get; set; } = false;

        [Column("license_class")]
        public string? LicenseClass { get; set; }

        [Column("last_location_lat")]
        public decimal? LastLocationLat { get; set; }

        [Column("last_location_lng")]
        public decimal? LastLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        public ICollection<DriverAttendance> AttendanceRecords { get; set; } = new List<DriverAttendance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();

        public bool IsDriver => Role == "Driver";
        public bool IsAdmin => Role == "Admin";

        public void UpdateDriverInfo(string? licenseNumber = null, string? licenseClass = null,
            DateTime? licenseExpiry = null, int? experienceYears = null, decimal? safetyRating = null)
        {
            if (IsDriver)
            {
                LicenseNumber = licenseNumber ?? LicenseNumber;
                LicenseClass = licenseClass ?? LicenseClass;
                LicenseExpiry = licenseExpiry ?? LicenseExpiry;
                ExperienceYears = experienceYears ?? ExperienceYears;
                SafetyRating = safetyRating ?? SafetyRating;
                UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    public enum UserRole
    {
        Admin = 0,
        Driver = 1,
        Manager = 2
    }

    public enum UserStatus
    {
        Active = 0,
        Inactive = 1,
        Suspended = 2,
        OnLeave = 3
    }
}
