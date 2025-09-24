namespace FleetManagerPro.API.DTOs.Maintenance
{
    public class CreateMaintenanceRecordDto
    {
        public string VehicleId { get; set; } = null!;
        public string Description { get; set; } = null!;
        public DateTime MaintenanceDate { get; set; }
        public decimal Cost { get; set; }
    }
}
