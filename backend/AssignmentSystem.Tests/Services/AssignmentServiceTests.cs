using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Assignments;
using AssignmentSystem.Api.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace AssignmentSystem.Tests.Services;

public class AssignmentServiceTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_TeacherNotAssignedToSubjectAndClass_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var service = new AssignmentService(db);

        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var classId = Guid.NewGuid();

        var dto = new CreateAssignmentDto
        {
            Title = "Math Exam",
            Description = "Algebra",
            SubjectId = subjectId,
            ClassId = classId,
            Deadline = DateTimeOffset.UtcNow.AddDays(7),
            MaxMarks = 100,
            AllowLateSubmission = false
        };

        // Act & Assert (Rule 7)
        var act = () => service.CreateAsync(dto, teacherId);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*not assigned*");
    }

    [Fact]
    public async Task CreateAsync_TeacherAssignedToSubjectAndClass_ShouldSucceed()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var service = new AssignmentService(db);

        var teacher = new User
        {
            Id = Guid.NewGuid(),
            Name = "Teacher John",
            Email = "john@test.com",
            Role = Role.Teacher,
            IsActive = true
        };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Math", IsActive = true };
        var classObj = new ClassEntity { Id = Guid.NewGuid(), Name = "Grade 10", IsActive = true };

        db.Users.Add(teacher);
        db.Subjects.Add(subject);
        db.Classes.Add(classObj);

        // TeacherSubjectClass assignment exists
        var tsc = new TeacherSubjectClass
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher.Id,
            SubjectId = subject.Id,
            ClassId = classObj.Id
        };
        db.TeacherSubjectClasses.Add(tsc);
        await db.SaveChangesAsync();

        var dto = new CreateAssignmentDto
        {
            Title = "Math Assignment 1",
            Description = "Chapter 1",
            SubjectId = subject.Id,
            ClassId = classObj.Id,
            Deadline = DateTimeOffset.UtcNow.AddDays(5),
            MaxMarks = 100
        };

        // Act
        var result = await service.CreateAsync(dto, teacher.Id);

        // Assert
        result.Should().NotBeNull();
        result.Title.Should().Be("Math Assignment 1");
        result.Status.Should().Be("Draft"); // Default status is Draft
    }
}
