import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 does not forward rejected promises to the error handler; this
// wrapper does. Generic over the request type so authed handlers keep typing.
export function asyncHandler<R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req as R, res, next).catch(next);
  };
}
