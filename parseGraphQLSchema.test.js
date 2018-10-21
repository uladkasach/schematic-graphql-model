import { gql } from 'apollo-server-lambda';
import parseGraphQLSchema from './parseGraphQLSchema';

describe('SchematicModel', () => {
  const schema = gql`
    type CarOfDummies {
      dummies: [Dummy]
      driver: Dummy!
    }

    type Dummy {
      id: String!
      name: String
      age: Int
      height: Float!
      female: Boolean
      favoriteNumbers: [Int]
      luckyNumbers: [Int]!
    }
  `;

  describe('schema parsing', () => {
    describe('basic schema types', () => {
      it('should throw an error if ObjectTypeDefinition is not found for this class.name in schema', () => {
        try {
          parseGraphQLSchema({ schema, modelName: 'Dummy404' });
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
          parseGraphQLSchema({ schema: changedSchema, modelName: 'Dummy' });
          throw new Error('should not reach here');
        } catch (error) {
          expect(error.constructor.name).toEqual('UnknownTypeError');
        }
      });
      it('should be able to interpret a graphql schema', () => {
        const result = parseGraphQLSchema({ schema, modelName: 'Dummy' });
        expect(result).toMatchObject({
          id: { required: true, type: 'String', list: false },
          name: { required: false, type: 'String', list: false },
          age: { required: false, type: 'Int', list: false },
          height: { required: true, type: 'Float', list: false },
          female: { required: false, type: 'Boolean', list: false },
          favoriteNumbers: { required: false, type: 'Int', list: true },
          luckyNumbers: { required: true, type: 'Int', list: true },
        });
      });
      it('should be able to interpret a graphql schema with custom types', () => {
        const result = parseGraphQLSchema({ schema, modelName: 'CarOfDummies', customTypes: { Dummy: true } });
        expect(result).toMatchObject({
          driver: { required: true, type: 'Dummy', custom: true, list: false },
          dummies: { required: false, type: 'Dummy', custom: true, list: true },
        });
      });
    });
  });
});
