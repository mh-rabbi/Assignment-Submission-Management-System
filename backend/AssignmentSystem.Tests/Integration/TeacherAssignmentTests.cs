using System.Net;
using FluentAssertions;
using Npgsql;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class TeacherAssignmentTests
{
    private readonly ApiIntegrationFixture _fx;

    public TeacherAssignmentTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task TeacherAssignments_CreateReadDuplicateDeleteAndRoleRestrictions_ShouldBehaveCorrectly()
    {
        var subjectId = await _fx.CreateSubjectAsync($"{_fx.Prefix}-Tsc-Subject");
        var classId = await _fx.CreateClassAsync($"{_fx.Prefix}-Tsc-Class");
        var id = await _fx.CreateTeacherAssignmentAsync(_fx.Seed.Teacher1Id, subjectId, classId);

        (await _fx.CountRowsAsync(@"select count(*) from ""TeacherSubjectClasses"" where ""Id"" = @id",
            new NpgsqlParameter("id", id))).Should().Be(1);

        using var getAll = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/teacher-assignments", _fx.AdminToken));
        getAll.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getMine = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/teacher-assignments/teacher/{_fx.Seed.Teacher1Id}", _fx.Teacher1Token));
        getMine.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getOtherTeacher = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/teacher-assignments/teacher/{_fx.Seed.Teacher2Id}", _fx.Teacher1Token));
        getOtherTeacher.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var duplicate = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/teacher-assignments",
            new { teacherId = _fx.Seed.Teacher1Id, subjectId, classId }, _fx.AdminToken));
        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var nonTeacher = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/teacher-assignments",
            new { teacherId = _fx.Seed.Student1Id, subjectId, classId }, _fx.AdminToken));
        nonTeacher.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var deleteAsTeacher = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/teacher-assignments/{id}", _fx.Teacher1Token));
        deleteAsTeacher.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var delete = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/teacher-assignments/{id}", _fx.AdminToken));
        delete.StatusCode.Should().Be(HttpStatusCode.NoContent);
        (await _fx.CountRowsAsync(@"select count(*) from ""TeacherSubjectClasses"" where ""Id"" = @id",
            new NpgsqlParameter("id", id))).Should().Be(0);

        using var deleteMissing = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Delete, $"api/teacher-assignments/{Guid.NewGuid()}", _fx.AdminToken));
        deleteMissing.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
