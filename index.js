import types from './types';
import parseGraphQLSchema from './parseGraphQLSchema';

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
  constructor(params) {
    // convert the graphql schema into a more interpretable and actionable (and validated) schema object
    const parsedSchema = this.retreiveParsedSchema();
    console.log(parsedSchema);
    return;

    // assert all required keys are defined
    const requiredKeys = keys.filter(key => schema.columns[key].required);
    requiredKeys.forEach((key) => {
      if (!params[key]) throw new Error(`${key} must be defined`);
    });

    // assert each key is validated
    keys.forEach((keys) => {
      // do nothing for now.
    });

    // append value to object for each column
    keys.forEach((key) => {
      const value = params[key];
      this[key] = value;
    });
  }

  /**
    -- helpers and convinience --------------------------------------------
  */
  // generates a value object consisting of the values of the database colums defined
  get values() {
    const values = {};
    const keys = Object.keys(this.constructor.modelConfig.columns);
    keys.forEach((key) => {
      values[key] = this[key];
    });
    return values;
  }


  /**
    -- base methods --------------------------------------------
  */
  static retreiveParsedSchema() {
    const { name, schema, dependencies } = this; // extract form the class static properties
    if (!this.constructor.parsedSchema) { // if parsed schema is not defined, define it for the constructor
      // 1. retreive the parsed schema
      const customTypes = {}; // object to build into
      if (dependencies) dependencies.forEach((dep) => { customTypes[dep.constructor.name] = dep; }); // take each dependency and put it in customTypes obj for lookups
      const parsedSchema = parseGraphQLSchema({ schema, modelName: name, customTypes });

      // 2. attach validation methods to each field

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = parsedSchema;
    }
    return this.parsedSchema;
  }
}
