using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("driver_attendance")]
    public class DriverAttendance
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(128)]
        public string DriverId { get; set; } = string.Empty;

        public DateTime? CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public DateTime WorkDate { get; set; }
        public double? TotalHours { get; set; }
        public double? OvertimeHours { get; set; }

        [Required]
        public AttendanceStatus Status { get; set; }

        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        public Driver Driver { get; set; } = null!;
    }

    public enum AttendanceStatus
    {
        Present,
        Absent,
        Late,
        HalfDay,
        OnLeave
    }
}
