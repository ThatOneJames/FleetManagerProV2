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
        public Vehicle()
        {
            // Generate ID in constructor
            Id = GenerateVehicleId();
            CategoryId = "";
            Make = "";
            Model = "";
            LicensePlate = "";
            FuelType = "Gasoline";
            CurrentMileage = 0;
            Status = "Ready";
            FuelLevel = 100;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
            MaintenanceRecords = new List<MaintenanceRecord>();
        }

        [Key]
        [Column("id")]
        public string Id { get; set; }

        [Required]
        [Column("category_id")]
        public string CategoryId { get; set; }

        [Required]
        [Column("make")]
        public string Make { get; set; }

        [Required]
        [Column("model")]
        public string Model { get; set; }

        [Required]
        [Column("year")]
        public int Year { get; set; }

        [Required]
        [Column("license_plate")]
        public string LicensePlate { get; set; }

        [Column("color")]
        public string? Color { get; set; }

        [Required]
        [Column("fuel_type")]
        public string FuelType { get; set; }

        [Column("fuel_capacity")]
        public decimal? FuelCapacity { get; set; }

        [Column("current_mileage")]
        public decimal CurrentMileage { get; set; }

        [Required]
        [Column("status")]
        public string Status { get; set; }

        [Column("current_driver_id")]
        public string? CurrentDriverId { get; set; }

        [Column("current_location_lat")]
        public decimal? CurrentLocationLat { get; set; }

        [Column("current_location_lng")]
        public decimal? CurrentLocationLng { get; set; }

        [Column("last_location_updated")]
        public DateTime? LastLocationUpdated { get; set; }

        [Column("fuel_level")]
        public decimal FuelLevel { get; set; }

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
        public DateTime CreatedAt { get; set; }

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("CategoryId")]
        public VehicleCategory? Category { get; set; }

        [ForeignKey("CurrentDriverId")]
        public User? CurrentDriver { get; set; }

        public ICollection<MaintenanceRecord> MaintenanceRecords { get; set; }

        // Generate vehicle ID with VEH- prefix
        private static string GenerateVehicleId()
        {
            var random = new Random();
            var uniqueNumber = random.Next(10000, 99999).ToString();
            return $"VEH-{uniqueNumber}";
        }
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
        public VehicleCategory()
        {
            Id = Guid.NewGuid().ToString();
            Name = "";
            CreatedAt = DateTime.UtcNow;
            Vehicles = new List<Vehicle>();
        }

        [Key]
        [Column("id")]
        public string Id { get; set; }

        [Required]
        [Column("name")]
        public string Name { get; set; }

        [Column("description")]
        public string? Description { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [JsonIgnore]
        public ICollection<Vehicle> Vehicles { get; set; }
    }
}
