using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.TeacherAssignments;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class TeacherAssignmentService : ITeacherAssignmentService
{
    private readonly AppDbContext _db;

    public TeacherAssignmentService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<TeacherAssignmentDto>> GetAllAsync()
    {
        var list = await _db.TeacherSubjectClasses
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .Include(t => t.Class)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<IEnumerable<TeacherAssignmentDto>> GetByTeacherAsync(Guid teacherId)
    {
        var list = await _db.TeacherSubjectClasses
            .Include(t => t.Teacher)
            .Include(t => t.Subject)
            .Include(t => t.Class)
            .Where(t => t.TeacherId == teacherId)
            .AsNoTracking()
            .ToListAsync();

        return list.Select(MapToDto);
    }

    public async Task<TeacherAssignmentDto> CreateAsync(CreateTeacherAssignmentDto dto)
    {
        // Validate teacher
        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId && u.IsActive);
        if (teacher == null)
            throw new KeyNotFoundException($"Teacher with ID '{dto.TeacherId}' was not found.");
        if (teacher.Role != Role.Teacher)
            throw new ArgumentException($"User '{dto.TeacherId}' is not a Teacher.");

        // Validate subject
        var subjectExists = await _db.Subjects.AnyAsync(s => s.Id == dto.SubjectId && s.IsActive);
        if (!subjectExists)
            throw new KeyNotFoundException($"Subject with ID '{dto.SubjectId}' was not found.");

        // Validate class
        var classExists = await _db.Classes.AnyAsync(c => c.Id == dto.ClassId && c.IsActive);
        if (!classExists)
            throw new KeyNotFoundException($"Class with ID '{dto.ClassId}' was not found.");

        // Duplicate check
        var exists = await _db.TeacherSubjectClasses.AnyAsync(t =>
            t.TeacherId == dto.TeacherId &&
            t.SubjectId == dto.SubjectId &&
            t.ClassId == dto.ClassId);

        if (exists)
            throw new InvalidOperationException("This Teacher is already assigned to this Subject and Class.");

        var entity = new TeacherSubjectClass
        {
            Id = Guid.NewGuid(),
            TeacherId = dto.TeacherId,
            SubjectId = dto.SubjectId,
            ClassId = dto.ClassId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.TeacherSubjectClasses.Add(entity);
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException("This Teacher is already assigned to this Subject and Class.");
        }

        return (await GetByTeacherAsync(dto.TeacherId)).First(t => t.Id == entity.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _db.TeacherSubjectClasses.FindAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Teacher assignment with ID '{id}' was not found.");

        _db.TeacherSubjectClasses.Remove(entity);
        await _db.SaveChangesAsync();
    }

    private static TeacherAssignmentDto MapToDto(TeacherSubjectClass t) => new()
    {
        Id = t.Id,
        TeacherId = t.TeacherId,
        TeacherName = t.Teacher?.Name ?? string.Empty,
        SubjectId = t.SubjectId,
        SubjectName = t.Subject?.Name ?? string.Empty,
        ClassId = t.ClassId,
        ClassName = t.Class?.Name ?? string.Empty,
        CreatedAt = t.CreatedAt
    };
}
