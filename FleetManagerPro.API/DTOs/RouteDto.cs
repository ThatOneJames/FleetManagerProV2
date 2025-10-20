using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace FleetManagerPro.API.DTOs
{
    public class RouteDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string VehicleId { get; set; } = string.Empty;
        public string? VehiclePlate { get; set; }
        public string DriverId { get; set; } = string.Empty;
        public string? DriverName { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal TotalDistance { get; set; }
        public int EstimatedDuration { get; set; }
        public decimal FuelEstimate { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? ActualDuration { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? GoogleMapsUrl { get; set; }
        public List<RouteStopDto> Stops { get; set; } = new List<RouteStopDto>();
    }

    public class RouteStopDto
    {
        public string Id { get; set; } = string.Empty;
        public string RouteId { get; set; } = string.Empty;
        public int StopOrder { get; set; }
        public string Address { get; set; } = string.Empty;
        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? ActualArrival { get; set; }
        public DateTime? EstimatedDeparture { get; set; }
        public DateTime? ActualDeparture { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Notes { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class CreateRouteDto
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public string VehicleId { get; set; } = string.Empty;

        [Required]
        public string DriverId { get; set; } = string.Empty;

        public string? StartAddress { get; set; }
        public string? DestinationAddress { get; set; }
        public string? GoogleMapsUrl { get; set; }

        [Required]
        public List<CreateRouteStopDto> Stops { get; set; } = new List<CreateRouteStopDto>();
    }

    public class CreateRouteStopDto
    {
        [Required]
        public int StopOrder { get; set; }

        [Required]
        public string Address { get; set; } = string.Empty;

        public decimal? Latitude { get; set; }
        public decimal? Longitude { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? EstimatedDeparture { get; set; }

        public string? StartAddress { get; set; }
        public string? DestinationAddress { get; set; }

        [StringLength(20)]
        public string Priority { get; set; } = "normal";

        public string? Notes { get; set; }
        public string? ContactName { get; set; }
        public string? ContactPhone { get; set; }
    }

    public class UpdateRouteDto
    {
        [StringLength(100)]
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

    public class UpdateRouteStopStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        public DateTime? ActualArrival { get; set; }
        public DateTime? ActualDeparture { get; set; }
        public string? Notes { get; set; }
    }
}