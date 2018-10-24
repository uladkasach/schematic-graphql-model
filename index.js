import parseGraphQLSchema from './parseGraphQLSchema';
import addValidationToSchema from './addValidationToSchema';
import { ValidityError, MissingMethodError, ResolveTypeMissingError } from './errors';

// used to wrap props as schematic models, when there is a target model

const castValueToSchematicModel = (props, TargetModel) => {
  const ImplementationTargetModel = (TargetModel.retreiveParsedSchema().self.interface) // handle casting to implementations
    ? TargetModel.findImplementationFor(props) // if target is an interface, let it pick the implementation
    : TargetModel; // if target is not an interface, then there are no implementations to wory about
  return new ImplementationTargetModel(props);
};
const castValuesToSchematicModels = (value, TargetModel) => ((Array.isArray(value)) // if value is an array,
  ? value.map(val => castValueToSchematicModel(val, TargetModel)) //  parse each object of array
  : castValueToSchematicModel(value, TargetModel)); // else just parse the object

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
    const { fields, dependencies } = this.constructor.retreiveParsedSchema();
    const fieldKeys = Object.keys(fields);
    fieldKeys.forEach((key) => {
      const fieldSchema = fields[key];
      const value = props[key];
      const TargetModel = (fieldSchema.custom) ? dependencies[fieldSchema.type] : null;
      const parsedValue = (TargetModel) ? castValuesToSchematicModels(value, TargetModel) : value;
      this[key] = parsedValue;
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
    - caches the schema results
  */
  static retreiveParsedSchema() {
    const { name, schema, dependencies } = this; // extract form the class static properties
    if (!this.constructor.parsedSchema) { // if parsed schema is not defined, define it for the constructor
      // 1. retreive the parsed schema
      const customTypes = {}; // object to build into
      if (dependencies) dependencies.forEach((dep) => { customTypes[dep.name] = dep; }); // take each dependency and put it in customTypes obj for lookups
      const { fields, self } = parseGraphQLSchema({ schema, modelName: name, customTypes });

      // 1.2 this model is an interface, check to make sure that the method .findImplementationFor has been defined on the class
      if (self.interface && typeof this.resolveType !== 'function') throw new MissingMethodError('resolveType', 'is an interface type');

      // 2. attach validation methods to each field
      const fieldsWithValidation = addValidationToSchema({ schema: fields, customTypes });

      // 3. append parsedSchema to the class, to cache these computations
      this.parsedSchema = {
        fields: fieldsWithValidation,
        self,
        dependencies: customTypes,
      };
    }
    return this.parsedSchema;
  }

  /**
    @method getSchema
    @returns list of schemas: one schema from self and all from each dependency
  */
  static getSchema() {
    const schemas = [];

    // push own schema to schemas
    const ownSchema = this.schema;
    schemas.push(ownSchema);

    // add all schemas from dependencies to schemas
    const deps = this.dependencies || [];
    deps.forEach((dep) => {
      const listOfSchema = dep.getSchema();
      schemas.push(...listOfSchema); // extend the schemas array
    });

    // return all schemas
    return schemas;
  }

  /**
    @method getResolvers
    @returns object of resolvers, with potentially one from each dependency
    - PURPOSE: to enable the SchematicModel to autogenerate the __resolveType resolver
  */
  static getResolvers() {
    let resolvers = {};

    // add own resolver to object, if needed
    const { self } = this.retreiveParsedSchema();
    if (self.interface) { // if this model is an interface
      const resolveTypeMethod = this.resolveType;
      resolvers[this.name] = { // add the Model.__resolveType method to resolvers
        __resolveType: resolveTypeMethod,
      };
    }

    // add all resolvers from dependencies
    const deps = this.dependencies || [];
    deps.forEach((dep) => {
      const thisResolversObject = dep.getResolvers();
      resolvers = Object.assign(resolvers, thisResolversObject); // add the resolvers from dependency objects
    });

    // return all resolvers
    return resolvers;
  }

  /**
    @method findImplementationFor
    @returns { SchematicModel } - a schematic model of the implemented type
    NOTE: only relevant to interface type models
    Uses the resolveType method to determine name of implementation to resolve to, returns the model with that name from dependencies
  */
  static findImplementationFor(props) {
    const { dependencies } = this.retreiveParsedSchema();
    const modelName = this.resolveType(props); // note, retreiveParsedSchema checks that resolveType is defined
    const ImplementationModel = dependencies[modelName];
    if (!ImplementationModel) throw new ResolveTypeMissingError(modelName, this.name);
    return ImplementationModel;
  }
}
