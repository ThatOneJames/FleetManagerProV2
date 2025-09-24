using System;

namespace FleetManagerPro.API.DTOs
{
    public class VehicleDto
    {
        // Required fields
        public string CategoryId { get; set; }          // If DB uses string, otherwise int
        public string Make { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
        public string Status { get; set; }             // "Ready", "NotAvailable", "Maintenance"

        // Optional / nullable fields
        public string? Color { get; set; }
        public string? FuelType { get; set; }
        public decimal? EngineCapacity { get; set; }
        public decimal? Mileage { get; set; }
        public bool? HasHelper { get; set; }
        public string? DriverId { get; set; }
        public string? InsuranceNo { get; set; }
        public DateTime? LastServiceDate { get; set; }
        public DateTime? NextServiceDate { get; set; }

        // Optional financial fields
        public decimal? FuelCost { get; set; }
        public decimal? MaintenanceCost { get; set; }

        // Metadata
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
