namespace FleetManagerPro.API.DTOs.Routes
{
    public class UpdateRouteDto
    {
        public string RouteName { get; set; }
        public string VehicleId { get; set; } = null!;
        public List<UpdateRouteStopDto> Stops { get; set; }
    }
}
