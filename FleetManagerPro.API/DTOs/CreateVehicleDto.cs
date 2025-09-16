namespace FleetManagerPro.API.DTOs.Vehicles
{
    public class CreateVehicleDto
    {
        public string PlateNumber { get; set; }
        public string Model { get; set; }
        public string Status { get; set; }
        public int DriverId { get; set; }
    }
}
