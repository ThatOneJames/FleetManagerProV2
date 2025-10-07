using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FleetManagerPro.API.Models
{
    [Table("vehicles")]
    public class Vehicle
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = ""; // Empty - will be set in controller

        [Required]
        [Column("category_id")]
        public string CategoryId { get; set; } = "";

        [Required]
        [Column("make")]
        public string Make { get; set; } = "";

        [Required]
        [Column("model")]
        public string Model { get; set; } = "";

        [Required]
        [Column("year")]
        public int Year { get; set; }

        [Required]
        [Column("license_plate")]
        public string LicensePlate { get; set; } = "";

        [Column("color")]
        public string? Color { get; set; }

        [Required]
        [Column("fuel_type")]
        public string FuelType { get; set; } = "Gasoline";

        [Column("fuel_capacity")]
        public decimal? FuelCapacity { get; set; }

        [Column("current_mileage")]
        public decimal CurrentMileage { get; set; } = 0;

        [Required]
        [Column("status")]
        public string Status { get; set; } = "Ready";

        [Column("current_driver_id")]
        public string? CurrentDriverId { get; set; }

        [Column("current_location_lat")]
        public decimal? CurrentLocationLat { get; set; }

        [Column("current_location_lng")]
        public decimal? CurrentLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        [Column("fuel_level")]
        public decimal FuelLevel { get; set; } = 100;

        [Required]
        [Column("registration_expiry")]
        public DateTime RegistrationExpiry { get; set; }

        [Required]
        [Column("insurance_expiry")]
        public DateTime InsuranceExpiry { get; set; }

        [Column("insurance_policy")]
        public string? InsurancePolicy { get; set; }

        [Column("purchase_date")]
        public DateTime? PurchaseDate { get; set; }

        [Column("purchase_price")]
        public decimal? PurchasePrice { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("CategoryId")]
        public VehicleCategory? Category { get; set; }

        [ForeignKey("CurrentDriverId")]
        public User? CurrentDriver { get; set; }

        public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; } = new List<MaintenanceRecord>();
    }

    public enum FuelType
    {
        Gasoline,
        Diesel,
        Electric,
        Hybrid
    }

    public enum VehicleStatus
    {
        Ready,
        Active,
        Maintenance,
        Inactive,
        OnRoute,
        Retired,
        NotAvailable,
        InUse,
        OutOfService
    }

    [Table("vehicle_categories")]
    public class VehicleCategory
    {
        [Key]
        [Column("id")]
        public string Id { get; set; } = "";

        [Required]
        [Column("name")]
        public string Name { get; set; } = "";

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [JsonIgnore]
        public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    }
}
