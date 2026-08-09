using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.DTOs.Submissions;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _service;

    public SubmissionsController(ISubmissionService service)
    {
        _service = service;
    }

    /// <summary>Admin view: List all submissions across the system.</summary>
    [HttpGet("submissions")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<SubmissionDto>>> GetAll()
    {
        var list = await _service.GetAllAsync();
        return Ok(list);
    }

    /// <summary>Student view: List own submissions.</summary>
    [HttpGet("submissions/mine")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<IEnumerable<SubmissionDto>>> GetMine()
    {
        var studentId = User.GetUserId();
        var list = await _service.GetMySubmissionsAsync(studentId);
        return Ok(list);
    }

    /// <summary>Teacher / Admin view: List all submissions for an assignment.</summary>
    [HttpGet("assignments/{assignmentId:guid}/submissions")]
    public async Task<ActionResult<IEnumerable<SubmissionDto>>> GetForAssignment(Guid assignmentId)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var list = await _service.GetForAssignmentAsync(assignmentId, callerId, callerRole);
        return Ok(list);
    }

    /// <summary>Get submission by ID.</summary>
    [HttpGet("submissions/{id:guid}")]
    public async Task<ActionResult<SubmissionDto>> GetById(Guid id)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var item = await _service.GetByIdAsync(id, callerId, callerRole);
        return Ok(item);
    }

    /// <summary>Student submits or edits work for an assignment (supports multipart form data file upload).</summary>
    [HttpPost("submissions")]
    [Authorize(Roles = "Student")]
    [Consumes("multipart/form-data", "application/json")]
    public async Task<ActionResult<SubmissionDto>> Submit([FromForm] SubmitAssignmentDto dto, IFormFile? file)
    {
        var studentId = User.GetUserId();
        var result = await _service.SubmitAsync(dto, studentId, file);
        return Ok(result);
    }

    /// <summary>Teacher / Admin grades a submission.</summary>
    [HttpPatch("submissions/{id:guid}/grade")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionDto>> Grade(Guid id, [FromBody] GradeSubmissionDto dto)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var result = await _service.GradeAsync(id, dto, callerId, callerRole);
        return Ok(result);
    }

    /// <summary>Teacher / Admin manual status override for a submission.</summary>
    [HttpPatch("submissions/{id:guid}/status")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<SubmissionDto>> PatchStatus(Guid id, [FromBody] PatchSubmissionStatusDto dto)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var result = await _service.PatchStatusAsync(id, dto.Status, callerId, callerRole);
        return Ok(result);
    }

    /// <summary>View submission edit history.</summary>
    [HttpGet("submissions/{id:guid}/history")]
    public async Task<ActionResult<IEnumerable<SubmissionHistoryDto>>> GetHistory(Guid id)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var history = await _service.GetHistoryAsync(id, callerId, callerRole);
        return Ok(history);
    }

    /// <summary>Secure file serving: Download submission file attachment.</summary>
    [HttpGet("submissions/{id:guid}/file")]
    public async Task<IActionResult> GetFile(Guid id)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var filePath = await _service.GetFilePathAsync(id, callerId, callerRole);
        if (string.IsNullOrEmpty(filePath) || !System.IO.File.Exists(filePath))
            return NotFound("File attachment not found.");

        var contentType = "application/octet-stream";
        var fileName = Path.GetFileName(filePath);

        return PhysicalFile(filePath, contentType, fileName);
    }
}
