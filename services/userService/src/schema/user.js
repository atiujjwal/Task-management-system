const Joi = require("joi");

const registerUserSchema = Joi.object({
  first_name: Joi.string().alphanum().max(20).required(),
  middle_name: Joi.string().alphanum().max(20)
  // .default('')
  ,
  last_name: Joi.when('middle_name', {
    is: Joi.string().alphanum().min(1),
    then: Joi.string().alphanum().max(20).required(),
    otherwise: Joi.string().alphanum().max(20)
    // .default('')
  }),
  email: Joi.string().email().required(),
  mobile: Joi.string().required(),
  password: Joi.string().required(),
  dob: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
    .required()
    .custom((value, helpers) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return helpers.message("Invalid date.");
      }
      if (date > new Date()) {
        return helpers.message("DOB must be in the past.");
      }
      return value;
    }),
});

const loginUserSchema = Joi.object({
  email: Joi.string().email(),
  mobile: Joi.string(),
  password: Joi.string().required(),
}).xor("email", "mobile");

exports.validateRegisterUserData = (data) => {
  return registerUserSchema.validate(data, { abortEarly: true });
};

exports.validateLoginUserData = (data) => {
  return loginUserSchema.validate(data, { abortEarly: true });
}
