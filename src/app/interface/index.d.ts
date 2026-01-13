import { JwtPayload } from "jsonwebtoken";
// import { email } from "zod";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { id: string; phone: string; role: string };
    }
  }
}