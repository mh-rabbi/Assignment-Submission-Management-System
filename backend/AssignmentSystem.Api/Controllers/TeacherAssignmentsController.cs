using AssignmentSystem.Api.Common.Helpers;
using AssignmentSystem.Api.DTOs.TeacherAssignments;
using AssignmentSystem.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AssignmentSystem.Api.Controllers;

[ApiController]
[Route("api/teacher-assignments")]
[Authorize]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly ITeacherAssignmentService _service;

    public TeacherAssignmentsController(ITeacherAssignmentService service)
    {
        _service = service;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<TeacherAssignmentDto>>> GetAll()
    {
        var list = await _service.GetAllAsync();
        return Ok(list);
    }

    [HttpGet("teacher/{teacherId:guid}")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<IEnumerable<TeacherAssignmentDto>>> GetByTeacher(Guid teacherId)
    {
        var callerRole = User.GetRole();
        var callerId = User.GetUserId();

        if (callerRole == "Teacher" && callerId != teacherId)
            return Forbid();

        var list = await _service.GetByTeacherAsync(teacherId);
        return Ok(list);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TeacherAssignmentDto>> Create([FromBody] CreateTeacherAssignmentDto dto)
    {
        var item = await _service.CreateAsync(dto);
        return Ok(item);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}
