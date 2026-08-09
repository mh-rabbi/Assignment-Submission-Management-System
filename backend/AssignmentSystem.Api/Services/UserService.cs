using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Users;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _db;

    public UserService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _db.Users
            .Include(u => u.Class)
            .AsNoTracking()
            .ToListAsync();

        return users.Select(MapToDto);
    }

    public async Task<UserDto> GetByIdAsync(Guid id)
    {
        var user = await _db.Users
            .Include(u => u.Class)
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new KeyNotFoundException($"User with ID '{id}' was not found.");

        return MapToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new InvalidOperationException("Email already in use.");

        if (!Enum.TryParse<Role>(dto.Role, true, out var role))
            throw new ArgumentException($"Invalid role: {dto.Role}");

        // Business rule 1: Only Role = Student may have non-null ClassId
        if (role != Role.Student && dto.ClassId.HasValue)
            throw new ArgumentException("ClassId can only be assigned to Students.");

        if (role == Role.Student && !dto.ClassId.HasValue)
            throw new ArgumentException("ClassId is required for Students.");

        if (dto.ClassId.HasValue)
        {
            var classExists = await _db.Classes.AnyAsync(c => c.Id == dto.ClassId.Value && c.IsActive);
            if (!classExists)
                throw new KeyNotFoundException($"Class with ID '{dto.ClassId.Value}' was not found or is inactive.");
        }

        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = role,
            ClassId = dto.ClassId,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto)
    {
        var user = await _db.Users
            .Include(u => u.Class)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
            throw new KeyNotFoundException($"User with ID '{id}' was not found.");

        if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
        {
            if (await _db.Users.AnyAsync(u => u.Email == dto.Email && u.Id != id))
                throw new InvalidOperationException("Email already in use by another user.");
            user.Email = dto.Email;
        }

        if (!string.IsNullOrEmpty(dto.Name))
            user.Name = dto.Name;

        if (!string.IsNullOrEmpty(dto.Password))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        if (dto.ClassId.HasValue)
        {
            if (user.Role != Role.Student)
                throw new ArgumentException("ClassId can only be assigned to Students.");

            var classExists = await _db.Classes.AnyAsync(c => c.Id == dto.ClassId.Value && c.IsActive);
            if (!classExists)
                throw new KeyNotFoundException($"Class with ID '{dto.ClassId.Value}' was not found or is inactive.");

            user.ClassId = dto.ClassId.Value;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();

        return await GetByIdAsync(user.Id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null)
            throw new KeyNotFoundException($"User with ID '{id}' was not found.");

        user.IsActive = false;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync();
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role.ToString(),
            ClassId = user.ClassId,
            ClassName = user.Class?.Name,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }
}
