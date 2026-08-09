using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Data.Seed;

/// <summary>
/// Idempotent seeder — checks if data already exists before inserting.
/// Demo credentials are documented in README.md.
/// </summary>
public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Skip if already seeded
        if (await db.Users.AnyAsync())
            return;

        var now = DateTimeOffset.UtcNow;

        // ── Classes ──────────────────────────────────────────────────────────
        var class10 = new ClassEntity
        {
            Id = Guid.NewGuid(),
            Name = "Grade 10",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        var class11 = new ClassEntity
        {
            Id = Guid.NewGuid(),
            Name = "Grade 11",
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Classes.AddRange(class10, class11);

        // ── Subjects ─────────────────────────────────────────────────────────
        var math = new Subject { Id = Guid.NewGuid(), Name = "Mathematics", IsActive = true, CreatedAt = now, UpdatedAt = now };
        var physics = new Subject { Id = Guid.NewGuid(), Name = "Physics", IsActive = true, CreatedAt = now, UpdatedAt = now };
        var english = new Subject { Id = Guid.NewGuid(), Name = "English", IsActive = true, CreatedAt = now, UpdatedAt = now };
        db.Subjects.AddRange(math, physics, english);

        // ── Users ─────────────────────────────────────────────────────────────
        var admin = new User
        {
            Id = Guid.NewGuid(),
            Name = "System Admin",
            Email = "admin@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = Role.Admin,
            ClassId = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var teacher1 = new User
        {
            Id = Guid.NewGuid(),
            Name = "Teacher One",
            Email = "teacher1@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher@123"),
            Role = Role.Teacher,
            ClassId = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var teacher2 = new User
        {
            Id = Guid.NewGuid(),
            Name = "Teacher Two",
            Email = "teacher2@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher@123"),
            Role = Role.Teacher,
            ClassId = null,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var student1 = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student One",
            Email = "student1@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = Role.Student,
            ClassId = class10.Id,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var student2 = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student Two",
            Email = "student2@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = Role.Student,
            ClassId = class10.Id,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        var student3 = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student Three",
            Email = "student3@school.test",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
            Role = Role.Student,
            ClassId = class11.Id,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.Users.AddRange(admin, teacher1, teacher2, student1, student2, student3);

        // ── TeacherSubjectClass assignments ───────────────────────────────────
        // teacher1 teaches Math and Physics in Grade 10
        // teacher2 teaches English in Grade 10 and Math in Grade 11
        var tsc1 = new TeacherSubjectClass { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = math.Id, ClassId = class10.Id, CreatedAt = now };
        var tsc2 = new TeacherSubjectClass { Id = Guid.NewGuid(), TeacherId = teacher1.Id, SubjectId = physics.Id, ClassId = class10.Id, CreatedAt = now };
        var tsc3 = new TeacherSubjectClass { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = english.Id, ClassId = class10.Id, CreatedAt = now };
        var tsc4 = new TeacherSubjectClass { Id = Guid.NewGuid(), TeacherId = teacher2.Id, SubjectId = math.Id, ClassId = class11.Id, CreatedAt = now };
        db.TeacherSubjectClasses.AddRange(tsc1, tsc2, tsc3, tsc4);

        await db.SaveChangesAsync();
    }
}
