import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export type CurrentUserPayload = {
  sub: string;
  email: string;
  role: string;
  warehouseIds: string[];
  siteIds: string[];
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
