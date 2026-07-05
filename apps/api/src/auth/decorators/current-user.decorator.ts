import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface JwtPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): JwtPayload | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    return data ? user?.[data] : user;
  },
);
