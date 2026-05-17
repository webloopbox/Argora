import { IsIn } from 'class-validator';

export type VoteValue = 1 | -1;

export class CastVoteDto {
  @IsIn([1, -1])
  value!: VoteValue;
}
