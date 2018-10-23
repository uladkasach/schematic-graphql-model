import types from './types';

// TODO - consider creating cache to reuse existing functinos when same key is requeted, to preserve memory

export const determineValidationForField = (field, customTypes) => {
  /**
    determine typeValidation
    - considers field.custom (if custom, we need to use the validation of the customType model)
    - considers field.interface (if interface, we need to see which implementation of it to use)
  */
  let typeValidation;
  if (field.interface) { // if it is an implementation field, we must ask the customType to see which implementation model is the TargetDependency
    const TargetDependency = customTypes[field.type];
    typeValidation = (props) => {
      const TargetImplementation = TargetDependency.findImplementationFor(props); // find the target impelementation for these props (e.g., by type key); user must define this method
      return TargetImplementation.validate(props, true); // validate the props based on the target implementation
    };
  } else if (field.custom) { // if its a custom field, we must check the .validate static method of the dependent SchematicModel
    const TargetDependency = customTypes[field.type];
    typeValidation = props => TargetDependency.validate(props, true);
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
        const errorsForType = typeValidation(val, true);
        const errorsExist = (Array.isArray(errorsForType)) // schematicModels give objects of errors (key per prop); basic types give an array of errors
          ? errorsForType.length !== 0
          : Object.keys(errorsForType).length !== 0;
        if (errorsExist) errors.push({ value: val, errors: errorsForType });
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
