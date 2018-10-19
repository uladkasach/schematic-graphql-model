import { gql } from 'apollo-server-lambda';
import getParsedSchema from './getParsedSchema';
import types from './types';

describe('SchematicModel', () => {
  const schema = gql`
    type Dummy {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
    }
  `;


  describe('schema parsing', () => {
    it('should throw an error if ObjectTypeDefinition is not found for this class.name in schema', () => {
      try {
        getParsedSchema(schema, 'Dummy404');
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('NonExistantTypeDefinitionError');
      }
    });
    it('should throw an error if ObjectTypeDefinition has an unknown type in the schema', () => {
      const changedSchema = JSON.parse(JSON.stringify(schema));
      const relevantDef = changedSchema.definitions.find(def => def.kind === 'ObjectTypeDefinition' && def.name.value === 'Dummy');
      relevantDef.fields[1].type.name.value = 'Bob';
      try {
        getParsedSchema(changedSchema, 'Dummy');
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.constructor.name).toEqual('UnknownTypeError');
      }
    });
    it('should be able to interpret a graphql schema', () => {
      /*
      [ { name: 'id',
             type: 'String',
             required: true,
             validation: [Function: validation] },
           { name: 'name',
             type: 'String',
             required: false,
             validation: [Function: validation] },
           { name: 'age',
             type: 'Int',
             required: false,
             validation: [Function: validation] },
           { name: 'height',
             type: 'Float',
             required: true,
             validation: [Function: validation] },
           { name: 'female',
             type: 'Boolean',
             required: false,
             validation: [Function: validation] } ]

      */
      const result = getParsedSchema(schema, 'Dummy');
      expect(result).toMatchObject({
        id: { required: true, type: 'String', validation: types.String.validation },
      });
    });
  });
});
