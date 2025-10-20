namespace FleetManagerPro.API.DTOs.Routes
{
    public class UpdateRouteDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? VehicleId { get; set; }
        public string? DriverId { get; set; }
        public string? Status { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public List<UpdateRouteStopDto>? Stops { get; set; }
    }

    public class UpdateRouteStopDto
    {
        public string? Id { get; set; }
        public int StopOrder { get; set; }
        public string Address { get; set; } = string.Empty;
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? EstimatedDeparture { get; set; }
        public string Priority { get; set; } = "normal";
        public string? Notes { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
    }
}