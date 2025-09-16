using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("drivers")]
    public class Driver
    {
        [Key]
        [StringLength(128)]
        public string UserId { get; set; } = string.Empty; // FK to User

        public int Id { get; set; }
        public string FullName { get; set; } = null!;
        public string ContactNumber { get; set; } = null!;
        public bool IsActive { get; set; }

        [Required, StringLength(50)]
        public string LicenseNumber { get; set; } = string.Empty;

        [Required, StringLength(20)]
        public string LicenseClass { get; set; } = string.Empty;

        [Column("license_expiry")]
        public DateTime LicenseExpiry { get; set; }

        public int ExperienceYears { get; set; }
        public double TotalMilesDriven { get; set; }
        public double SafetyRating { get; set; }

        [StringLength(128)]
        public string? CurrentVehicleId { get; set; }

        public bool IsAvailable { get; set; } = true;

        public double? LastLocationLat { get; set; }
        public double? LastLocationLng { get; set; }
        public DateTime? LastLocationUpdated { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation properties
        public User? User { get; set; }
        public Vehicle? CurrentVehicle { get; set; }
        public ICollection<Route> Routes { get; set; } = new List<Route>();
        public ICollection<DriverAttendance> AttendanceRecords { get; set; } = new List<DriverAttendance>();
        public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    }
}
