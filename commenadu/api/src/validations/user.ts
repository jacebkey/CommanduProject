import Joi from "joi";

export const passwordReg = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
const signup = {
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordReg).required(),
    username: Joi.string().required(),
};

export default signup;
