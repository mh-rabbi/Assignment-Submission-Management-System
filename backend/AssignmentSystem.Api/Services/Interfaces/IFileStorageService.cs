using Microsoft.AspNetCore.Http;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(IFormFile file, Guid assignmentId, Guid studentId);
    void Delete(string filePath);
}
