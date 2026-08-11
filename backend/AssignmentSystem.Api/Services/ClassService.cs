using AssignmentSystem.Api.Common.Exceptions;
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
            .Where(c => c.IsActive)
            .AsNoTracking()
            .ToListAsync();

        return classes.Select(MapToDto);
    }

    public async Task<ClassDto> GetByIdAsync(Guid id)
    {
        var entity = await _db.Classes
            .Where(c => c.IsActive)
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);

        if (entity == null)
            throw new KeyNotFoundException($"Class with ID '{id}' was not found.");

        return MapToDto(entity);
    }

    public async Task<ClassDto> CreateAsync(CreateClassDto dto)
    {
        var nameLower = dto.Name.Trim().ToLower();
        var exists = await _db.Classes.AnyAsync(c => c.IsActive && c.Name.ToLower() == nameLower);
        if (exists)
            throw new ConflictException($"A class with the name '{dto.Name}' already exists.");

        var now = DateTimeOffset.UtcNow;
        var entity = new ClassEntity
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        try
        {
            _db.Classes.Add(entity);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new ConflictException($"A class with the name '{dto.Name}' already exists.", ex);
        }

        return MapToDto(entity);
    }

    public async Task<ClassDto> UpdateAsync(Guid id, UpdateClassDto dto)
    {
        var entity = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.IsActive);
        if (entity == null)
            throw new KeyNotFoundException($"Class with ID '{id}' was not found.");

        if (!string.IsNullOrEmpty(dto.Name))
        {
            var nameLower = dto.Name.Trim().ToLower();
            var duplicateExists = await _db.Classes.AnyAsync(c => c.Id != id && c.IsActive && c.Name.ToLower() == nameLower);
            if (duplicateExists)
                throw new ConflictException($"A class with the name '{dto.Name}' already exists.");

            entity.Name = dto.Name;
        }

        entity.UpdatedAt = DateTimeOffset.UtcNow;
        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            throw new ConflictException($"A class with the name '{dto.Name}' already exists.", ex);
        }

        return MapToDto(entity);
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id && c.IsActive);
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
