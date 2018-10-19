import { NonExistantTypeDefinitionError, UnknownTypeError } from './errors';
import types from './types';

const parseGraphQLSchema = (schema, modelName) => {
  // 1. find the GQL definition for the query of interest
  const definition = schema.definitions.find(def => def.kind === 'ObjectTypeDefinition' && def.name.value === modelName);
  if (typeof definition === 'undefined') throw new NonExistantTypeDefinitionError(modelName, schema);

  // 2. extract and parse each field
  const fields = definition.fields.map((field) => {
    const name = field.name.value;
    const required = field.type.kind === 'NonNullType';
    const type = (required) // if the field is required, the type def will be nested further
      ? field.type.type.name.value
      : field.type.name.value;
    if (!(type in types)) throw new UnknownTypeError(type);
    const { validation } = types[type];
    return {
      name,
      type,
      required,
      validation,
    };
  });

  // 3. cast the fields into a parsed schema object
  const parsedSchema = {};
  fields.forEach((field) => {
    parsedSchema[field.name] = field;
  });

  // return the schema
  return parsedSchema;
};


export default parseGraphQLSchema;
