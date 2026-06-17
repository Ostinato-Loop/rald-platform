import { Request, Response, NextFunction } from "express";
import { verifyJwt, type JwtPayload } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      jwtPayload?: JwtPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.jwtPayload = verifyJwt(token);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    req.jwtPayload = verifyJwt(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  if (req.jwtPayload.role !== "admin") {
    res.status(403).json({ error: "Admin privileges required" });
    return;
  }

  next();
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      req.jwtPayload = verifyJwt(authHeader.slice(7));
    } catch {
      // ignore — optional
    }
  }
  next();
}
