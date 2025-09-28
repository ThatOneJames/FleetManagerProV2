using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("attendance")]
    public class DriverAttendance
    {
        [Key]
        [Column("id")]
        public long Id { get; set; }

        [Required]
        [Column("driver_id")]
        [MaxLength(128)]
        public string DriverId { get; set; } = "";

        [Required]
        [Column("date")]
        public DateTime Date { get; set; }

        [Column("clock_in")]
        public TimeSpan? ClockIn { get; set; }

        [Column("clock_out")]
        public TimeSpan? ClockOut { get; set; }

        [Column("total_hours", TypeName = "decimal(4,2)")]
        public decimal? TotalHours { get; set; }

        [Column("break_duration", TypeName = "decimal(4,2)")]
        public decimal BreakDuration { get; set; } = 0;

        [Column("overtime_hours", TypeName = "decimal(4,2)")]
        public decimal OvertimeHours { get; set; } = 0;

        [Required]
        [Column("status")]
        [MaxLength(20)]
        public string Status { get; set; } = "Present";

        [Column("location")]
        [MaxLength(255)]
        public string? Location { get; set; }

        [Column("notes")]
        public string? Notes { get; set; }

        [Column("approved_by")]
        [MaxLength(128)]
        public string? ApprovedBy { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("DriverId")]
        public User Driver { get; set; } = null!;

        [ForeignKey("ApprovedBy")]
        public User? Approver { get; set; }
    }

    // Enum for reference, but we'll use strings in the database
    public enum AttendanceStatus
    {
        Present,
        Absent,
        Late,
        HalfDay,
        OnLeave
    }
}