using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Classes;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class ClassService : IClassService
{
    private readonly AppDbContext _db;

    public ClassService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ClassDto>> GetAllAsync()
    {
        var classes = await _db.Classes
            .AsNoTracking()
            .ToListAsync();

        return classes.Select(MapToDto);
    }

    public async Task<ClassDto> GetByIdAsync(Guid id)
    {
        var entity = await _db.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (entity == null)
            throw new KeyNotFoundException($"Class with ID '{id}' was not found.");

        return MapToDto(entity);
    }

    public async Task<ClassDto> CreateAsync(CreateClassDto dto)
    {
        var now = DateTimeOffset.UtcNow;
        var entity = new ClassEntity
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Classes.Add(entity);
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<ClassDto> UpdateAsync(Guid id, UpdateClassDto dto)
    {
        var entity = await _db.Classes.FindAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Class with ID '{id}' was not found.");

        if (!string.IsNullOrEmpty(dto.Name))
            entity.Name = dto.Name;

        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _db.Classes.FindAsync(id);
        if (entity == null)
            throw new KeyNotFoundException($"Class with ID '{id}' was not found.");

        entity.IsActive = false;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static ClassDto MapToDto(ClassEntity c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        IsActive = c.IsActive,
        CreatedAt = c.CreatedAt
    };
}
