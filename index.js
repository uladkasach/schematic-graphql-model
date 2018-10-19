import types from './types';



/**
  @class SchematicModel
  - provides requried / non required properties
  - provides property validation
*/
export default class SchematicModel {
  constructor(params) {
    // define keys and config
    const schema = this.getParsedSchema();
    return;
    const keys = Object.keys(schema.columns);

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
  getParsedSchema() {
    if (!this.constructor.parsedSchema) {
      const parsedSchema = parseGraphQLSchema(this.constructor.schema);
      this.constructor.parsedSchema = parsedSchema;
    }
    return this.constructor.parsedSchema;
  }
}
