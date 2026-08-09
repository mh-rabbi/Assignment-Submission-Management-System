using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.Data.Entities;
using AssignmentSystem.Api.DTOs.Submissions;
using AssignmentSystem.Api.Services;
using AssignmentSystem.Api.Services.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace AssignmentSystem.Tests.Services;

public class SubmissionServiceTests
{
    private static AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubmitAsync_LateSubmission_WhenAllowLateIsFalse_ShouldThrowInvalidOperationException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var classId = Guid.NewGuid();
        var student = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student 1",
            Email = "student@test.com",
            Role = Role.Student,
            ClassId = classId,
            IsActive = true
        };
        db.Users.Add(student);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Math Assignment",
            Description = "Solve problems",
            SubjectId = Guid.NewGuid(),
            ClassId = classId,
            TeacherId = Guid.NewGuid(),
            Deadline = DateTimeOffset.UtcNow.AddHours(-1), // Past deadline
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowLateSubmission = false
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var dto = new SubmitAssignmentDto
        {
            AssignmentId = assignment.Id,
            Content = "My late answer"
        };

        // Act & Assert (Rule 1)
        var act = () => service.SubmitAsync(dto, student.Id, null);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*deadline*");
    }

    [Fact]
    public async Task SubmitAsync_LateSubmission_WhenAllowLateIsTrue_ShouldAcceptAndFlagIsLate()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var classId = Guid.NewGuid();
        var student = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student 1",
            Email = "student@test.com",
            Role = Role.Student,
            ClassId = classId,
            IsActive = true
        };
        db.Users.Add(student);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Physics Assignment",
            Description = "Lab report",
            SubjectId = Guid.NewGuid(),
            ClassId = classId,
            TeacherId = Guid.NewGuid(),
            Deadline = DateTimeOffset.UtcNow.AddHours(-2), // Past deadline
            MaxMarks = 50,
            Status = AssignmentStatus.Published,
            AllowLateSubmission = true
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var dto = new SubmitAssignmentDto
        {
            AssignmentId = assignment.Id,
            Content = "Late but allowed answer"
        };

        // Act (Rule 2)
        var result = await service.SubmitAsync(dto, student.Id, null);

        // Assert
        result.Should().NotBeNull();
        result.IsLate.Should().BeTrue();
        result.Content.Should().Be("Late but allowed answer");
    }

    [Fact]
    public async Task SubmitAsync_WhenAssignmentStatusIsClosed_ShouldRejectRegardlessOfDeadline()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var classId = Guid.NewGuid();
        var student = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student 1",
            Email = "student@test.com",
            Role = Role.Student,
            ClassId = classId,
            IsActive = true
        };
        db.Users.Add(student);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Closed Assignment",
            Description = "Done",
            SubjectId = Guid.NewGuid(),
            ClassId = classId,
            TeacherId = Guid.NewGuid(),
            Deadline = DateTimeOffset.UtcNow.AddHours(24), // Future deadline!
            MaxMarks = 100,
            Status = AssignmentStatus.Closed,
            AllowLateSubmission = true
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var dto = new SubmitAssignmentDto
        {
            AssignmentId = assignment.Id,
            Content = "Submitting to closed"
        };

        // Act & Assert (Rule 3)
        var act = () => service.SubmitAsync(dto, student.Id, null);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*closed*");
    }

    [Fact]
    public async Task SubmitAsync_OnEdit_ShouldCreateSubmissionHistoryRowAndUpsert()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var classId = Guid.NewGuid();
        var student = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student 1",
            Email = "student@test.com",
            Role = Role.Student,
            ClassId = classId,
            IsActive = true
        };
        db.Users.Add(student);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Draft Assignment",
            Description = "Task",
            SubjectId = Guid.NewGuid(),
            ClassId = classId,
            TeacherId = Guid.NewGuid(),
            Deadline = DateTimeOffset.UtcNow.AddHours(24),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowLateSubmission = false
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        // Initial submission
        var firstDto = new SubmitAssignmentDto { AssignmentId = assignment.Id, Content = "Version 1" };
        var firstResult = await service.SubmitAsync(firstDto, student.Id, null);

        // Act: Second submission (edit/upsert)
        var secondDto = new SubmitAssignmentDto { AssignmentId = assignment.Id, Content = "Version 2 (Updated)" };
        var secondResult = await service.SubmitAsync(secondDto, student.Id, null);

        // Assert (Rules 4 & 5)
        secondResult.Content.Should().Be("Version 2 (Updated)");

        var submissionsCount = await db.Submissions.CountAsync(s => s.AssignmentId == assignment.Id && s.StudentId == student.Id);
        submissionsCount.Should().Be(1); // Upserted, single row

        var historyRows = await db.SubmissionHistories.Where(h => h.SubmissionId == firstResult.Id).ToListAsync();
        historyRows.Should().HaveCount(1);
        historyRows.First().Content.Should().Be("Version 1");
    }

    [Fact]
    public async Task SubmitAsync_StudentSubmittingOutsideClass_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var studentClassId = Guid.NewGuid();
        var assignmentClassId = Guid.NewGuid();

        var student = new User
        {
            Id = Guid.NewGuid(),
            Name = "Student 1",
            Email = "student@test.com",
            Role = Role.Student,
            ClassId = studentClassId,
            IsActive = true
        };
        db.Users.Add(student);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Other Class Assignment",
            Description = "Task",
            SubjectId = Guid.NewGuid(),
            ClassId = assignmentClassId,
            TeacherId = Guid.NewGuid(),
            Deadline = DateTimeOffset.UtcNow.AddHours(24),
            MaxMarks = 100,
            Status = AssignmentStatus.Published,
            AllowLateSubmission = false
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var dto = new SubmitAssignmentDto { AssignmentId = assignment.Id, Content = "Cheat submission" };

        // Act & Assert (Rule 6)
        var act = () => service.SubmitAsync(dto, student.Id, null);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }

    [Fact]
    public async Task GradeAsync_WhenMarksExceedMaxMarks_ShouldThrowArgumentException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var teacherId = Guid.NewGuid();
        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Quiz",
            Description = "Quiz 1",
            SubjectId = Guid.NewGuid(),
            ClassId = Guid.NewGuid(),
            TeacherId = teacherId,
            Deadline = DateTimeOffset.UtcNow.AddHours(24),
            MaxMarks = 20,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = Guid.NewGuid(),
            Content = "Answers",
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTimeOffset.UtcNow
        };
        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        var gradeDto = new GradeSubmissionDto
        {
            Marks = 25, // Exceeds MaxMarks = 20
            Feedback = "Overachiever!"
        };

        // Act & Assert (Rule 10)
        var act = () => service.GradeAsync(submission.Id, gradeDto, teacherId, "Teacher");
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*20*");
    }

    [Fact]
    public async Task GradeAsync_TeacherNotOwningAssignment_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockFileStorage = new Mock<IFileStorageService>();
        var service = new SubmissionService(db, mockFileStorage.Object);

        var teacherId1 = Guid.NewGuid();
        var teacherId2 = Guid.NewGuid();

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Quiz",
            Description = "Quiz 1",
            SubjectId = Guid.NewGuid(),
            ClassId = Guid.NewGuid(),
            TeacherId = teacherId1,
            Deadline = DateTimeOffset.UtcNow.AddHours(24),
            MaxMarks = 20,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = Guid.NewGuid(),
            Content = "Answers",
            Status = SubmissionStatus.Submitted
        };
        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        var gradeDto = new GradeSubmissionDto { Marks = 15, Feedback = "Good" };

        // Act & Assert (Rule 8)
        var act = () => service.GradeAsync(submission.Id, gradeDto, teacherId2, "Teacher");
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
