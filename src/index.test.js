import { gql } from 'apollo-server-lambda';
import SchematicGraphQLModel from './index';

// TODO: move these out into "Acceptance Tests"

describe('use cases', () => {
  describe('different model name from gql type name', () => {
    it('should be possible to define a model with a name different from the GQL Type name defined in schema for it', () => {
      const schema = gql`
        type Dummy {
          id: String!
          name: String
          age: Int
          height: Float!
          female: Boolean
        }
      `;
      class GraphQLDummy extends SchematicGraphQLModel {}
      GraphQLDummy.schema = schema;
      GraphQLDummy.gqlTypeName = 'Dummy';
      const dummy = new GraphQLDummy({ id: '123', height: 12 });
      expect(dummy).toMatchObject({ id: '123', height: 12 });
    });
    it('should be possible to use a model with a different name from the GQL Type name defined in the schema as a dependency', () => {
      const schema = gql`
        type Dummy {
          id: String!
          name: String
          age: Int
          height: Float!
          female: Boolean
        }
        type CarOfDummies {
          dummies: [Dummy]
          driver: Dummy!
        }
      `;
      class GraphQLDummy extends SchematicGraphQLModel {}
      GraphQLDummy.schema = schema;
      GraphQLDummy.gqlTypeName = 'Dummy';
      class CarOfDummies extends SchematicGraphQLModel {}
      CarOfDummies.dependencies = [GraphQLDummy];
      CarOfDummies.schema = schema;
      const { fields } = CarOfDummies.retreiveParsedSchema();
      expect(fields).toMatchObject({
        driver: { required: true, type: 'Dummy', custom: true, list: false },
        dummies: { required: false, type: 'Dummy', custom: true, list: true },
      });
    });
  });
  describe('insantiating required fields as undefined when resolvers exist', () => {
    it('should be possible to instantiable a required field with null or undefined as long as there is a resolver', () => {
      const schema = gql`
        type Dummy {
          id: String!
          name: String
          age: Int
          height: Float!
          female: Boolean
        }
      `;
      class Dummy extends SchematicGraphQLModel {}
      Dummy.schema = schema;
      Dummy.resolvers = {
        height: () => 12,
      };
      const dummy = new Dummy({ id: '123' });
      expect(dummy).toMatchObject({ id: '123', height: undefined });
    });
  });
});
