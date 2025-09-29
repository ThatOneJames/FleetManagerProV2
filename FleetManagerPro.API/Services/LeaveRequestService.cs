using FleetManagerPro.API.Models;
using FleetManagerPro.API.Data.Repository;
using FleetManagerPro.API.DTOs;

namespace FleetManagerPro.API.Services
{
    public interface ILeaveRequestService
    {
        Task<List<LeaveRequest>> GetAllLeaveRequestsAsync();
        Task<List<LeaveRequest>> GetLeaveRequestsByDriverIdAsync(string driverId);
        Task<LeaveRequest?> GetLeaveRequestByIdAsync(string id);
        Task<LeaveRequest> CreateLeaveRequestAsync(CreateLeaveRequestDto dto);
        Task<LeaveRequest?> ApproveLeaveRequestAsync(string id, string approvedBy, string? notes = null);
        Task<LeaveRequest?> RejectLeaveRequestAsync(string id, string rejectedBy, string rejectionReason);
        Task<bool> DeleteLeaveRequestAsync(string id);
        Task<LeaveBalanceDto> GetLeaveBalanceAsync(string driverId);
        Task<List<LeaveTypeDto>> GetLeaveTypesAsync();
    }

    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly ILeaveRequestRepository _leaveRequestRepository;
        private readonly ILogger<LeaveRequestService> _logger;

        public LeaveRequestService(ILeaveRequestRepository leaveRequestRepository, ILogger<LeaveRequestService> logger)
        {
            _leaveRequestRepository = leaveRequestRepository;
            _logger = logger;
        }

        public async Task<List<LeaveRequest>> GetAllLeaveRequestsAsync()
        {
            return await _leaveRequestRepository.GetAllAsync();
        }

        public async Task<List<LeaveRequest>> GetLeaveRequestsByDriverIdAsync(string driverId)
        {
            return await _leaveRequestRepository.GetByDriverIdAsync(driverId);
        }

        public async Task<LeaveRequest?> GetLeaveRequestByIdAsync(string id)
        {
            return await _leaveRequestRepository.GetByIdAsync(id);
        }

        public async Task<LeaveRequest> CreateLeaveRequestAsync(CreateLeaveRequestDto dto)
        {
            var totalDays = (dto.EndDate.Date - dto.StartDate.Date).Days + 1;

            var leaveBalance = await GetLeaveBalanceAsync(dto.DriverId);
            var currentTypeBalance = dto.LeaveType switch
            {
                Models.LeaveType.Annual => leaveBalance.Annual,
                Models.LeaveType.Sick => leaveBalance.Sick,
                Models.LeaveType.Personal => leaveBalance.Personal,
                _ => new LeaveBalanceItem { Used = 0, Total = 999, Remaining = 999 }
            };

            if (totalDays > currentTypeBalance.Remaining && dto.LeaveType != Models.LeaveType.Emergency)
            {
                throw new InvalidOperationException($"Insufficient {dto.LeaveType} leave balance. Available: {currentTypeBalance.Remaining} days");
            }

            var leaveRequest = new LeaveRequest
            {
                Id = Guid.NewGuid().ToString(),
                DriverId = dto.DriverId,
                LeaveTypeEnum = dto.LeaveType,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                TotalDays = totalDays,
                Reason = dto.Reason,
                StatusEnum = LeaveStatus.Pending,
                SubmittedDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            return await _leaveRequestRepository.CreateAsync(leaveRequest);
        }

        public async Task<LeaveRequest?> ApproveLeaveRequestAsync(string id, string approvedBy, string? notes = null)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdAsync(id);
            if (leaveRequest == null) return null;

            if (leaveRequest.StatusEnum != LeaveStatus.Pending)
            {
                throw new InvalidOperationException("Only pending leave requests can be approved");
            }

            leaveRequest.StatusEnum = LeaveStatus.Approved;
            leaveRequest.ApprovedBy = approvedBy;
            leaveRequest.ApprovedDate = DateTime.UtcNow;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(notes))
            {
                leaveRequest.RejectionReason = notes;
            }

            return await _leaveRequestRepository.UpdateAsync(leaveRequest);
        }

        public async Task<LeaveRequest?> RejectLeaveRequestAsync(string id, string rejectedBy, string rejectionReason)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdAsync(id);
            if (leaveRequest == null) return null;

            if (leaveRequest.StatusEnum != LeaveStatus.Pending)
            {
                throw new InvalidOperationException("Only pending leave requests can be rejected");
            }

            leaveRequest.StatusEnum = LeaveStatus.Rejected;
            leaveRequest.ApprovedBy = rejectedBy;
            leaveRequest.ApprovedDate = DateTime.UtcNow;
            leaveRequest.RejectionReason = rejectionReason;
            leaveRequest.UpdatedAt = DateTime.UtcNow;

            return await _leaveRequestRepository.UpdateAsync(leaveRequest);
        }

        public async Task<bool> DeleteLeaveRequestAsync(string id)
        {
            var leaveRequest = await _leaveRequestRepository.GetByIdAsync(id);
            if (leaveRequest == null) return false;

            if (leaveRequest.StatusEnum != LeaveStatus.Pending)
            {
                throw new InvalidOperationException("Only pending leave requests can be deleted");
            }

            return await _leaveRequestRepository.DeleteAsync(id);
        }

        public async Task<LeaveBalanceDto> GetLeaveBalanceAsync(string driverId)
        {
            var currentYear = DateTime.UtcNow.Year;

            var approvedRequests = await _leaveRequestRepository.GetApprovedByDriverIdAndYearAsync(driverId, currentYear);

            var usedAnnual = approvedRequests.Where(lr => lr.LeaveTypeEnum == Models.LeaveType.Annual).Sum(lr => lr.TotalDays);
            var usedSick = approvedRequests.Where(lr => lr.LeaveTypeEnum == Models.LeaveType.Sick).Sum(lr => lr.TotalDays);
            var usedPersonal = approvedRequests.Where(lr => lr.LeaveTypeEnum == Models.LeaveType.Personal).Sum(lr => lr.TotalDays);

            const int annualAllowance = 21;
            const int sickAllowance = 10;
            const int personalAllowance = 5;

            return new LeaveBalanceDto
            {
                Annual = new LeaveBalanceItem
                {
                    Used = usedAnnual,
                    Total = annualAllowance,
                    Remaining = annualAllowance - usedAnnual
                },
                Sick = new LeaveBalanceItem
                {
                    Used = usedSick,
                    Total = sickAllowance,
                    Remaining = sickAllowance - usedSick
                },
                Personal = new LeaveBalanceItem
                {
                    Used = usedPersonal,
                    Total = personalAllowance,
                    Remaining = personalAllowance - usedPersonal
                }
            };
        }

        public async Task<List<LeaveTypeDto>> GetLeaveTypesAsync()
        {
            return await Task.FromResult(new List<LeaveTypeDto>
            {
                new LeaveTypeDto { Name = "Annual", Description = "Annual vacation leave" },
                new LeaveTypeDto { Name = "Sick", Description = "Sick leave" },
                new LeaveTypeDto { Name = "Personal", Description = "Personal leave" },
                new LeaveTypeDto { Name = "Emergency", Description = "Emergency leave" },
                new LeaveTypeDto { Name = "Maternity", Description = "Maternity leave" },
                new LeaveTypeDto { Name = "Paternity", Description = "Paternity leave" },
                new LeaveTypeDto { Name = "Bereavement", Description = "Bereavement leave" }
            });
        }
    }
}