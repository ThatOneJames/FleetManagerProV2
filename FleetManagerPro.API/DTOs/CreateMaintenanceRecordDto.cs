namespace FleetManagerPro.API.DTOs.Maintenance
{
    public class CreateMaintenanceRecordDto
    {
        public int VehicleId { get; set; }
        public string Description { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public decimal Cost { get; set; }
    }
}
