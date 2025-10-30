using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace FleetManagerPro.API.Services
{
    public class DriverDisciplinaryService
    {
        private readonly FleetManagerDbContext _context;

        public DriverDisciplinaryService(FleetManagerDbContext context)
        {
            _context = context;
        }

        // WARNINGS

        public async Task<List<DriverWarning>> GetWarningsByDriverAsync(string driverId)
        {
            return await _context.DriverWarnings
                .Where(w => w.DriverId == driverId)
                .OrderByDescending(w => w.DateIssued)
                .ToListAsync();
        }

        public async Task<DriverWarning> AddWarningAsync(DriverWarning warning)
        {
            warning.Id = Guid.NewGuid().ToString();
            warning.DateIssued = warning.DateIssued == default ? DateTime.UtcNow : warning.DateIssued;

            _context.DriverWarnings.Add(warning);
            await _context.SaveChangesAsync();
            return warning;
        }

        // SUSPENSIONS

        public async Task<List<DriverSuspension>> GetSuspensionsByDriverAsync(string driverId)
        {
            return await _context.DriverSuspensionHistories
                .Where(s => s.DriverId == driverId)
                .OrderByDescending(s => s.DateSuspended)
                .ToListAsync();
        }

        public async Task<DriverSuspension> AddSuspensionAsync(DriverSuspension suspension)
        {
            suspension.Id = Guid.NewGuid().ToString();
            suspension.DateSuspended = suspension.DateSuspended == default ? DateTime.UtcNow : suspension.DateSuspended;

            _context.DriverSuspensionHistories.Add(suspension);
            await _context.SaveChangesAsync();
            return suspension;
        }
    }
}
