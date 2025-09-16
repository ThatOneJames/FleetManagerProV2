namespace FleetManagerPro.API.DTOs
{
    public class RouteDto
    {
        public int Id { get; set; }
        public string RouteName { get; set; }
        public int VehicleId { get; set; }
        public string VehiclePlate { get; set; }
        public List<RouteStopDto> Stops { get; set; }
    }
}
