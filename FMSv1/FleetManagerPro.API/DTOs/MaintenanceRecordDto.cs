namespace FleetManagerPro.API.DTOs
{
    public class MaintenanceRecordDto
    {
        public int Id { get; set; }
        public int VehicleId { get; set; }
        public string VehiclePlate { get; set; }
        public string Description { get; set; }
        public DateTime MaintenanceDate { get; set; }
        public decimal Cost { get; set; }
    }
}
