using AssignmentSystem.Api.DTOs.Assignments;
using FluentValidation;

namespace AssignmentSystem.Api.Validators;

public class CreateAssignmentDtoValidator : AbstractValidator<CreateAssignmentDto>
{
    public CreateAssignmentDtoValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty();
        RuleFor(x => x.SubjectId).NotEmpty();
        RuleFor(x => x.ClassId).NotEmpty();
        RuleFor(x => x.Deadline).NotEmpty().GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Deadline must be a future date.");
        RuleFor(x => x.MaxMarks).GreaterThan(0).WithMessage("MaxMarks must be greater than 0.");
    }
}

public class UpdateAssignmentDtoValidator : AbstractValidator<UpdateAssignmentDto>
{
    public UpdateAssignmentDtoValidator()
    {
        RuleFor(x => x.Title).MaximumLength(200).When(x => !string.IsNullOrEmpty(x.Title));
        RuleFor(x => x.MaxMarks).GreaterThan(0).When(x => x.MaxMarks.HasValue);
    }
}
