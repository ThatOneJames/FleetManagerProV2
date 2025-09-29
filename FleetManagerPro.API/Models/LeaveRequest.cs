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

        [Column("UserId")]
        public string? UserId { get; set; }

        [Required]
        [Column("driver_id")]
        public string DriverId { get; set; } = "";

        [Column("leave_type_id")]
        public int LeaveTypeId { get; set; }

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
        public string Status { get; set; } = "Pending";

        [Column("submitted_date")]
        public DateTime? SubmittedDate { get; set; }

        [Column("approved_by")]
        public string? ApprovedBy { get; set; }

        [Column("approved_at")]  // This matches your updated database column
        public DateTime? ApprovedAt { get; set; }

        [Column("rejection_reason")]
        public string? RejectionReason { get; set; }

        [Column("emergency_contact")]
        public string? EmergencyContact { get; set; }

        [Column("supporting_documents")]
        public string? SupportingDocuments { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("DriverId")]
        public User Driver { get; set; } = null!;

        [ForeignKey("ApprovedBy")]
        public User? ApproverUser { get; set; }

        // Helper properties for your service to work with enums
        [NotMapped]
        public LeaveStatus StatusEnum
        {
            get => Enum.Parse<LeaveStatus>(Status);
            set => Status = value.ToString();
        }

        [NotMapped]
        public LeaveType LeaveTypeEnum
        {
            get => (LeaveType)LeaveTypeId;
            set => LeaveTypeId = (int)value;
        }

        // Alias for your service compatibility
        [NotMapped]
        public DateTime? ApprovedDate
        {
            get => ApprovedAt;
            set => ApprovedAt = value;
        }
    }

    public enum LeaveType
    {
        Annual = 1,
        Sick = 2,
        Personal = 3,
        Emergency = 4,
        Maternity = 5,
        Paternity = 6,
        Bereavement = 7,
        Other = 8
    }

    public enum LeaveStatus
    {
        Pending = 0,
        Approved = 1,
        Rejected = 2,
        Cancelled = 3
    }
}