import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.log(err);

  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });
  } else if (err instanceof UnauthorizedError) {
    res.status(401).json({ error: err.message });
  } else if (err instanceof ForbiddenError) {
    res.status(403).json({ error: err.message });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
  } else {
    res.status(500).send({ error: "Internal Server Error" });
  }
}

// 400
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// 401
class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// 403
class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
  }
}

// 404
class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
  }
}
