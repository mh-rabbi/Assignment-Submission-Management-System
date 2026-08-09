using AssignmentSystem.Api.DTOs.Assignments;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IAssignmentService
{
    // Admin: all assignments
    Task<IEnumerable<AssignmentDto>> GetAllAsync();
    // Teacher: own assignments; Student: published assignments for their class
    Task<IEnumerable<AssignmentDto>> GetForCallerAsync(Guid callerId, string callerRole, Guid? callerClassId);
    Task<AssignmentDto> GetByIdAsync(Guid id, Guid callerId, string callerRole, Guid? callerClassId);
    Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, Guid teacherId);
    Task<AssignmentDto> UpdateAsync(Guid id, UpdateAssignmentDto dto, Guid callerId, string callerRole);
    Task<AssignmentDto> PatchStatusAsync(Guid id, string newStatus, Guid callerId, string callerRole);
    Task DeleteAsync(Guid id, Guid callerId, string callerRole);
}
