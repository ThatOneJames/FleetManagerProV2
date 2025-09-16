using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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
            return await _context.Vehicles.Include(v => v.Driver).ToListAsync();
        }

        public async Task<Vehicle?> GetByIdAsync(string id) // Change Guid to string
        {
            return await _context.Vehicles.Include(v => v.Driver)
                                           .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vehicle> CreateAsync(Vehicle vehicle)
        {
            _context.Vehicles.Add(vehicle);
            await _context.SaveChangesAsync();
            return vehicle;
        }

        public async Task<Vehicle?> UpdateAsync(string id, Vehicle vehicle) // Change Guid to string
        {
            var existing = await _context.Vehicles.FindAsync(id);
            if (existing == null) return null;

            existing.PlateNumber = vehicle.PlateNumber;
            existing.Model = vehicle.Model;
            existing.Status = vehicle.Status;
            existing.DriverId = vehicle.DriverId;

            await _context.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> DeleteAsync(string id) // Change Guid to string
        {
            var existing = await _context.Vehicles.FindAsync(id);
            if (existing == null) return false;

            _context.Vehicles.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}