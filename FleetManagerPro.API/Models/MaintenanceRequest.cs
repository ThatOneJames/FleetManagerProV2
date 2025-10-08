using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
    public class MaintenanceRequest
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        public string DriverId { get; set; } = string.Empty;

        public string? RouteId { get; set; }
        public string? InspectionId { get; set; }

        [Required]
        [MaxLength(100)]
        public string IssueType { get; set; } = string.Empty;

        [Required]
        [MaxLength(50)]
        public string IssueSeverity { get; set; } = "Medium";

        [Required]
        [MaxLength(2000)]
        public string Description { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? ReportedBy { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [Required]
        [MaxLength(50)]
        public string Priority { get; set; } = "Normal";

        [Required]
        public DateTime ReportedDate { get; set; }

        public DateTime? ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }

        [MaxLength(200)]
        public string? AssignedMechanic { get; set; }

        [MaxLength(2000)]
        public string? RepairNotes { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? EstimatedCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal? ActualCost { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Navigation Properties
        [ForeignKey("VehicleId")]
        public Vehicle? Vehicle { get; set; }

        [ForeignKey("DriverId")]
        public User? Driver { get; set; }

        [ForeignKey("RouteId")]
        public Route? Route { get; set; }

        [ForeignKey("InspectionId")]
        public PreTripInspection? Inspection { get; set; }
    }
}
