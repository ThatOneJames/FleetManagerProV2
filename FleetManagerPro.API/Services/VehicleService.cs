using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FleetManagerPro.API.DTOs.Vehicles;

namespace FleetManagerPro.API.Services
{
    public class VehicleService
    {
        private readonly FleetManagerDbContext _context;

        public VehicleService(FleetManagerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Vehicle>> GetAllAsync()
        {
            return await _context.Vehicles
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Vehicle?> GetByIdAsync(string id)
        {
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Include(v => v.Category)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vehicle> CreateAsync(CreateVehicleDto vehicleDto)
        {
            // Generate auto-increment VEH ID
            var nextVehicleId = await GenerateNextVehicleId();

            var vehicle = new Vehicle
            {
                Id = nextVehicleId, // VEH-000001, VEH-000002, etc.
                CategoryId = vehicleDto.CategoryId,
                Make = vehicleDto.Make,
                Model = vehicleDto.Model,
                Year = vehicleDto.Year,
                LicensePlate = vehicleDto.LicensePlate,
                Color = vehicleDto.Color,
                FuelType = vehicleDto.FuelType ?? "Gasoline",
                FuelCapacity = (decimal?)vehicleDto.FuelCapacity,
                CurrentMileage = (decimal)vehicleDto.CurrentMileage,
                Status = vehicleDto.Status ?? "Ready",
                FuelLevel = (decimal)vehicleDto.FuelLevel,
                RegistrationExpiry = vehicleDto.RegistrationExpiry,
                InsuranceExpiry = vehicleDto.InsuranceExpiry,
                InsurancePolicy = vehicleDto.InsurancePolicy,
                PurchaseDate = vehicleDto.PurchaseDate,
                PurchasePrice = (decimal?)vehicleDto.PurchasePrice,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return vehicle;
        }

        public async Task<Vehicle?> UpdateAsync(string id, Vehicle updatedVehicle)
        {
            var existing = await _context.Vehicles.FindAsync(id);
            if (existing == null) return null;

            existing.CategoryId = updatedVehicle.CategoryId;
            existing.Make = updatedVehicle.Make;
            existing.Model = updatedVehicle.Model;
            existing.Year = updatedVehicle.Year;
            existing.LicensePlate = updatedVehicle.LicensePlate;
            existing.Color = updatedVehicle.Color;
            existing.FuelType = updatedVehicle.FuelType;
            existing.FuelCapacity = updatedVehicle.FuelCapacity;
            existing.CurrentMileage = updatedVehicle.CurrentMileage;
            existing.Status = updatedVehicle.Status;
            existing.CurrentDriverId = updatedVehicle.CurrentDriverId;
            existing.FuelLevel = updatedVehicle.FuelLevel;
            existing.RegistrationExpiry = updatedVehicle.RegistrationExpiry;
            existing.InsuranceExpiry = updatedVehicle.InsuranceExpiry;
            existing.InsurancePolicy = updatedVehicle.InsurancePolicy;
            existing.PurchaseDate = updatedVehicle.PurchaseDate;
            existing.PurchasePrice = updatedVehicle.PurchasePrice;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string id)
        {
            var existing = await _context.Vehicles.FindAsync(id);
            if (existing == null) return false;

            _context.Vehicles.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        // Auto-increment VEH generation
        private async Task<string> GenerateNextVehicleId()
        {
            var existingIds = await _context.Vehicles
                .Where(v => v.Id.StartsWith("VEH-"))
                .Select(v => v.Id)
                .ToListAsync();

            int maxNumber = 0;
            foreach (var id in existingIds)
            {
                var numericPart = id.Replace("VEH-", "");
                if (int.TryParse(numericPart, out int number))
                {
                    if (number > maxNumber)
                        maxNumber = number;
                }
            }

            int nextNumber = maxNumber + 1;
            return $"VEH-{nextNumber:D6}"; // VEH-000001, VEH-000002, etc.
        }

        // Additional helper methods for vehicle management
        public async Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync()
        {
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Where(v => v.Status == "Ready")
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IEnumerable<Vehicle>> GetVehiclesByDriverAsync(string driverId)
        {
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Where(v => v.CurrentDriverId == driverId)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<bool> AssignDriverToVehicleAsync(string vehicleId, string driverId)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            var user = await _context.Users.FindAsync(driverId);

            if (vehicle == null || user == null || user.Role != "Driver")
                return false;

            vehicle.CurrentDriverId = driverId;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UnassignDriverFromVehicleAsync(string vehicleId)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            if (vehicle == null) return false;

            vehicle.CurrentDriverId = null;
            vehicle.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        // Get vehicles by status
        public async Task<IEnumerable<Vehicle>> GetVehiclesByStatusAsync(string status)
        {
            return await _context.Vehicles
                .Include(v => v.Category)
                .Include(v => v.CurrentDriver)
                .Where(v => v.Status == status)
                .AsNoTracking()
                .ToListAsync();
        }
    }
}
