import bcrypt from "bcryptjs";
const passwordCompare = async (
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(plainTextPassword, hashedPassword);
};
export default passwordCompare;
