namespace FleetManagerPro.API.DTOs.Routes
{
    public class CreateRouteDto
    {
        public string RouteName { get; set; }
        public int VehicleId { get; set; }
        public List<CreateRouteStopDto> Stops { get; set; }
    }
}
