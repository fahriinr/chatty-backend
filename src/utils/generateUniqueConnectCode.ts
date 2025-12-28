import { customAlphabet } from "nanoid";
import User from "../models/User";
import { Types } from "mongoose";

const generateCode = customAlphabet("0123456789", 6);

const generateUniqueConnectCode = async () => {
  let code: string;
  let exists: { _id: Types.ObjectId } | null;

  do {
    code = generateCode();
    exists = await User.exists({ connectCode: code });
  } while (exists);

  return code;
};

export default generateUniqueConnectCode;
