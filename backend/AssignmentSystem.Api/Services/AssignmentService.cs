using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Assignments;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class AssignmentService : IAssignmentService
{
    private readonly AppDbContext _db;

    public AssignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<AssignmentDto>> GetAllAsync()
    {
        var assignments = await _db.Assignments
            .Include(a => a.Subject)
            .Include(a => a.Class)
            .Include(a => a.Teacher)
            .AsNoTracking()
            .ToListAsync();

        return assignments.Select(MapToDto);
    }

    public async Task<IEnumerable<AssignmentDto>> GetForCallerAsync(Guid callerId, string callerRole, Guid? callerClassId)
    {
        var query = _db.Assignments
            .Include(a => a.Subject)
            .Include(a => a.Class)
            .Include(a => a.Teacher)
            .AsNoTracking();

        if (callerRole == Role.Admin.ToString())
        {
            // Admin sees all
        }
        else if (callerRole == Role.Teacher.ToString())
        {
            // Teacher sees own assignments
            query = query.Where(a => a.TeacherId == callerId);
        }
        else if (callerRole == Role.Student.ToString())
        {
            // Business Rule 3: Students can only view Published assignments where ClassId == Student.ClassId
            if (!callerClassId.HasValue)
                return Enumerable.Empty<AssignmentDto>();

            query = query.Where(a => a.ClassId == callerClassId.Value && a.Status == AssignmentStatus.Published);
        }

        var list = await query.ToListAsync();
        return list.Select(MapToDto);
    }

    public async Task<AssignmentDto> GetByIdAsync(Guid id, Guid callerId, string callerRole, Guid? callerClassId)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Subject)
            .Include(a => a.Class)
            .Include(a => a.Teacher)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{id}' was not found.");

        if (callerRole == Role.Student.ToString())
        {
            if (assignment.ClassId != callerClassId || assignment.Status != AssignmentStatus.Published)
                throw new UnauthorizedAccessException("You do not have permission to view this assignment.");
        }
        else if (callerRole == Role.Teacher.ToString())
        {
            if (assignment.TeacherId != callerId)
                throw new UnauthorizedAccessException("You do not have permission to view this assignment.");
        }

        return MapToDto(assignment);
    }

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentDto dto, Guid teacherId)
    {
        // Business Rule 2: (TeacherId, SubjectId, ClassId) must exist in TeacherSubjectClass, otherwise 403
        var isAssigned = await _db.TeacherSubjectClasses.AnyAsync(t =>
            t.TeacherId == teacherId &&
            t.SubjectId == dto.SubjectId &&
            t.ClassId == dto.ClassId);

        if (!isAssigned)
            throw new UnauthorizedAccessException("Teacher is not assigned to teach this Subject for this Class.");

        var now = DateTimeOffset.UtcNow;
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            SubjectId = dto.SubjectId,
            ClassId = dto.ClassId,
            TeacherId = teacherId,
            Deadline = dto.Deadline,
            MaxMarks = dto.MaxMarks,
            Status = AssignmentStatus.Draft, // default Draft
            AllowLateSubmission = dto.AllowLateSubmission,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Assignments.Add(assignment);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(assignment.Id, teacherId, Role.Teacher.ToString(), null);
    }

    public async Task<AssignmentDto> UpdateAsync(Guid id, UpdateAssignmentDto dto, Guid callerId, string callerRole)
    {
        var assignment = await _db.Assignments.FindAsync(id);
        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{id}' was not found.");

        if (callerRole != Role.Admin.ToString() && assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("Only the assigned teacher or an admin can update this assignment.");

        if (!string.IsNullOrEmpty(dto.Title))
            assignment.Title = dto.Title;

        if (!string.IsNullOrEmpty(dto.Description))
            assignment.Description = dto.Description;

        if (dto.Deadline.HasValue)
            assignment.Deadline = dto.Deadline.Value;

        if (dto.MaxMarks.HasValue)
            assignment.MaxMarks = dto.MaxMarks.Value;

        if (dto.AllowLateSubmission.HasValue)
            assignment.AllowLateSubmission = dto.AllowLateSubmission.Value;

        assignment.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(assignment.Id, callerId, callerRole, null);
    }

    public async Task<AssignmentDto> PatchStatusAsync(Guid id, string newStatus, Guid callerId, string callerRole)
    {
        var assignment = await _db.Assignments.FindAsync(id);
        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{id}' was not found.");

        if (callerRole != Role.Admin.ToString() && assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("Only the assigned teacher or an admin can update assignment status.");

        if (!Enum.TryParse<AssignmentStatus>(newStatus, true, out var status))
            throw new ArgumentException($"Invalid status: {newStatus}");

        assignment.Status = status;
        assignment.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(assignment.Id, callerId, callerRole, null);
    }

    public async Task DeleteAsync(Guid id, Guid callerId, string callerRole)
    {
        var assignment = await _db.Assignments.FindAsync(id);
        if (assignment == null)
            throw new KeyNotFoundException($"Assignment with ID '{id}' was not found.");

        if (callerRole != Role.Admin.ToString() && assignment.TeacherId != callerId)
            throw new UnauthorizedAccessException("Only the assigned teacher or an admin can delete this assignment.");

        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync();
    }

    private static AssignmentDto MapToDto(Assignment a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Description = a.Description,
        SubjectId = a.SubjectId,
        SubjectName = a.Subject?.Name ?? string.Empty,
        ClassId = a.ClassId,
        ClassName = a.Class?.Name ?? string.Empty,
        TeacherId = a.TeacherId,
        TeacherName = a.Teacher?.Name ?? string.Empty,
        Deadline = a.Deadline,
        MaxMarks = a.MaxMarks,
        Status = a.Status.ToString(),
        AllowLateSubmission = a.AllowLateSubmission,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}
