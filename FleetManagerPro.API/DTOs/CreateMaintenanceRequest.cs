using System;
using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs
{
	public class CreateMaintenanceRequestDto
	{
		[Required]
		public string VehicleId { get; set; } = string.Empty;

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

		[MaxLength(50)]
		public string Priority { get; set; } = "Normal";
	}
}
