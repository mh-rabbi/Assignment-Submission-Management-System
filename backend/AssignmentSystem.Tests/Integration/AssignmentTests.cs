using System.Net;
using FluentAssertions;
using Npgsql;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class AssignmentTests
{
    private readonly ApiIntegrationFixture _fx;

    public AssignmentTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task Assignments_TeacherCrudStatusVisibilityAndPersistence_ShouldBehaveCorrectly()
    {
        var title = $"{_fx.Prefix}-Assignment";
        var id = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, title);

        (await _fx.CountRowsAsync(@"select count(*) from ""Assignments"" where ""Id"" = @id and ""Status"" = 'Draft'",
            new NpgsqlParameter("id", id))).Should().Be(1);

        using var getAsTeacher = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Teacher1Token));
        getAsTeacher.StatusCode.Should().Be(HttpStatusCode.OK);

        using var hiddenFromStudentWhileDraft = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Student1Token));
        hiddenFromStudentWhileDraft.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var wrongTeacherGet = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Teacher2Token));
        wrongTeacherGet.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var update = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/assignments/{id}",
            new { title = $"{title}-Updated", maxMarks = 80 }, _fx.Teacher1Token));
        update.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _fx.CountRowsAsync(@"select count(*) from ""Assignments"" where ""Id"" = @id and ""Title"" = @title and ""MaxMarks"" = 80",
            new NpgsqlParameter("id", id), new NpgsqlParameter("title", $"{title}-Updated"))).Should().Be(1);

        using var invalidUpdate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Put, $"api/assignments/{id}",
            new { maxMarks = 0 }, _fx.Teacher1Token));
        invalidUpdate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        await _fx.PublishAssignmentAsync(id, _fx.Teacher1Token);

        using var visibleToClassStudent = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Student1Token));
        visibleToClassStudent.StatusCode.Should().Be(HttpStatusCode.OK);

        using var hiddenFromOtherClassStudent = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Student3Token));
        hiddenFromOtherClassStudent.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var close = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/assignments/{id}/status",
            new { status = "Closed" }, _fx.Teacher1Token));
        close.StatusCode.Should().Be(HttpStatusCode.OK);

        using var invalidStatus = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/assignments/{id}/status",
            new { status = "Archived" }, _fx.Teacher1Token));
        invalidStatus.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var delete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/assignments/{id}", _fx.Teacher1Token));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _fx.CountRowsAsync(@"select count(*) from ""Assignments"" where ""Id"" = @id",
            new NpgsqlParameter("id", id))).Should().Be(0);

        using var getDeleted = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{id}", _fx.Teacher1Token));
        getDeleted.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Assignments_CreateValidationAuthorizationAndConflictCases_ShouldBehaveCorrectly()
    {
        using var missingRequired = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/assignments",
            new { title = "", description = "", subjectId = Guid.Empty, classId = Guid.Empty, deadline = DateTimeOffset.UtcNow.AddDays(1), maxMarks = 10 }, _fx.Teacher1Token));
        missingRequired.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var pastDeadline = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/assignments",
            new { title = $"{_fx.Prefix}-Past", description = "past", subjectId = _fx.Seed.MathSubjectId, classId = _fx.Seed.Grade10ClassId, deadline = DateTimeOffset.UtcNow.AddDays(-1), maxMarks = 10 }, _fx.Teacher1Token));
        pastDeadline.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var studentCreate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/assignments",
            new { title = $"{_fx.Prefix}-Student", description = "student", subjectId = _fx.Seed.MathSubjectId, classId = _fx.Seed.Grade10ClassId, deadline = DateTimeOffset.UtcNow.AddDays(1), maxMarks = 10 }, _fx.Student1Token));
        studentCreate.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var unassignedTeacher = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/assignments",
            new { title = $"{_fx.Prefix}-Unassigned", description = "unassigned", subjectId = _fx.Seed.EnglishSubjectId, classId = _fx.Seed.Grade11ClassId, deadline = DateTimeOffset.UtcNow.AddDays(1), maxMarks = 10 }, _fx.Teacher1Token));
        unassignedTeacher.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var adminCreate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/assignments",
            new { title = $"{_fx.Prefix}-Admin", description = "admin", teacherId = _fx.Seed.Teacher1Id, subjectId = _fx.Seed.MathSubjectId, classId = _fx.Seed.Grade10ClassId, deadline = DateTimeOffset.UtcNow.AddDays(1), maxMarks = 10 }, _fx.AdminToken));
        adminCreate.StatusCode.Should().Be(HttpStatusCode.Created);
    }
}
