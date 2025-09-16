namespace FleetManagerPro.API.DTOs.Vehicles
{
    public class UpdateVehicleDto
    {
        public string PlateNumber { get; set; }
        public string Model { get; set; }
        public string Status { get; set; }
        public int DriverId { get; set; }
    }
}
