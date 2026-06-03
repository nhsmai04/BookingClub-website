import User from "../models/user.model.js";
import bcrypt from "bcrypt";

const getMeService = async (userId) => {
  const user = await User.findById(userId).select(
    "_id name phone email status role avatar_url date_of_birth "
  );

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

const updateMeService = async (userId, updateData) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error("User not found");
  }
  
  const allowedFields = [
    "name",  
    "avatar_url", 
    "date_of_birth"
  ];

  const updateFields = {};

 allowedFields.forEach((key) => {
    if (updateData[key] !== undefined) {
      user[key] = updateData[key];
      updateFields[key] = updateData[key];
    }
  });
  await user.save();
  return updateFields;
}

const updatePasswordService = async (userId, currentPassword, newPassword, confirmPassword) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new Error("Current password is incorrect");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("New password and confirm password do not match");
  }

  const isSameAsCurrent = await bcrypt.compare(newPassword, user.password);

  if (isSameAsCurrent) {
    throw new Error("New password must be different from current password");
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

}
export { getMeService, updateMeService, updatePasswordService };