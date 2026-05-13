import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmail } from "./auth.repository.js";
import { RegisterInput } from "./auth.types.js";
import { AppError } from "../../utils/appError.js";

type UserRecord = NonNullable<Awaited<ReturnType<typeof findUserByEmail>>>;
type SafeUser = Omit<UserRecord, "password">;

const sanitizeUser = <T extends UserRecord | SafeUser>(user: T): SafeUser => {
  if (!user) {
    throw new Error("User record is missing");
  }

  const safeUser = { ...user } as SafeUser & { password?: unknown };

  delete safeUser.password;

  return safeUser;
};


export const registerUser = async (body: RegisterInput) => {

  const existingUser = await findUserByEmail(body.email);

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(
    body.password,
    10
  );

  const user = await createUser({
    ...body,
    password: hashedPassword,
  });

  return sanitizeUser(user);
};

export const loginUser = async (body: { email: string; password: string }) => {

  const user = await findUserByEmail(body.email);

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    body.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );

  return {
    token,
    user: sanitizeUser(user),
  };
};