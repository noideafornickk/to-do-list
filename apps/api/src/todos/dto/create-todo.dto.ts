import { IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTodoDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  title!: string;
}
