namespace FleetManagerPro.API.DTOs.Routes
{
    public class CreateRouteDto
    {
        public string RouteName { get; set; } = null!;
        public string VehicleId { get; set; } = null!;
        public List<CreateRouteStopDto> Stops { get; set; } = null!;
    }
}
