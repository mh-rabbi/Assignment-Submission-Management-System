using AssignmentSystem.Api.DTOs.Subjects;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface ISubjectService
{
    Task<IEnumerable<SubjectDto>> GetAllAsync();
    Task<SubjectDto> GetByIdAsync(Guid id);
    Task<SubjectDto> CreateAsync(CreateSubjectDto dto);
    Task<SubjectDto> UpdateAsync(Guid id, UpdateSubjectDto dto);
    Task DeleteAsync(Guid id);
}
