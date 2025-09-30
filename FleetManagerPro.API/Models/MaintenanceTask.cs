using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FleetManagerPro.API.Models
{
	// This uses your existing maintenance_tasks table
	[Table("maintenance_tasks")]
	public class MaintenanceTask
	{
		[Key]
		[Column("id")]
		[StringLength(50)]
		public string Id { get; set; } = Guid.NewGuid().ToString();

		[Required]
		[Column("vehicle_id")]
		[StringLength(50)]
		public string VehicleId { get; set; } = string.Empty;

		[Required]
		[Column("category_id")]
		public int CategoryId { get; set; }

		[Required]
		[Column("task_type")]
		[StringLength(100)]
		public string TaskType { get; set; } = string.Empty;

		[Required]
		[Column("description")]
		public string Description { get; set; } = string.Empty;

		[Required]
		[Column("priority")]
		[StringLength(20)]
		public string Priority { get; set; } = "Medium";

		[Required]
		[Column("status")]
		[StringLength(20)]
		public string Status { get; set; } = "Scheduled";

		[Required]
		[Column("scheduled_date")]
		public DateTime ScheduledDate { get; set; }

		[Column("completed_date")]
		public DateTime? CompletedDate { get; set; }

		[Column("scheduled_mileage")]
		public decimal? ScheduledMileage { get; set; }

		[Column("completed_mileage")]
		public decimal? CompletedMileage { get; set; }

		[Column("estimated_cost")]
		public decimal? EstimatedCost { get; set; }

		[Column("actual_cost")]
		public decimal? ActualCost { get; set; }

		[Column("assigned_to")]
		[StringLength(255)]
		public string? AssignedTo { get; set; }

		[Column("technician_notes")]
		public string? TechnicianNotes { get; set; }

		[Column("parts_used")]
		public string? PartsUsed { get; set; }

		[Column("labor_hours")]
		public decimal? LaborHours { get; set; }

		[Column("service_provider")]
		[StringLength(255)]
		public string? ServiceProvider { get; set; }

		[Column("warranty_until")]
		public DateTime? WarrantyUntil { get; set; }

		[Column("created_by")]
		[StringLength(128)]
		public string? CreatedBy { get; set; }

		[Column("created_at")]
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

		[Column("updated_at")]
		public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

		// Navigation Properties
		[ForeignKey("VehicleId")]
		public virtual Vehicle? Vehicle { get; set; }

		[ForeignKey("CategoryId")]
		public virtual MaintenanceCategory? Category { get; set; }

		[ForeignKey("CreatedBy")]
		public virtual User? Creator { get; set; }
	}

}