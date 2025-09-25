using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using System;
using System.Collections.Generic;
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
            // Fix for "Unknown column 'v.UserId'":
            // We'll explicitly select the vehicle properties to bypass the EF Core
            // convention that is incorrectly including a non-existent UserId column.
            return await _context.Vehicles
                .Include(v => v.Category)
                .Select(v => new Vehicle
                {
                    Id = v.Id,
                    CategoryId = v.CategoryId,
                    Make = v.Make,
                    Model = v.Model,
                    Year = v.Year,
                    LicensePlate = v.LicensePlate,
                    Color = v.Color,
                    FuelType = v.FuelType,
                    FuelCapacity = v.FuelCapacity,
                    CurrentMileage = v.CurrentMileage,
                    Status = v.Status,
                    CurrentDriverId = v.CurrentDriverId,
                    CurrentLocationLat = v.CurrentLocationLat,
                    CurrentLocationLng = v.CurrentLocationLng,
                    LastLocationUpdated = v.LastLocationUpdated,
                    FuelLevel = v.FuelLevel,
                    RegistrationExpiry = v.RegistrationExpiry,
                    InsuranceExpiry = v.InsuranceExpiry,
                    InsurancePolicy = v.InsurancePolicy,
                    PurchaseDate = v.PurchaseDate,
                    PurchasePrice = v.PurchasePrice,
                    CreatedAt = v.CreatedAt,
                    UpdatedAt = v.UpdatedAt,
                    // The navigation property itself cannot be included this way
                    // since it would require a JOIN, which is where the original
                    // error occurred. We'll leave it as null for now.
                    CurrentDriver = v.CurrentDriver, // EF Core will load this correctly
                    Category = v.Category
                })
                .ToListAsync();
        }

        public async Task<Vehicle?> GetByIdAsync(string id)
        {
            // This method should be fine as it only retrieves one record
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Include(v => v.Category)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vehicle> CreateAsync(CreateVehicleDto vehicleDto)
        {
            var vehicle = new Vehicle
            {
                Id = Guid.NewGuid().ToString(),
                CategoryId = vehicleDto.CategoryId,
                Make = vehicleDto.Make,
                Model = vehicleDto.Model,
                Year = vehicleDto.Year,
                LicensePlate = vehicleDto.LicensePlate,
                Color = vehicleDto.Color,
                FuelType = (FuelType)Enum.Parse(typeof(FuelType), vehicleDto.FuelType, true),
                FuelCapacity = (decimal?)vehicleDto.FuelCapacity,
                CurrentMileage = (decimal)vehicleDto.CurrentMileage,

                Status = Enum.Parse<VehicleStatus>(
                     vehicleDto.Status.Replace(" ", ""),
                     true
                 ),

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

        // Additional helper methods for vehicle management
        public async Task<IEnumerable<Vehicle>> GetAvailableVehiclesAsync()
        {
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Where(v => v.Status == VehicleStatus.Ready)
                .ToListAsync();
        }

        public async Task<IEnumerable<Vehicle>> GetVehiclesByDriverAsync(string driverId)
        {
            return await _context.Vehicles
                .Include(v => v.CurrentDriver)
                .Where(v => v.CurrentDriverId == driverId)
                .ToListAsync();
        }

        public async Task<bool> AssignDriverToVehicleAsync(string vehicleId, string driverId)
        {
            var vehicle = await _context.Vehicles.FindAsync(vehicleId);
            var user = await _context.Users.FindAsync(driverId);

            if (vehicle == null || user == null || user.Role != UserRole.Driver)
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
    }
}
