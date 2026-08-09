using AssignmentSystem.Api.DTOs.Submissions;
using FluentValidation;

namespace AssignmentSystem.Api.Validators;

public class SubmitAssignmentDtoValidator : AbstractValidator<SubmitAssignmentDto>
{
    public SubmitAssignmentDtoValidator()
    {
        RuleFor(x => x.AssignmentId).NotEmpty();
        RuleFor(x => x.Content).NotEmpty().WithMessage("Submission content is required.");
    }
}

public class GradeSubmissionDtoValidator : AbstractValidator<GradeSubmissionDto>
{
    public GradeSubmissionDtoValidator()
    {
        RuleFor(x => x.Marks).GreaterThanOrEqualTo(0).WithMessage("Marks must be non-negative.");
    }
}
