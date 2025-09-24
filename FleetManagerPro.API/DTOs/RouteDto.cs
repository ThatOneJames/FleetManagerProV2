namespace FleetManagerPro.API.DTOs
{
    public class RouteDto
    {
        public string Id { get; set; }
        public string RouteName { get; set; }
        public string VehicleId { get; set; } = null!;
        public string VehiclePlate { get; set; }
        public List<RouteStopDto> Stops { get; set; }
    }
}
