using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.DTOs.Assignments;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _service;

    public AssignmentsController(IAssignmentService service)
    {
        _service = service;
    }

    /// <summary>List assignments accessible to caller (Admin sees all, Teacher sees own, Student sees published for their class).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<AssignmentDto>>> GetAll()
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();
        var callerClassId = User.GetClassId();

        var list = await _service.GetForCallerAsync(callerId, callerRole, callerClassId);
        return Ok(list);
    }

    /// <summary>Get a specific assignment by ID.</summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssignmentDto>> GetById(Guid id)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();
        var callerClassId = User.GetClassId();

        var item = await _service.GetByIdAsync(id, callerId, callerRole, callerClassId);
        return Ok(item);
    }

    /// <summary>Create assignment (Teacher / Admin only). Must be assigned to (Subject, Class) in TeacherSubjectClass.</summary>
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentDto dto)
    {
        var callerId = User.GetUserId();
        var item = await _service.CreateAsync(dto, callerId);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    /// <summary>Update assignment details (Owning Teacher or Admin only).</summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<AssignmentDto>> Update(Guid id, [FromBody] UpdateAssignmentDto dto)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var item = await _service.UpdateAsync(id, dto, callerId, callerRole);
        return Ok(item);
    }

    /// <summary>Transition assignment status (Draft -> Published -> Closed).</summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<AssignmentDto>> PatchStatus(Guid id, [FromBody] PatchAssignmentStatusDto dto)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        var item = await _service.PatchStatusAsync(id, dto.Status, callerId, callerRole);
        return Ok(item);
    }

    /// <summary>Delete assignment (Owning Teacher or Admin only).</summary>
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        await _service.DeleteAsync(id, callerId, callerRole);
        return NoContent();
    }
}
