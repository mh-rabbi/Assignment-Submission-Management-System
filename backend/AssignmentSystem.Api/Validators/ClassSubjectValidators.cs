using AssignmentSystem.Api.DTOs.Classes;
using AssignmentSystem.Api.DTOs.Subjects;
using FluentValidation;

namespace AssignmentSystem.Api.Validators;

public class CreateClassDtoValidator : AbstractValidator<CreateClassDto>
{
    public CreateClassDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateSubjectDtoValidator : AbstractValidator<CreateSubjectDto>
{
    public CreateSubjectDtoValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class UpdateClassDtoValidator : AbstractValidator<UpdateClassDto>
{
    public UpdateClassDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .When(x => x.Name != null)
            .MaximumLength(100);
    }
}

public class UpdateSubjectDtoValidator : AbstractValidator<UpdateSubjectDto>
{
    public UpdateSubjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .When(x => x.Name != null)
            .MaximumLength(100);
    }
}
