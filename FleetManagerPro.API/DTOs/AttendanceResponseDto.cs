using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs
{
    // Response DTO for attendance records
    public class AttendanceResponseDto
    {
        public long Id { get; set; }
        public string DriverId { get; set; } = "";
        public string DriverName { get; set; } = "";
        public DateTime Date { get; set; }
        public string? ClockIn { get; set; }
        public string? ClockOut { get; set; }
        public decimal? TotalHours { get; set; }
        public decimal BreakDuration { get; set; }
        public decimal OvertimeHours { get; set; }
        public string Status { get; set; } = "";
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public string? ApprovedBy { get; set; }
        public string? ApproverName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    // Request DTO for clock in/out
    public class ClockInOutDto
    {
        public string? DriverId { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
    }

    // Request DTO for updating attendance
    public class UpdateAttendanceDto
    {
        public string? ClockIn { get; set; }
        public string? ClockOut { get; set; }
        public string? Status { get; set; }
        public string? Location { get; set; }
        public string? Notes { get; set; }
        public decimal? BreakDuration { get; set; }
    }

    // Request DTO for creating manual attendance record
    public class CreateAttendanceDto
    {
        [Required]
        public string DriverId { get; set; } = "";

        [Required]
        public DateTime Date { get; set; }

        public string? ClockIn { get; set; }
        public string? ClockOut { get; set; }

        [Required]
        public string Status { get; set; } = "Present";

        public string? Location { get; set; }
        public string? Notes { get; set; }
        public decimal? BreakDuration { get; set; }
    }

    // Response DTO for attendance summary/stats
    public class AttendanceStatsDto
    {
        public decimal TotalHours { get; set; }
        public int DaysPresent { get; set; }
        public int DaysAbsent { get; set; }
        public int DaysLate { get; set; }
        public string AverageClockIn { get; set; } = "";
        public decimal OvertimeHours { get; set; }
        public decimal AttendancePercentage { get; set; }
    }

    // Weekly attendance overview
    public class WeeklyAttendanceDto
    {
        public DateTime WeekStart { get; set; }
        public DateTime WeekEnd { get; set; }
        public List<AttendanceResponseDto> Records { get; set; } = new();
        public AttendanceStatsDto Stats { get; set; } = new();
    }
}