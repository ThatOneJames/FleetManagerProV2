using Microsoft.EntityFrameworkCore;
using FleetManagerPro.API.Data;
using FleetManagerPro.API.Models;

namespace FleetManagerPro.API.Data.Repository
{
    public interface ILeaveRequestRepository
    {
        Task<List<LeaveRequest>> GetAllAsync();
        Task<List<LeaveRequest>> GetByDriverIdAsync(string driverId);
        Task<LeaveRequest?> GetByIdAsync(string id);
        Task<LeaveRequest> CreateAsync(LeaveRequest leaveRequest);
        Task<LeaveRequest?> UpdateAsync(LeaveRequest leaveRequest);
        Task<bool> DeleteAsync(string id);
        Task<List<LeaveRequest>> GetApprovedByDriverIdAndYearAsync(string driverId, int year);
        Task<bool> ExistsAsync(string id);
        Task<int> SaveChangesAsync();
    }

    public class LeaveRequestRepository : ILeaveRequestRepository
    {
        private readonly FleetManagerDbContext _context;
        private readonly ILogger<LeaveRequestRepository> _logger;

        public LeaveRequestRepository(FleetManagerDbContext context, ILogger<LeaveRequestRepository> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<LeaveRequest>> GetAllAsync()
        {
            try
            {
                return await _context.LeaveRequests
                    .Include(lr => lr.Driver)
                    .Include(lr => lr.ApproverUser)
                    .OrderByDescending(lr => lr.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all leave requests");
                throw;
            }
        }

        public async Task<List<LeaveRequest>> GetByDriverIdAsync(string driverId)
        {
            try
            {
                return await _context.LeaveRequests
                    .Include(lr => lr.Driver)
                    .Include(lr => lr.ApproverUser)
                    .Where(lr => lr.DriverId == driverId)
                    .OrderByDescending(lr => lr.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave requests for driver {DriverId}", driverId);
                throw;
            }
        }

        public async Task<LeaveRequest?> GetByIdAsync(string id)
        {
            try
            {
                return await _context.LeaveRequests
                    .Include(lr => lr.Driver)
                    .Include(lr => lr.ApproverUser)
                    .FirstOrDefaultAsync(lr => lr.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving leave request {Id}", id);
                throw;
            }
        }

        public async Task<LeaveRequest> CreateAsync(LeaveRequest leaveRequest)
        {
            try
            {
                // Ensure the ID is set
                if (string.IsNullOrEmpty(leaveRequest.Id))
                {
                    leaveRequest.Id = Guid.NewGuid().ToString();
                }

                // Set timestamps
                leaveRequest.CreatedAt = DateTime.UtcNow;
                leaveRequest.UpdatedAt = DateTime.UtcNow;

                _context.LeaveRequests.Add(leaveRequest);
                await _context.SaveChangesAsync();

                // Return the created entity with navigation properties loaded
                return await GetByIdAsync(leaveRequest.Id) ?? leaveRequest;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating leave request");
                throw;
            }
        }

        public async Task<LeaveRequest?> UpdateAsync(LeaveRequest leaveRequest)
        {
            try
            {
                var existingRequest = await _context.LeaveRequests.FindAsync(leaveRequest.Id);
                if (existingRequest == null)
                {
                    return null;
                }

                existingRequest.LeaveTypeId = leaveRequest.LeaveTypeId;
                existingRequest.StartDate = leaveRequest.StartDate;
                existingRequest.EndDate = leaveRequest.EndDate;
                existingRequest.TotalDays = leaveRequest.TotalDays;
                existingRequest.Reason = leaveRequest.Reason;
                existingRequest.Status = leaveRequest.Status;
                existingRequest.ApprovedBy = leaveRequest.ApprovedBy;
                existingRequest.ApprovedDate = leaveRequest.ApprovedDate;
                existingRequest.RejectionReason = leaveRequest.RejectionReason;
                existingRequest.UpdatedAt = DateTime.UtcNow;

                _context.LeaveRequests.Update(existingRequest);
                await _context.SaveChangesAsync();

                return await GetByIdAsync(existingRequest.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating leave request {Id}", leaveRequest.Id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(string id)
        {
            try
            {
                var leaveRequest = await _context.LeaveRequests.FindAsync(id);
                if (leaveRequest == null)
                {
                    return false;
                }

                _context.LeaveRequests.Remove(leaveRequest);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting leave request {Id}", id);
                throw;
            }
        }

        public async Task<List<LeaveRequest>> GetApprovedByDriverIdAndYearAsync(string driverId, int year)
        {
            try
            {
                return await _context.LeaveRequests
                    .Where(lr => lr.DriverId == driverId &&
                               lr.Status == "Approved" &&
                               lr.StartDate.Year == year)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving approved leave requests for driver {DriverId} in year {Year}", driverId, year);
                throw;
            }
        }

        public async Task<bool> ExistsAsync(string id)
        {
            try
            {
                return await _context.LeaveRequests.AnyAsync(lr => lr.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if leave request {Id} exists", id);
                throw;
            }
        }

        public async Task<int> SaveChangesAsync()
        {
            try
            {
                return await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving changes to database");
                throw;
            }
        }
    }
}