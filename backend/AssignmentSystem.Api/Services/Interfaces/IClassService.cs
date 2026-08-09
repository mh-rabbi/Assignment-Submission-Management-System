using AssignmentSystem.Api.DTOs.Classes;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IClassService
{
    Task<IEnumerable<ClassDto>> GetAllAsync();
    Task<ClassDto> GetByIdAsync(Guid id);
    Task<ClassDto> CreateAsync(CreateClassDto dto);
    Task<ClassDto> UpdateAsync(Guid id, UpdateClassDto dto);
    Task DeleteAsync(Guid id);
}
