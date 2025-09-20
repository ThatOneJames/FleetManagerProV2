using System;

namespace FleetManagerPro.API.DTOs
{
    public class MaintenanceRecordDto
    {
        public string? Id { get; set; }
        public string VehicleId { get; set; } = null!;
        public string VehiclePlate { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime MaintenanceDate { get; set; }
        public decimal Cost { get; set; }
    }
}
