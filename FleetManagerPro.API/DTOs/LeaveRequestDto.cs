using System.ComponentModel.DataAnnotations;
using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.DTOs
{
    public class CreateLeaveRequestDto
    {
        [Required(ErrorMessage = "Driver ID is required")]
        public string DriverId { get; set; } = "";

        [Required(ErrorMessage = "Leave type is required")]
        public LeaveType LeaveType { get; set; }

        [Required(ErrorMessage = "Start date is required")]
        public DateTime StartDate { get; set; }

        [Required(ErrorMessage = "End date is required")]
        public DateTime EndDate { get; set; }

        [Required(ErrorMessage = "Reason is required")]
        [MinLength(10, ErrorMessage = "Reason must be at least 10 characters long")]
        [MaxLength(500, ErrorMessage = "Reason cannot exceed 500 characters")]
        public string Reason { get; set; } = "";
    }

    public class ApproveLeaveRequestDto
    {
        [Required(ErrorMessage = "Approver ID is required")]
        public string ApprovedBy { get; set; } = "";

        [MaxLength(250, ErrorMessage = "Notes cannot exceed 250 characters")]
        public string? Notes { get; set; }
    }

    public class RejectLeaveRequestDto
    {
        [Required(ErrorMessage = "Rejector ID is required")]
        public string RejectedBy { get; set; } = "";

        [Required(ErrorMessage = "Rejection reason is required")]
        [MinLength(10, ErrorMessage = "Rejection reason must be at least 10 characters long")]
        [MaxLength(500, ErrorMessage = "Rejection reason cannot exceed 500 characters")]
        public string RejectionReason { get; set; } = "";
    }

    public class LeaveBalanceDto
    {
        public LeaveBalanceItem Annual { get; set; } = new();
        public LeaveBalanceItem Sick { get; set; } = new();
        public LeaveBalanceItem Personal { get; set; } = new();
    }

    public class LeaveBalanceItem
    {
        public int Used { get; set; }
        public int Total { get; set; }
        public int Remaining { get; set; }
    }

    public class LeaveTypeDto
    {
        public string Name { get; set; } = "";
        public string Description { get; set; } = "";
    }

    public class LeaveRequestResponseDto
    {
        public string Id { get; set; } = "";
        public string DriverId { get; set; } = "";
        public string DriverName { get; set; } = "";
        public LeaveType LeaveType { get; set; }
        public string LeaveTypeName { get; set; } = "";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public string Reason { get; set; } = "";
        public LeaveStatus Status { get; set; }
        public string StatusName { get; set; } = "";
        public string? ApprovedBy { get; set; }
        public string? ApproverName { get; set; }
        public DateTime? ApprovedAt { get; set; }
        public string? RejectionReason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}