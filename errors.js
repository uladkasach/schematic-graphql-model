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
class UnknownKindError extends Error {
  constructor(type, field) {
    const message = `Unknown field[(.type)+].kind: ${type.kind}. SchematicModel is not aware of this GQL type.kind definition.`;
    super(message);

    this.kind = type.kind;
    this.type = type;
    this.field = field;
  }
}
class ValidityError extends Error {
  constructor(errors, props, model) {
    const message = `Errors on ${Object.keys(errors).length} properties were found while validating properties for model ${model}.`;
    super(message);

    this.errors = errors;
    this.props = props;
    this.modelName = model;
  }
}


export {
  NonExistantTypeDefinitionError,
  UnknownTypeError,
  UnknownKindError,
  ValidityError,
};
