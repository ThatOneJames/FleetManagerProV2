using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FleetManagerPro.API.Models
{
    [Table("drivers")]
    public class Driver
    {
        [Key]
        [Column("id")]
        // The primary key for the Driver model is now a string to ensure consistency.
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // The foreign key property MUST be a string to match the primary key of the User model.
        [Column("user_id")]
        public string UserId { get; set; } = null!;

        [Column("full_name")]
        public string FullName { get; set; } = null!;

        [Column("contact_number")]
        public string ContactNumber { get; set; } = null!;

        [Column("is_active")]
        public bool IsActive { get; set; }

        [Required, StringLength(50)]
        [Column("license_number")]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required, StringLength(20)]
        [Column("license_class")]
        public string LicenseClass { get; set; } = string.Empty;

        [Column("license_expiry")]
        public DateTime LicenseExpiry { get; set; }

        [Column("experience_years")]
        public int ExperienceYears { get; set; }

        [Column("total_miles_driven")]
        public double TotalMilesDriven { get; set; }

        [Column("safety_rating")]
        public double SafetyRating { get; set; }

        [Column("current_vehicle_id")]
        public string? CurrentVehicleId { get; set; }

        [Column("is_available")]
        public bool IsAvailable { get; set; } = true;

        [Column("last_location_lat")]
        public double? LastLocationLat { get; set; }

        [Column("last_location_lng")]
        public double? LastLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation properties
        // The foreign key attribute is correctly placed here.
        [ForeignKey("UserId")]
        [JsonIgnore]
        public User? User { get; set; }

        public Vehicle? CurrentVehicle { get; set; }
        public ICollection<Route> Routes { get; set; } = new List<Route>();
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
        public ICollection<DriverAttendance> AttendanceRecords { get; set; } = new List<DriverAttendance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
