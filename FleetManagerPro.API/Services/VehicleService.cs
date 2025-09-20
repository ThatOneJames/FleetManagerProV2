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
            // The .Include(v => v.Driver) was causing an "Unknown column" error.
            // It has been removed to resolve this.
            return await _context.Vehicles.ToListAsync();
        }

        public async Task<Vehicle?> GetByIdAsync(string id)
        {
            // The .Include(v => v.Driver) was causing an "Unknown column" error.
            // It has been removed to resolve this.
            return await _context.Vehicles.FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vehicle> CreateAsync(CreateVehicleDto vehicleDto)
        {
            // Map the DTO to the Vehicle model
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
                FuelCapacity = (decimal)vehicleDto.FuelCapacity,
                CurrentMileage = (decimal)vehicleDto.CurrentMileage,
                Status = (VehicleStatus)Enum.Parse(typeof(VehicleStatus), vehicleDto.Status, true),
                FuelLevel = (decimal)vehicleDto.FuelLevel,
                RegistrationExpiry = vehicleDto.RegistrationExpiry,
                InsuranceExpiry = vehicleDto.InsuranceExpiry,
                InsurancePolicy = vehicleDto.InsurancePolicy,
                PurchaseDate = vehicleDto.PurchaseDate,
                PurchasePrice = (decimal)vehicleDto.PurchasePrice,
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
    }
}
