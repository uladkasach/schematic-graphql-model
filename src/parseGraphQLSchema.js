import { NonExistantTypeDefinitionError, UnknownTypeError, UnknownKindError } from './errors';
import types from './types';

const validDefTypes = ['ObjectTypeDefinition', 'InterfaceTypeDefinition'];
const parseGraphQLSchema = ({ schema, modelName, customTypes = {} }) => {
  // 1. find the GQL definition for the query of interest
  const definition = schema.definitions.find(def => validDefTypes.includes(def.kind) && def.name.value === modelName);
  if (typeof definition === 'undefined') throw new NonExistantTypeDefinitionError(modelName, schema);
  const modelIsAnInterface = definition.kind === 'InterfaceTypeDefinition';

  // 2. extract and parse each field
  const fields = definition.fields.map((field) => {
    // define name of field
    const name = field.name.value;

    // extract the data stored in the nested types; do so in a loop untill type not longer has a .type
    const nestedData = {
      required: false, // default to false untill found otherwise
      list: false, // default to false untill found otherwise
      type: null, // default to null untill found
    };
    let currentObject = field;
    while (currentObject.type) { // while the current object has a type, parse it
      const thisType = currentObject.type;
      if (thisType.kind === 'ListType') nestedData.list = true;
      if (thisType.kind === 'NonNullType') nestedData.required = true;
      if (thisType.kind === 'NamedType') nestedData.type = thisType.name.value;
      if (!['ListType', 'NonNullType', 'NamedType'].includes(thisType.kind)) throw new UnknownKindError(thisType, field);
      currentObject = thisType; // set the next current object to thisType. This lets us keep getting the type of each type and building a final type object we use
    }
    const { type, list, required } = nestedData; // extract from nested data object;

    // validate the type found
    if (!(type in types) && !(type in customTypes)) {
      throw new UnknownTypeError(type);
    }
    const custom = (type in customTypes); // used to define where to get type validation method

    // if custom, determine whether or not it was an interface object
    const isInterface = (custom) ? customTypes[type].retreiveParsedSchema().self.interface : false;

    // return the results
    return {
      name,
      list,
      type,
      required,
      custom,
      interface: isInterface,
    };
  });

  // 3. cast the fields into a parsed schema object
  const parsedSchema = {};
  fields.forEach((field) => {
    parsedSchema[field.name] = field;
  });

  // return the schema
  return { fields: parsedSchema, self: { interface: modelIsAnInterface } };
};


export default parseGraphQLSchema;