namespace FleetManagerPro.API.DTOs.Routes
{
    public class UpdateRouteDto
    {
        public string RouteName { get; set; }
        public int VehicleId { get; set; }
        public List<UpdateRouteStopDto> Stops { get; set; }
    }
}
