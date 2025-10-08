using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.DTOs;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data;
using Microsoft.EntityFrameworkCore;
using RouteModel = FleetManagerPro.API.Models.Route;

namespace FleetManagerPro.API.Services
{
    public interface IRouteService
    {
        Task<IEnumerable<RouteDto>> GetAllRoutesAsync();
        Task<RouteDto?> GetRouteByIdAsync(string id);
        Task<IEnumerable<RouteDto>> GetRoutesByVehicleAsync(string vehicleId);
        Task<IEnumerable<RouteDto>> GetRoutesByDriverAsync(string driverId);
        Task<IEnumerable<RouteDto>> GetRoutesByStatusAsync(string status);
        Task<RouteDto> CreateRouteAsync(CreateRouteDto createDto, string userId);
        Task<RouteDto> UpdateRouteAsync(string id, UpdateRouteDto updateDto);
        Task<bool> DeleteRouteAsync(string id);
        Task<RouteStopDto> UpdateRouteStopStatusAsync(string stopId, UpdateRouteStopStatusDto updateDto);
        Task<RouteDto> OptimizeRouteAsync(string routeId);
    }

    public class RouteService : IRouteService
    {
        private readonly IRouteRepository _routeRepository;
        private readonly FleetManagerDbContext _context;

        public RouteService(IRouteRepository routeRepository, FleetManagerDbContext context)
        {
            _routeRepository = routeRepository;
            _context = context;
        }

        public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync()
        {
            var routes = await _routeRepository.GetAllAsync();
            return routes.Select(MapToDto);
        }

        public async Task<RouteDto?> GetRouteByIdAsync(string id)
        {
            var route = await _routeRepository.GetRouteWithStopsAsync(id);
            return route == null ? null : MapToDto(route);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByVehicleAsync(string vehicleId)
        {
            var routes = await _routeRepository.GetRoutesByVehicleAsync(vehicleId);
            return routes.Select(MapToDto);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByDriverAsync(string driverId)
        {
            var routes = await _routeRepository.GetRoutesByDriverAsync(driverId);
            return routes.Select(MapToDto);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByStatusAsync(string status)
        {
            var routes = await _routeRepository.GetRoutesByStatusAsync(status);
            return routes.Select(MapToDto);
        }

        public async Task<RouteDto> CreateRouteAsync(CreateRouteDto createDto, string userId)
        {
            var totalDistance = CalculateTotalDistance(createDto.Stops);
            var estimatedDuration = CalculateEstimatedDuration(totalDistance);
            var fuelEstimate = CalculateFuelEstimate(totalDistance);

            var route = new RouteModel
            {
                Name = createDto.Name,
                Description = createDto.Description,
                VehicleId = createDto.VehicleId,
                DriverId = createDto.DriverId,
                StartAddress = createDto.StartAddress,
                DestinationAddress = createDto.DestinationAddress,
                GoogleMapsUrl = createDto.GoogleMapsUrl,
                Status = "planned",
                TotalDistance = totalDistance,
                EstimatedDuration = estimatedDuration,
                FuelEstimate = fuelEstimate,
                CreatedBy = userId,
                Stops = createDto.Stops.Select(s => new RouteStop
                {
                    StopOrder = s.StopOrder,
                    Address = s.Address,
                    Latitude = s.Latitude,
                    Longitude = s.Longitude,
                    EstimatedArrival = s.EstimatedArrival,
                    EstimatedDeparture = s.EstimatedDeparture,
                    Priority = s.Priority,
                    Status = "pending",
                    Notes = s.Notes,
                    ContactName = s.ContactName,
                    ContactPhone = s.ContactPhone
                }).ToList()
            };

            await _routeRepository.AddAsync(route);
            await _context.SaveChangesAsync();

            var savedRoute = await _routeRepository.GetRouteWithStopsAsync(route.Id);
            return MapToDto(savedRoute!);
        }

        public async Task<RouteDto> UpdateRouteAsync(string id, UpdateRouteDto updateDto)
        {
            var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == id);
            if (route == null)
                throw new KeyNotFoundException($"Route with ID {id} not found");

            if (!string.IsNullOrEmpty(updateDto.Name))
                route.Name = updateDto.Name;

            if (updateDto.Description != null)
                route.Description = updateDto.Description;

            if (!string.IsNullOrEmpty(updateDto.VehicleId))
                route.VehicleId = updateDto.VehicleId;

            if (!string.IsNullOrEmpty(updateDto.DriverId))
                route.DriverId = updateDto.DriverId;

            if (!string.IsNullOrEmpty(updateDto.Status))
                route.Status = updateDto.Status;

            if (updateDto.StartTime.HasValue)
                route.StartTime = updateDto.StartTime;

            if (updateDto.EndTime.HasValue)
            {
                route.EndTime = updateDto.EndTime;
                if (route.StartTime.HasValue)
                {
                    route.ActualDuration = (int)(route.EndTime.Value - route.StartTime.Value).TotalMinutes;
                }
            }

            // ✅ UPDATE VEHICLE STATUS WHEN ROUTE STARTS
            if (route.VehicleId != null)
            {
                var vehicle = await _context.Vehicles.FindAsync(route.VehicleId);
                if (vehicle != null)
                {
                    if (route.Status == "in_progress")
                    {
                        vehicle.Status = "InRoute";
                    }
                    else if (route.Status == "completed" || route.Status == "cancelled")
                    {
                        vehicle.Status = "Ready";
                    }

                    _context.Vehicles.Update(vehicle);
                }
            }

            route.UpdatedAt = DateTime.UtcNow;

            _context.Routes.Update(route);
            await _context.SaveChangesAsync();

            var updatedRoute = await _routeRepository.GetRouteWithStopsAsync(id);
            return MapToDto(updatedRoute!);
        }

        public async Task<bool> DeleteRouteAsync(string id)
        {
            var route = await _context.Routes.FirstOrDefaultAsync(r => r.Id == id);
            if (route == null)
                return false;

            _context.Routes.Remove(route);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<RouteStopDto> UpdateRouteStopStatusAsync(string stopId, UpdateRouteStopStatusDto updateDto)
        {
            var stop = await _routeRepository.GetRouteStopAsync(stopId);
            if (stop == null)
                throw new KeyNotFoundException($"Route stop with ID {stopId} not found");

            stop.Status = updateDto.Status;

            if (updateDto.ActualArrival.HasValue)
                stop.ActualArrival = updateDto.ActualArrival;

            if (updateDto.ActualDeparture.HasValue)
                stop.ActualDeparture = updateDto.ActualDeparture;

            if (!string.IsNullOrEmpty(updateDto.Notes))
                stop.Notes = updateDto.Notes;

            await _routeRepository.UpdateRouteStopAsync(stop);

            return MapStopToDto(stop);
        }

        public async Task<RouteDto> OptimizeRouteAsync(string routeId)
        {
            var route = await _routeRepository.GetRouteWithStopsAsync(routeId);
            if (route == null)
                throw new KeyNotFoundException($"Route with ID {routeId} not found");

            var orderedStops = route.Stops
                .OrderBy(s => s.Priority == "high" ? 0 : s.Priority == "normal" ? 1 : 2)
                .ThenBy(s => s.StopOrder)
                .ToList();

            for (int i = 0; i < orderedStops.Count; i++)
            {
                orderedStops[i].StopOrder = i + 1;
            }

            await _context.SaveChangesAsync();

            var optimizedRoute = await _routeRepository.GetRouteWithStopsAsync(routeId);
            return MapToDto(optimizedRoute!);
        }

        private RouteDto MapToDto(RouteModel route)
        {
            return new RouteDto
            {
                Id = route.Id,
                Name = route.Name,
                Description = route.Description,
                VehicleId = route.VehicleId,
                VehiclePlate = route.Vehicle?.LicensePlate,
                DriverId = route.DriverId,
                DriverName = route.Driver != null ? route.Driver.Name : null,
                Status = route.Status,
                TotalDistance = route.TotalDistance,
                EstimatedDuration = route.EstimatedDuration,
                FuelEstimate = route.FuelEstimate,
                StartTime = route.StartTime,
                EndTime = route.EndTime,
                ActualDuration = route.ActualDuration,
                CreatedAt = route.CreatedAt,
                GoogleMapsUrl = route.GoogleMapsUrl,
                Stops = route.Stops.OrderBy(s => s.StopOrder).Select(MapStopToDto).ToList()
            };
        }

        private RouteStopDto MapStopToDto(RouteStop stop)
        {
            return new RouteStopDto
            {
                Id = stop.Id,
                RouteId = stop.RouteId,
                StopOrder = stop.StopOrder,
                Address = stop.Address,
                Latitude = stop.Latitude,
                Longitude = stop.Longitude,
                EstimatedArrival = stop.EstimatedArrival,
                ActualArrival = stop.ActualArrival,
                EstimatedDeparture = stop.EstimatedDeparture,
                ActualDeparture = stop.ActualDeparture,
                Priority = stop.Priority,
                Status = stop.Status,
                Notes = stop.Notes,
                ContactName = stop.ContactName,
                ContactPhone = stop.ContactPhone
            };
        }

        private string GenerateGoogleMapsUrl(RouteModel route)
        {
            if (route.Stops == null || !route.Stops.Any())
                return string.Empty;

            var baseUrl = "https://www.google.com/maps/dir/";
            var locations = new List<string>();

            // Add route start address if it exists
            if (!string.IsNullOrWhiteSpace(route.StartAddress))
            {
                locations.Add(Uri.EscapeDataString(route.StartAddress));
            }

            // Add all stops in order
            var orderedStops = route.Stops.OrderBy(s => s.StopOrder);
            foreach (var stop in orderedStops)
            {
                if (!string.IsNullOrWhiteSpace(stop.Address))
                {
                    locations.Add(Uri.EscapeDataString(stop.Address));
                }
            }

            // Add route destination address if it exists and is different from last location
            if (!string.IsNullOrWhiteSpace(route.DestinationAddress))
            {
                var lastLocation = locations.LastOrDefault();
                var encodedDestination = Uri.EscapeDataString(route.DestinationAddress);

                if (lastLocation != encodedDestination)
                {
                    locations.Add(encodedDestination);
                }
            }

            return locations.Count >= 2 ? baseUrl + string.Join("/", locations) : string.Empty;
        }

        private decimal CalculateTotalDistance(List<CreateRouteStopDto> stops)
        {
            return stops.Count * 10;
        }

        private int CalculateEstimatedDuration(decimal distance)
        {
            return (int)(distance / 50 * 60);
        }

        private decimal CalculateFuelEstimate(decimal distance)
        {
            var kmPerLiter = 10m;
            return distance / kmPerLiter;
        }
    }
}
