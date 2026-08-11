using AssignmentSystem.Api.Common.Enums;
using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.Data;
using AssignmentSystem.Api.DTOs.Assignments;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _service;
    private readonly AppDbContext _db;

    public AssignmentsController(IAssignmentService service, AppDbContext db)
    {
        _service = service;
        _db = db;
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

    /// <summary>Create assignment (Teacher / Admin only). If caller is Teacher, any TeacherId in body is ignored and caller's ID is used. If caller is Admin, TeacherId is required in body and must belong to a active Teacher. Must be assigned to (Subject, Class) in TeacherSubjectClass.</summary>
    [HttpPost]
    [Authorize(Roles = "Teacher,Admin")]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentDto dto)
    {
        var callerId = User.GetUserId();
        var callerRole = User.GetRole();

        Guid resolvedTeacherId;
        if (callerRole == Role.Teacher.ToString())
        {
            resolvedTeacherId = callerId;
        }
        else if (callerRole == Role.Admin.ToString())
        {
            if (!dto.TeacherId.HasValue)
                throw new ArgumentException("TeacherId is required when an Admin creates an assignment.");

            var teacherUser = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId.Value && u.IsActive);
            if (teacherUser == null || teacherUser.Role != Role.Teacher)
                throw new ArgumentException($"User with ID '{dto.TeacherId.Value}' is not a valid active teacher.");

            resolvedTeacherId = dto.TeacherId.Value;
        }
        else
        {
            throw new UnauthorizedAccessException("Not authorized to create assignments.");
        }

        var item = await _service.CreateAsync(dto, resolvedTeacherId);
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
