import response from "../utils/response.js";

export const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const format = result.error.flatten();
      const errors =
        Object.keys(format.formErrors).length > 0
          ? format.formErrors
          : format.fieldErrors;
      return response(res, 400, errors);
    }

    req.body = result.data;
    return next();
  };
};
