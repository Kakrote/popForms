import bcrypt from "bcrypt";
import { findUserByEmail, createUser } from "../modules/auth/auth.repository.js";
import logger from "./logger.js";

export const seedAdmin = async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME ?? "admin";

  if (!email || !password) {
    logger.info("ADMIN_EMAIL or ADMIN_PASSWORD not set; skipping admin seed.");
    return;
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      logger.info(`Admin user already exists: ${email}`);
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await createUser({
      username,
      email,
      password: hashed,
      role: "ADMIN",
    });

    logger.info(`Pre-registered admin created: ${email}`);
  } catch (err) {
    logger.error("Failed to seed admin", err);
    throw err;
  }
};

export default seedAdmin;
