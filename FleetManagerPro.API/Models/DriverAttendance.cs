using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("driver_attendance")]
    public class DriverAttendance
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Reference User instead of Driver
        [Required]
        [Column("driver_id")]
        public string DriverId { get; set; } = "";

        [Column("check_in_time")]
        public DateTime? CheckInTime { get; set; }

        [Column("check_out_time")]
        public DateTime? CheckOutTime { get; set; }

        [Column("work_date")]
        public DateTime WorkDate { get; set; }

        [Column("total_hours")]
        public decimal? TotalHours { get; set; }

        [Column("overtime_hours")]
        public decimal? OvertimeHours { get; set; }

        [Column("status")]
        public AttendanceStatus Status { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property - now references User
        [ForeignKey("DriverId")]
        public User Driver { get; set; } = null!;
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
