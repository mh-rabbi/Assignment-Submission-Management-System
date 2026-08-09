using AssignmentSystem.Api.DTOs.TeacherAssignments;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface ITeacherAssignmentService
{
    Task<IEnumerable<TeacherAssignmentDto>> GetAllAsync();
    Task<IEnumerable<TeacherAssignmentDto>> GetByTeacherAsync(Guid teacherId);
    Task<TeacherAssignmentDto> CreateAsync(CreateTeacherAssignmentDto dto);
    Task DeleteAsync(Guid id);
}
