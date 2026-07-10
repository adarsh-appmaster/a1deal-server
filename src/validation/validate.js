// Frontend Joi validation helpers.
//
// These mirror the server-side schemas so forms fail fast with friendly,
// field-level messages before a request is ever sent. The backend still
// re-validates every payload — the client copy is purely for UX.
//
//   const { value, errors } = validateForm(schema, form);
//   if (errors) { setErrors(errors); return; }   // errors is a { field: message } map
//   await api.post('/x', value);                  // value is coerced + cleaned

const JOI_OPTS = {
  abortEarly: false,
  stripUnknown: true,
  convert: true,
};

function toErrorMap(error) {
  const map = {};
  for (const detail of error.details) {
    const key = detail.path.join('.') || '_';
    if (!map[key]) map[key] = detail.message;
  }
  return map;
}

/**
 * Validate a whole form object against a schema.
 * @returns {{ value: object, errors: null | Record<string,string> }}
 */
export function validateForm(schema, data) {
  const { value, error } = schema.validate(data, JOI_OPTS);
  if (error) return { value: data, errors: toErrorMap(error) };
  return { value, errors: null };
}

/**
 * Validate a single field (for onBlur / inline validation).
 * Returns the error message string, or '' when valid.
 */
export function validateField(schema, field, value) {
  const fieldSchema = schema.extract(field);
  const { error } = fieldSchema.validate(value, { convert: true });
  return error ? error.details[0].message : '';
}
