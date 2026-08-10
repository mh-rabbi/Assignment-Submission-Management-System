using System.Net;
using FluentAssertions;
using Npgsql;

namespace AssignmentSystem.Tests.Integration;

[Collection(IntegrationTestCollection.Name)]
public sealed class SubmissionTests
{
    private readonly ApiIntegrationFixture _fx;

    public SubmissionTests(ApiIntegrationFixture fx) => _fx = fx;

    [Fact]
    public async Task Submissions_StudentSubmitEditHistoryGradeStatusFileAndPersistence_ShouldBehaveCorrectly()
    {
        var assignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-Submission-Assignment");
        await _fx.PublishAssignmentAsync(assignmentId, _fx.Teacher1Token);

        using var first = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} first submission"), "Content" },
            { new ByteArrayContent("hello from qa"u8.ToArray()), "file", $"{_fx.Prefix}-answer.txt" }
        };
        using var invalidFileRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        invalidFileRequest.Content = first;
        using var invalidFile = await _fx.Client.SendAsync(invalidFileRequest);
        invalidFile.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var validContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} first submission"), "Content" },
            { new ByteArrayContent("hello from qa"u8.ToArray()), "file", $"{_fx.Prefix}-answer.pdf" }
        };
        using var validRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        validRequest.Content = validContent;
        using var created = await _fx.Client.SendAsync(validRequest);
        created.StatusCode.Should().Be(HttpStatusCode.OK);
        var createdJson = await _fx.ReadJsonNodeAsync(created);
        var submissionId = Guid.Parse(createdJson["id"]!.GetValue<string>());
        createdJson["filePath"]!.GetValue<string>().Should().Contain(_fx.Prefix);

        (await _fx.CountRowsAsync(@"select count(*) from ""Submissions"" where ""Id"" = @id and ""Content"" = @content",
            new NpgsqlParameter("id", submissionId), new NpgsqlParameter("content", $"{_fx.Prefix} first submission"))).Should().Be(1);

        using var mine = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/submissions/mine", _fx.Student1Token));
        mine.StatusCode.Should().Be(HttpStatusCode.OK);

        using var file = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/submissions/{submissionId}/file", _fx.Student1Token));
        file.StatusCode.Should().Be(HttpStatusCode.OK);
        file.Content.Headers.ContentDisposition?.FileNameStar.Should().NotBeNull();

        using var secondContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} edited submission"), "Content" }
        };
        using var editRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        editRequest.Content = secondContent;
        using var edited = await _fx.Client.SendAsync(editRequest);
        edited.StatusCode.Should().Be(HttpStatusCode.OK);

        (await _fx.CountRowsAsync(@"select count(*) from ""Submissions"" where ""AssignmentId"" = @assignmentId and ""StudentId"" = @studentId",
            new NpgsqlParameter("assignmentId", assignmentId), new NpgsqlParameter("studentId", _fx.Seed.Student1Id))).Should().Be(1);
        (await _fx.CountRowsAsync(@"select count(*) from ""SubmissionHistories"" where ""SubmissionId"" = @submissionId",
            new NpgsqlParameter("submissionId", submissionId))).Should().Be(1);

        using var history = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/submissions/{submissionId}/history", _fx.Student1Token));
        history.StatusCode.Should().Be(HttpStatusCode.OK);

        using var grade = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/submissions/{submissionId}/grade",
            new { marks = 75, feedback = $"{_fx.Prefix} good work" }, _fx.Teacher1Token));
        grade.StatusCode.Should().Be(HttpStatusCode.OK);
        (await _fx.CountRowsAsync(@"select count(*) from ""Submissions"" where ""Id"" = @id and ""Marks"" = 75 and ""Status"" = 'Graded'",
            new NpgsqlParameter("id", submissionId))).Should().Be(1);

        using var tooManyMarks = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/submissions/{submissionId}/grade",
            new { marks = 999, feedback = "too much" }, _fx.Teacher1Token));
        tooManyMarks.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var patchStatus = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/submissions/{submissionId}/status",
            new { status = "Submitted" }, _fx.Teacher1Token));
        patchStatus.StatusCode.Should().Be(HttpStatusCode.OK);

        using var getForAssignment = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/assignments/{assignmentId}/submissions", _fx.Teacher1Token));
        getForAssignment.StatusCode.Should().Be(HttpStatusCode.OK);

        using var adminAll = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, "api/submissions", _fx.AdminToken));
        adminAll.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Submissions_ValidationAuthorizationDeadlineAndMissingResources_ShouldBehaveCorrectly()
    {
        var assignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-Submission-Negative");
        await _fx.PublishAssignmentAsync(assignmentId, _fx.Teacher1Token);

        using var missingFileAndContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" }
        };
        using var missingRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        missingRequest.Content = missingFileAndContent;
        using var missingContent = await _fx.Client.SendAsync(missingRequest);
        missingContent.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        using var otherClass = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} wrong class"), "Content" }
        };
        using var otherClassRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student3Token);
        otherClassRequest.Content = otherClass;
        using var otherClassSubmit = await _fx.Client.SendAsync(otherClassRequest);
        otherClassSubmit.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var teacherSubmit = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Post, "api/submissions",
            new { assignmentId, content = "teacher cannot submit" }, _fx.Teacher1Token));
        teacherSubmit.StatusCode.Should().Be(HttpStatusCode.Forbidden);

        using var missingSubmission = await _fx.Client.SendAsync(ApiIntegrationFixture.EmptyRequest(HttpMethod.Get, $"api/submissions/{Guid.NewGuid()}", _fx.AdminToken));
        missingSubmission.StatusCode.Should().Be(HttpStatusCode.NotFound);

        using var wrongTeacherGrade = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/submissions/{Guid.NewGuid()}/grade",
            new { marks = 1 }, _fx.Teacher2Token));
        wrongTeacherGrade.StatusCode.Should().Be(HttpStatusCode.NotFound);

        var closedAssignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-Closed-Assignment");
        await _fx.PublishAssignmentAsync(closedAssignmentId, _fx.Teacher1Token);
        using (var close = await _fx.Client.SendAsync(ApiIntegrationFixture.JsonRequest(HttpMethod.Patch, $"api/assignments/{closedAssignmentId}/status", new { status = "Closed" }, _fx.Teacher1Token)))
        {
            close.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        using var closedContent = new MultipartFormDataContent
        {
            { new StringContent(closedAssignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} closed"), "Content" }
        };
        using var closedRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        closedRequest.Content = closedContent;
        using var closedSubmit = await _fx.Client.SendAsync(closedRequest);
        closedSubmit.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Submissions_MissingOptionalFileWithValidContent_ShouldSucceed()
    {
        var assignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-File-Missing");
        await _fx.PublishAssignmentAsync(assignmentId, _fx.Teacher1Token);

        using var missingFileContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} no file but valid content"), "Content" }
        };
        using var missingFileRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        missingFileRequest.Content = missingFileContent;
        using var missingFile = await _fx.Client.SendAsync(missingFileRequest);
        missingFile.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Submissions_EmptyUploadedFile_ShouldReturnBadRequest()
    {
        var assignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-File-Empty");
        await _fx.PublishAssignmentAsync(assignmentId, _fx.Teacher1Token);

        using var emptyFileContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} empty file"), "Content" },
            { new ByteArrayContent(Array.Empty<byte>()), "file", $"{_fx.Prefix}-empty.pdf" }
        };
        using var emptyFileRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        emptyFileRequest.Content = emptyFileContent;
        using var emptyFile = await _fx.Client.SendAsync(emptyFileRequest);
        emptyFile.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Submissions_OversizedUploadedFile_ShouldReturnBadRequest()
    {
        var assignmentId = await _fx.CreateAssignmentAsync(_fx.Teacher1Token, _fx.Seed.MathSubjectId, _fx.Seed.Grade10ClassId, $"{_fx.Prefix}-File-Oversized");
        await _fx.PublishAssignmentAsync(assignmentId, _fx.Teacher1Token);

        using var oversizedFileContent = new MultipartFormDataContent
        {
            { new StringContent(assignmentId.ToString()), "AssignmentId" },
            { new StringContent($"{_fx.Prefix} oversized file"), "Content" },
            { new ByteArrayContent(new byte[(10 * 1024 * 1024) + 1]), "file", $"{_fx.Prefix}-oversized.pdf" }
        };
        using var oversizedFileRequest = ApiIntegrationFixture.EmptyRequest(HttpMethod.Post, "api/submissions", _fx.Student1Token);
        oversizedFileRequest.Content = oversizedFileContent;
        using var oversizedFile = await _fx.Client.SendAsync(oversizedFileRequest);
        oversizedFile.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
