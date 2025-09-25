using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    [Table("leave_requests")]
    public class LeaveRequest
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        // Reference User instead of Driver
        [Required]
        [Column("driver_id")]
        public string DriverId { get; set; } = "";

        [Column("leave_type")]
        public LeaveType LeaveType { get; set; }

        [Column("start_date")]
        public DateTime StartDate { get; set; }

        [Column("end_date")]
        public DateTime EndDate { get; set; }

        [Column("total_days")]
        public int TotalDays { get; set; }

        [Column("reason")]
        [Required]
        public string Reason { get; set; } = "";

        [Column("status")]
        public LeaveStatus Status { get; set; } = LeaveStatus.Pending;

        [Column("approved_by")]
        public string? ApprovedBy { get; set; }

        [Column("approved_at")]
        public DateTime? ApprovedAt { get; set; }

        [Column("rejection_reason")]
        public string? RejectionReason { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties - now reference User
        [ForeignKey("DriverId")]
        public User Driver { get; set; } = null!;

        [ForeignKey("ApprovedBy")]
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
