using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("users")]
    public class User
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        [Column("name")]
        public string Name { get; set; } = "";

        [Required]
        [EmailAddress]
        [Column("email")]
        public string Email { get; set; } = "";

        [Required]
        [Column("password_hash")]
        public string PasswordHash { get; set; } = "";

        [Required]
        [Column("role")]
        public UserRole Role { get; set; }

        [Required]
        [Column("status")]
        public UserStatus Status { get; set; } = UserStatus.Active;

        [Column("phone")]
        public string? Phone { get; set; }

        [Column("address")]
        public string? Address { get; set; }

        [Column("emergency_contact")]
        public string? EmergencyContact { get; set; }

        [Column("date_of_birth")]
        public DateTime? DateOfBirth { get; set; }

        [Column("hire_date")]
        public DateTime? HireDate { get; set; }

        [Column("profile_image_url")]
        public string? ProfileImageUrl { get; set; }

        [Column("license_number")]
        public string? LicenseNumber { get; set; }

        [Column("license_class")]
        public string? LicenseClass { get; set; }

        [Column("license_expiry")]
        public DateTime? LicenseExpiry { get; set; }

        [Column("experience_years")]
        public int? ExperienceYears { get; set; }

        [Column("safety_rating", TypeName = "decimal(3,2)")]
        public decimal? SafetyRating { get; set; }

        [Column("total_miles_driven", TypeName = "decimal(12,2)")]
        public decimal? TotalMilesDriven { get; set; }

        [Column("current_vehicle_id")]
        public string? CurrentVehicleId { get; set; }

        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("has_helper")]
        public bool HasHelper { get; set; } = false;

        [Column("last_location_lat", TypeName = "decimal(10,8)")]
        public decimal? LastLocationLat { get; set; }

        [Column("last_location_lng", TypeName = "decimal(11,8)")]
        public decimal? LastLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("CurrentVehicleId")]
        public Vehicle? CurrentVehicle { get; set; }

        public ICollection<Vehicle> AssignedVehicles { get; set; } = new List<Vehicle>();
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public ICollection<DriverAttendance> AttendanceRecords { get; set; } = new List<DriverAttendance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();

        // Helper Methods
        public bool IsDriver => Role == UserRole.Driver;
        public bool IsAdmin => Role == UserRole.Admin;

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
        Admin,
        Driver
    }

    public enum UserStatus
    {
        Active,
        Inactive,
        Suspended,
        OnLeave
    }
}