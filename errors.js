class NonExistantTypeDefinitionError extends Error {
  constructor(name, schema) {
    const message = `Could not find ObjectTypeDefinition for ${name} in schema. Error.`;
    super(message);

    this.name = name;
    this.schema = schema;
  }
}
class UnknownTypeError extends Error {
  constructor(type) {
    const message = `Unknown type: ${type}. SchematicModel is not aware of this GQL type definition.`;
    super(message);

    this.type = type;
  }
}

export {
  NonExistantTypeDefinitionError,
  UnknownTypeError,
};
