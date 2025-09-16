using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("leave_requests")]
    public class LeaveRequest
    {
        [Key]
        public int Id { get; set; }

        [Required, StringLength(128)]
        public string DriverId { get; set; } = string.Empty;

        [Required]
        public LeaveType LeaveType { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public int TotalDays { get; set; }

        [Required, StringLength(255)]
        public string Reason { get; set; } = string.Empty;

        [Required]
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        public string? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? RejectionReason { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // 🔹 Navigation
        public Driver Driver { get; set; } = null!;
        public User? ApproverUser { get; set; }
    }

    public enum LeaveType
    {
        Annual,
        Sick,
        Personal,
        Emergency,
        Maternity,
        Paternity,
        Bereavement,
        Other
    }

    public enum LeaveStatus
    {
        Pending,
        Approved,
        Rejected,
        Cancelled
    }
}
