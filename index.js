import parseGraphQLSchema from './parseGraphQLSchema';
import addValidationToSchema from './addValidationToSchema';
import { ValidityError, MissingMethodError } from './errors';

/**
  @class SchematicModel
  - provides schema validation of objects built, based on graphql schema provided
    - e.g., checks and validates the types of params that will be passed to graphql
  - enables confident usage of default resolvers
    - since we checked that the types are properly formatted and validated to match the schema, we are confident that there will be no problems
  @param { obj } schema: graphql schema object from which the type definitions for this model will be found
  @param { string } name: the name of the model in the graphql schema
  @param { [SchematicModel] } dependencies: a list of models that this model is dependent on
*/
export default class SchematicModel {
  constructor(props = {}) {
    // validate the props
    const errors = this.constructor.validate(props, true);
    if (Object.keys(errors).length !== 0) throw new ValidityError(errors, props, this.constructor.name);

    // assign model props to self
    const { fields } = this.constructor.retreiveParsedSchema();
    const fieldKeys = Object.keys(fields);
    fieldKeys.forEach((key) => {
      this[key] = props[key];
    });
  }

  /**
    -- base methods --------------------------------------------
  */
  static validate(props, verbose) {
    // retreive schema and keys to validate
    const { fields } = this.retreiveParsedSchema();
    const fieldKeys = Object.keys(fields);

    // conduct validation on each key, keep the array of errors found
    const errors = {};
    fieldKeys.forEach((key) => {
      const fieldSchema = fields[key];
      const value = props[key];
      const validityErrors = fieldSchema.validation(value, true);
      if (validityErrors.length > 0) errors[key] = validityErrors; // if errors are found, record them
    });

    // determine validity overall; if no errors at all - return true. if errors, return false; or return errors if verbose
    if (verbose) return errors;
    return (Object.keys(errors).length === 0);
  }

  /**
    convert the graphql schema into a more interpretable and actionable (and validated) schema object
  */
  static retreiveParsedSchema() {
    const { name, schema, dependencies } = this; // extract form the class static properties
    if (!this.constructor.parsedSchema) { // if parsed schema is not defined, define it for the constructor
      // 1. retreive the parsed schema
      const customTypes = {}; // object to build into
      if (dependencies) dependencies.forEach((dep) => { customTypes[dep.name] = dep; }); // take each dependency and put it in customTypes obj for lookups
      const { fields, self } = parseGraphQLSchema({ schema, modelName: name, customTypes });

      // 1.2 this model is an interface, check to make sure that the method .findImplementaionFor has been defined on the class
      if (self.interface && typeof this.findImplementaionFor !== 'function') throw new MissingMethodError('findImplementaionFor', 'is an interface type');

      // 2. attach validation methods to each field
      const fieldsWithValidation = addValidationToSchema({ schema: fields, customTypes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = {
        fields: fieldsWithValidation,
        self,
      };
    }
    return this.parsedSchema;
  }
}
