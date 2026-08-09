using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Subjects;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class SubjectService : ISubjectService
{
    private readonly AppDbContext _db;

    public SubjectService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<SubjectDto>> GetAllAsync()
    {
        var subjects = await _db.Subjects
            .AsNoTracking()
            .ToListAsync();

        return subjects.Select(MapToDto);
    }

    public async Task<SubjectDto> GetByIdAsync(Guid id)
    {
        var entity = await _db.Subjects
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == id);

        if (entity == null)
            throw new KeyNotFoundException($"Subject with ID '{id}' was not found.");

        return MapToDto(entity);
    }

    public async Task<SubjectDto> CreateAsync(CreateSubjectDto dto)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new Subject
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Subjects.Add(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<SubjectDto> UpdateAsync(Guid id, UpdateSubjectDto dto)
    {
        var entity = await _db.Subjects.FindAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Subject with ID '{id}' was not found.");

        if (!string.IsNullOrEmpty(dto.Name))
            entity.Name = dto.Name;

        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _db.Subjects.FindAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Subject with ID '{id}' was not found.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static SubjectDto MapToDto(Subject s) => new()
    {
        Id = s.Id,
        Name = s.Name,
        IsActive = s.IsActive,
        CreatedAt = s.CreatedAt
    };
}
