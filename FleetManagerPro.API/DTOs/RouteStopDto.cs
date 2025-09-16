namespace FleetManagerPro.API.DTOs
{
    public class RouteStopDto
    {
        public int Id { get; set; }
        public string Location { get; set; }
        public int Sequence { get; set; }  // order in route
        public DateTime? EstimatedArrival { get; set; }
    }
}
