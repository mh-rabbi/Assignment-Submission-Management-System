using AssignmentSystem.Api.DTOs.Submissions;
using Microsoft.AspNetCore.Http;

namespace AssignmentSystem.Api.Services.Interfaces;

public interface ISubmissionService
{
    // Admin: all submissions; Teacher: submissions for their assignment; Student: own
    Task<IEnumerable<SubmissionDto>> GetForAssignmentAsync(Guid assignmentId, Guid callerId, string callerRole);
    Task<SubmissionDto> GetByIdAsync(Guid id, Guid callerId, string callerRole);
    Task<SubmissionDto> SubmitAsync(SubmitAssignmentDto dto, Guid studentId, IFormFile? file);
    Task<SubmissionDto> GradeAsync(Guid id, GradeSubmissionDto dto, Guid callerId, string callerRole);
    Task<SubmissionDto> PatchStatusAsync(Guid id, string newStatus, Guid callerId, string callerRole);
    Task<IEnumerable<SubmissionDto>> GetMySubmissionsAsync(Guid studentId);
    Task<IEnumerable<SubmissionHistoryDto>> GetHistoryAsync(Guid submissionId, Guid callerId, string callerRole);
    Task<string?> GetFilePathAsync(Guid submissionId, Guid callerId, string callerRole);
    // Admin view
    Task<IEnumerable<SubmissionDto>> GetAllAsync();
}
