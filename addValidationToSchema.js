import types from './types';

// TODO - consider creating cache to reuse existing functinos when same key is requeted, to preserve memory

export const determineValidationForField = (field, customTypes) => {
  /**
    determine typeValidation
    - only considers field.custom
  */
  let typeValidation;
  if (field.custom) { // if its a custom field, we must check the .validate static method of the dependent SchematicModel
    const TargetDependency = customTypes[field.type];
    typeValidation = props => TargetDependency.validate(props);
  } else { // if its not a custom field, then we just use the .validation method of the known GQL type
    typeValidation = types[field.type].validation;
  }

  /**
    determine field validation
    - considers field.required and field.list
  */
  const fieldValidation = (value, verbose) => {
    // begin tracking errors
    const errors = [];

    // find any possible errors
    if (typeof value === 'undefined' || value === null) { // if not defined, then we must determine if it was required
      if (field.required) errors.push('field is required'); // not defined and required, return false
    } else { // if defined, we must validate the type passed
      // determine validity based on whether value is an array or not
      if (field.list && !Array.isArray(value)) errors.push('value must be an array for field');

      // determine validity based on type of result
      const values = (Array.isArray(value)) ? value : [value]; // cast nonList types to list, for a standard way of validating values
      values.forEach((val) => {
        const validForType = typeValidation(val);
        if (!validForType) errors.push([val, field]);
      });
    }

    // return either errors or boolean, based on verbose flag
    if (verbose) return errors;
    return errors.length === 0; // return a boolean
  };

  // return fieldValidation
  return fieldValidation;
};


export default ({ schema, customTypes }) => {
  const schemaWithValidation = {}; // empty object to add to, by field key
  const fieldKeys = Object.keys(schema);
  fieldKeys.forEach((key) => {
    const field = schema[key];
    const validation = determineValidationForField(field, customTypes);
    const fieldWithValidation = Object.assign({}, field, { validation });
    schemaWithValidation[key] = fieldWithValidation;
  });
  return schemaWithValidation;
};
