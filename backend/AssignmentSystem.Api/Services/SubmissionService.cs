using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Submissions;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class SubmissionService : ISubmissionService
{
    private readonly AppDbContext _db;
    private readonly IFileStorageService _fileStorage;

    public SubmissionService(AppDbContext db, IFileStorageService fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    public async Task<IEnumerable<SubmissionDto>> GetAllAsync()
    {
        var submissions = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .AsNoTracking()
            .ToListAsync();

        return submissions.Select(MapToDto);
    }

    public async Task<IEnumerable<SubmissionDto>> GetForAssignmentAsync(Guid assignmentId, Guid callerId, string callerRole)
    {
        var assignment = await _db.Assignments.FindAsync(assignmentId);
        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{assignmentId}' was not found.");

        if (callerRole == Role.Teacher.ToString() && assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("You are not the teacher of this assignment.");

        var query = _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Where(s => s.AssignmentId == assignmentId)
            .AsNoTracking();

        if (callerRole == Role.Student.ToString())
        {
            query = query.Where(s => s.StudentId == callerId);
        }

        var list = await query.ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<SubmissionDto> GetByIdAsync(Guid id, Guid callerId, string callerRole)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
            throw new KeyNotFoundException($"Submission with ID '{id}' was not found.");

        if (callerRole == Role.Student.ToString() && submission.StudentId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to view this submission.");

        if (callerRole == Role.Teacher.ToString() && submission.Assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to view this submission.");

        return MapToDto(submission);
    }

    public async Task<SubmissionDto> SubmitAsync(SubmitAssignmentDto dto, Guid studentId, IFormFile? file)
    {
        var student = await _db.Users.FindAsync(studentId);
        if (student == null || student.Role != Role.Student || !student.ClassId.HasValue)
            throw new UnauthorizedAccessException("Only enrolled students may submit assignments.");

        var assignment = await _db.Assignments.FindAsync(dto.AssignmentId);
        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{dto.AssignmentId}' was not found.");

        // Rule 3: Must belong to student's class
        if (assignment.ClassId != student.ClassId.Value)
            throw new UnauthorizedAccessException("You can only submit to assignments for your class.");

        // Rule 5: If status is Closed -> reject with InvalidOperationException
        if (assignment.Status == AssignmentStatus.Closed)
            throw new InvalidOperationException("Assignment is closed. Submissions are no longer accepted.");

        // Rule 3: Must be Published (not Draft)
        if (assignment.Status != AssignmentStatus.Published)
            throw new UnauthorizedAccessException("You can only submit to published assignments.");

        var now = DateTimeOffset.UtcNow;
        var isLate = now > assignment.Deadline;

        // Rule 4: Deadline check
        if (isLate && !assignment.AllowLateSubmission)
            throw new InvalidOperationException("The deadline for this assignment has passed and late submissions are not allowed.");

        // Handle optional file upload
        string? newFilePath = null;
        if (file != null && file.Length > 0)
        {
            newFilePath = await _fileStorage.SaveAsync(file, dto.AssignmentId, studentId);
        }

        // Check if submission row already exists
        var existingSubmission = await _db.Submissions
            .Include(s => s.History)
            .FirstOrDefaultAsync(s => s.AssignmentId == dto.AssignmentId && s.StudentId == studentId);

        if (existingSubmission != null)
        {
            // Rule 6: Edit history snapshot
            var history = new SubmissionHistory
            {
                Id = Guid.NewGuid(),
                SubmissionId = existingSubmission.Id,
                Content = existingSubmission.Content,
                FilePath = existingSubmission.FilePath,
                EditedAt = existingSubmission.SubmittedAt
            };
            _db.SubmissionHistories.Add(history);

            // Update submission
            existingSubmission.Content = dto.Content;
            if (newFilePath != null)
            {
                // Delete previous file if updated
                if (!string.IsNullOrEmpty(existingSubmission.FilePath))
                {
                    _fileStorage.Delete(existingSubmission.FilePath);
                }
                existingSubmission.FilePath = newFilePath;
            }
            existingSubmission.SubmittedAt = now;
            existingSubmission.IsLate = isLate;
            existingSubmission.UpdatedAt = now;
        }
        else
        {
            // New submission
            existingSubmission = new Submission
            {
                Id = Guid.NewGuid(),
                AssignmentId = dto.AssignmentId,
                StudentId = studentId,
                Content = dto.Content,
                FilePath = newFilePath,
                SubmittedAt = now,
                IsLate = isLate,
                Status = SubmissionStatus.Submitted,
                CreatedAt = now,
                UpdatedAt = now
            };
            _db.Submissions.Add(existingSubmission);
        }

        await _db.SaveChangesAsync();

        return await GetByIdAsync(existingSubmission.Id, studentId, Role.Student.ToString());
    }

    public async Task<SubmissionDto> GradeAsync(Guid id, GradeSubmissionDto dto, Guid callerId, string callerRole)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
            throw new KeyNotFoundException($"Submission with ID '{id}' was not found.");

        if (callerRole != Role.Admin.ToString() && submission.Assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("Only the teacher assigned to this assignment or an admin can grade submissions.");

        if (dto.Marks < 0 || dto.Marks > submission.Assignment.MaxMarks)
            throw new ArgumentException($"Marks must be between 0 and {submission.Assignment.MaxMarks}.");

        submission.Marks = dto.Marks;
        submission.Feedback = dto.Feedback;
        submission.Status = SubmissionStatus.Graded; // Rule 7
        submission.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(submission.Id, callerId, callerRole);
    }

    public async Task<SubmissionDto> PatchStatusAsync(Guid id, string newStatus, Guid callerId, string callerRole)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (submission == null)
            throw new KeyNotFoundException($"Submission with ID '{id}' was not found.");

        if (callerRole != Role.Admin.ToString() && submission.Assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("Only the teacher assigned to this assignment or an admin can update submission status.");

        if (!Enum.TryParse<SubmissionStatus>(newStatus, true, out var status))
            throw new ArgumentException($"Invalid status: {newStatus}");

        submission.Status = status;
        submission.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync();

        return await GetByIdAsync(submission.Id, callerId, callerRole);
    }

    public async Task<IEnumerable<SubmissionDto>> GetMySubmissionsAsync(Guid studentId)
    {
        var list = await _db.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
            .Where(s => s.StudentId == studentId)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<IEnumerable<SubmissionHistoryDto>> GetHistoryAsync(Guid submissionId, Guid callerId, string callerRole)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
            throw new KeyNotFoundException($"Submission with ID '{submissionId}' was not found.");

        if (callerRole == Role.Student.ToString() && submission.StudentId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to view history for this submission.");

        if (callerRole == Role.Teacher.ToString() && submission.Assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to view history for this submission.");

        var history = await _db.SubmissionHistories
            .Where(h => h.SubmissionId == submissionId)
            .OrderByDescending(h => h.EditedAt)
            .AsNoTracking()
            .ToListAsync();

        return history.Select(h => new SubmissionHistoryDto
        {
            Id = h.Id,
            Content = h.Content,
            FilePath = h.FilePath,
            EditedAt = h.EditedAt
        });
    }

    public async Task<string?> GetFilePathAsync(Guid submissionId, Guid callerId, string callerRole)
    {
        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == submissionId);

        if (submission == null)
            throw new KeyNotFoundException($"Submission with ID '{submissionId}' was not found.");

        if (callerRole == Role.Student.ToString() && submission.StudentId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to access files for this submission.");

        if (callerRole == Role.Teacher.ToString() && submission.Assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("You do not have permission to access files for this submission.");

        return submission.FilePath;
    }

    private static SubmissionDto MapToDto(Submission s) => new()
    {
        Id = s.Id,
        AssignmentId = s.AssignmentId,
        AssignmentTitle = s.Assignment?.Title ?? string.Empty,
        StudentId = s.StudentId,
        StudentName = s.Student?.Name ?? string.Empty,
        Content = s.Content,
        FilePath = s.FilePath,
        SubmittedAt = s.SubmittedAt,
        IsLate = s.IsLate,
        Status = s.Status.ToString(),
        Marks = s.Marks,
        Feedback = s.Feedback,
        CreatedAt = s.CreatedAt,
        UpdatedAt = s.UpdatedAt
    };
}
