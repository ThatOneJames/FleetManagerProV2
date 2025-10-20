using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using FleetManagerPro.API.DTOs;
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
        private readonly IRouteEstimationService _estimationService;
        private readonly ILogger<RouteService> _logger;

        public RouteService(
            IRouteRepository routeRepository,
            FleetManagerDbContext context,
            IRouteEstimationService estimationService,
            ILogger<RouteService> logger)
        {
            _routeRepository = routeRepository;
            _context = context;
            _estimationService = estimationService;
            _logger = logger;
        }

        public async Task<IEnumerable<RouteDto>> GetAllRoutesAsync()
        {
            var routes = await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return routes.Select(MapToDto);
        }

        public async Task<RouteDto?> GetRouteByIdAsync(string id)
        {
            var route = await _routeRepository.GetRouteWithStopsAsync(id);
            return route == null ? null : MapToDto(route);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByVehicleAsync(string vehicleId)
        {
            var routes = await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops)
                .Where(r => r.VehicleId == vehicleId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return routes.Select(MapToDto);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByDriverAsync(string driverId)
        {
            var routes = await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops)
                .Where(r => r.DriverId == driverId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return routes.Select(MapToDto);
        }

        public async Task<IEnumerable<RouteDto>> GetRoutesByStatusAsync(string status)
        {
            var routes = await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops)
                .Where(r => r.Status == status)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            return routes.Select(MapToDto);
        }

        public async Task<RouteDto> CreateRouteAsync(CreateRouteDto createDto, string userId)
        {
            var stopAddresses = createDto.Stops
                .OrderBy(s => s.StopOrder)
                .Select(s => s.Address)
                .ToList();

            var estimation = _estimationService.CalculateRouteEstimation(
                createDto.StartAddress ?? string.Empty,
                stopAddresses,
                createDto.DestinationAddress ?? string.Empty
            );

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
                TotalDistance = estimation.TotalDistanceKm,
                EstimatedDuration = estimation.TotalDurationMinutes,
                FuelEstimate = CalculateFuelEstimate(estimation.TotalDistanceKm),
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

            if (!string.IsNullOrEmpty(route.DriverId) && !string.IsNullOrEmpty(route.VehicleId))
            {
                await SendDriverNotificationAsync(route.Id, route.DriverId, route.VehicleId);
            }

            var savedRoute = await _routeRepository.GetRouteWithStopsAsync(route.Id);
            return MapToDto(savedRoute!);
        }

        public async Task<RouteDto> UpdateRouteAsync(string id, UpdateRouteDto updateDto)
        {
            var route = await _context.Routes
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (route == null)
                throw new KeyNotFoundException($"Route with ID {id} not found");

            var previousDriverId = route.DriverId;

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

            if (!string.IsNullOrEmpty(updateDto.GoogleMapsUrl))
                route.GoogleMapsUrl = updateDto.GoogleMapsUrl;

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

            if (updateDto.Stops != null && updateDto.Stops.Any())
            {
                var existingStopIds = route.Stops.Select(s => s.Id).ToList();
                var updatedStopIds = updateDto.Stops.Where(s => !string.IsNullOrEmpty(s.Id)).Select(s => s.Id).ToList();
                var stopsToRemove = route.Stops.Where(s => !updatedStopIds.Contains(s.Id)).ToList();

                foreach (var stop in stopsToRemove)
                {
                    _context.RouteStops.Remove(stop);
                }

                foreach (var stopDto in updateDto.Stops)
                {
                    if (!string.IsNullOrEmpty(stopDto.Id))
                    {
                        var existingStop = route.Stops.FirstOrDefault(s => s.Id == stopDto.Id);
                        if (existingStop != null)
                        {
                            existingStop.StopOrder = stopDto.StopOrder;
                            existingStop.Address = stopDto.Address;
                            existingStop.Priority = stopDto.Priority;
                            existingStop.Notes = stopDto.Notes;
                            existingStop.ContactName = stopDto.ContactName;
                            existingStop.ContactPhone = stopDto.ContactPhone;
                        }
                    }
                    else
                    {
                        route.Stops.Add(new RouteStop
                        {
                            StopOrder = stopDto.StopOrder,
                            Address = stopDto.Address,
                            Priority = stopDto.Priority,
                            Status = "pending",
                            Notes = stopDto.Notes,
                            ContactName = stopDto.ContactName,
                            ContactPhone = stopDto.ContactPhone
                        });
                    }
                }

                var stopAddresses = updateDto.Stops.OrderBy(s => s.StopOrder).Select(s => s.Address).ToList();
                var estimation = _estimationService.CalculateRouteEstimation(
                    route.StartAddress ?? string.Empty,
                    stopAddresses,
                    route.DestinationAddress ?? string.Empty
                );

                route.TotalDistance = estimation.TotalDistanceKm;
                route.EstimatedDuration = estimation.TotalDurationMinutes;
                route.FuelEstimate = CalculateFuelEstimate(estimation.TotalDistanceKm);
            }

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

            if (!string.IsNullOrEmpty(route.DriverId) &&
                !string.IsNullOrEmpty(route.VehicleId) &&
                route.DriverId != previousDriverId)
            {
                await SendDriverNotificationAsync(route.Id, route.DriverId, route.VehicleId);
            }

            var updatedRoute = await _context.Routes
                .Include(r => r.Vehicle)
                .Include(r => r.Driver)
                .Include(r => r.Stops)
                .FirstOrDefaultAsync(r => r.Id == id);

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

        private async Task SendDriverNotificationAsync(string routeId, string driverId, string vehicleId)
        {
            try
            {
                var driver = await _context.Users.FindAsync(driverId);
                var vehicle = await _context.Vehicles.FindAsync(vehicleId);
                var route = await _context.Routes.FindAsync(routeId);

                if (driver != null && vehicle != null && route != null)
                {
                    var notification = new Notification
                    {
                        UserId = driver.Id,
                        Title = "🚗 New Trip Assignment",
                        Message = $"You have been assigned to trip '{route.Name}' scheduled for {route.StartTime?.ToString("MMM dd, yyyy hh:mm tt")}. Vehicle: {vehicle.LicensePlate} ({vehicle.Make} {vehicle.Model}). Please complete your pre-trip inspection before starting.",
                        Type = "Info",
                        Category = "Trip Assignment",
                        RelatedEntityType = "Route",
                        RelatedEntityId = route.Id,
                        IsRead = false,
                        IsSent = false,
                        SendEmail = true,
                        SendSms = false,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Notifications.Add(notification);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Trip notification sent to driver {DriverId}", driver.Id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending driver notification");
            }
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

        private decimal CalculateFuelEstimate(decimal distance)
        {
            var kmPerLiter = 10m;
            return distance / kmPerLiter;
        }
    }
}