using System;

namespace FleetManagerPro.API.Models
{
    public class FuelLog
    {
        public Guid Id { get; set; }

        public Guid VehicleId { get; set; }
        public Vehicle Vehicle { get; set; }

        public Guid? DriverId { get; set; }
        public Driver Driver { get; set; }

        public string FuelType { get; set; }
        public double Liters { get; set; }
        public decimal Cost { get; set; }
        public DateTime Date { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
}
