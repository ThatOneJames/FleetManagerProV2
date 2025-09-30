using System;

namespace FleetManagerPro.API.DTOs
{
    // Main DTO for returning maintenance task data
    public class MaintenanceTaskDto
    {
        public string Id { get; set; } = string.Empty;
        public string VehicleId { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string TaskType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal? ScheduledMileage { get; set; }
        public decimal? CompletedMileage { get; set; }
        public decimal? EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        public string? AssignedTo { get; set; }
        public string? TechnicianNotes { get; set; }
        public string? PartsUsed { get; set; }
        public decimal? LaborHours { get; set; }
        public string? ServiceProvider { get; set; }
        public DateTime? WarrantyUntil { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation properties (simplified to avoid circular references)
        public VehicleSimpleDto? Vehicle { get; set; }
        public MaintenanceCategoryDto? Category { get; set; }
    }

    // Simple vehicle DTO to avoid circular references
    public class VehicleSimpleDto
    {
        public string Id { get; set; } = string.Empty;
        public string Make { get; set; } = string.Empty;
        public string Model { get; set; } = string.Empty;
        public string LicensePlate { get; set; } = string.Empty;
    }

    // Category DTO
    public class MaintenanceCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DefaultIntervalMiles { get; set; }
        public int? DefaultIntervalMonths { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // DTO for creating a new maintenance task
    public class CreateMaintenanceTaskDto
    {
        public string VehicleId { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string TaskType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = "Medium";
        public string Status { get; set; } = "Scheduled";
        public DateTime ScheduledDate { get; set; }
        public decimal? ScheduledMileage { get; set; }
        public decimal? EstimatedCost { get; set; }
        public string? AssignedTo { get; set; }
        public string? ServiceProvider { get; set; }
    }

    // DTO for updating a maintenance task
    public class UpdateMaintenanceTaskDto
    {
        public string VehicleId { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string TaskType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public decimal? ScheduledMileage { get; set; }
        public decimal? CompletedMileage { get; set; }
        public decimal? EstimatedCost { get; set; }
        public decimal? ActualCost { get; set; }
        public string? AssignedTo { get; set; }
        public string? TechnicianNotes { get; set; }
        public string? PartsUsed { get; set; }
        public decimal? LaborHours { get; set; }
        public string? ServiceProvider { get; set; }
        public DateTime? WarrantyUntil { get; set; }
    }

    // DTO for maintenance reminders
    public class MaintenanceReminderDto
    {
        public int Id { get; set; }
        public string VehicleId { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string ReminderType { get; set; } = string.Empty;
        public decimal? NextServiceMiles { get; set; }
        public DateTime? NextServiceDate { get; set; }
        public int? IntervalMiles { get; set; }
        public int? IntervalMonths { get; set; }
        public DateTime? LastServiceDate { get; set; }
        public decimal? LastServiceMiles { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public VehicleSimpleDto? Vehicle { get; set; }
        public MaintenanceCategoryDto? Category { get; set; }
    }
}