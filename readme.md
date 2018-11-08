# Schematic Model
Schematic model takes graphql schema as an input and provides schematic object validation and simpler schema composition out of the box.

This enables the user to confidently use graphql default resolvers - guaranteeing that each model object has already been validated and will not result in errors. It also provides a way to add custom error checking to models without having to create custom resolvers.

This also enables the user to easily compose schemas.

# Examples

1. define your model
    ```js
    // idea.js
    import { gql } from 'apollo-server-lambda';
    import SchematicModel from 'schematic-graphql-model';
    import Image from './image';

    const schema = `
      type Idea {
        id: String!
        title: String!
        description: String!
        images: [Image]
      }
    `;

    export default class Idea extends SchematicModel {}
    Idea.schema = gql(schema);
    Idea.dependencies = [Image];
    ```

2. define your query
    ```js
    import Idea from '../models/idea';
    import sampleIdeas from '../dummyData/ideas';

    /**
      define the typedefs for the query
    */
    const defs = `
      extend type Query {
        idea(id: ID): Idea
        ideas: [Idea]
      }
    `;

    /**
      define the resolvers
      - use the Idea model to validate the data we are passing to gql
      - TODO: use real data
    */
    const sampleIdeasParsed = sampleIdeas.map(ideaData => new Idea(ideaData));
    const resolvers = {
      Query: {
        ideas: () => sampleIdeasParsed,
      },
    };

    /*
      export the results
    */
    const models = [Idea];
    export default {
      models,
      defs,
      resolvers,
    };
    ```

3. compose your queries and models into executable schema
    ```js
    import { extractTypeDefsFromQueries, extractResolversFromQueries } from 'schematic-graphql-model';
    /**
      schema combines the querySchema, queryResolvers, and models from each query - and makes a full makeExecutableSchema
    */

    // import schema dependencies
    import queryBaseDef from './queries/_base'; // define a query base since we define the queries as type extension
    import ideaQuery from './queries/idea';
    import thingToDoQuery from './queries/thingToDo';

    // extract and export typeDefs and resolvers from queries
    const queries = [ideaQuery, thingToDoQuery];
    export const typeDefs = extractTypeDefsFromQueries({ queries, queryBaseDef });
    export const resolvers = extractResolversFromQueries({ queries });
    ```

4. use the schema
  ```js
    import { ApolloServer } from 'apollo-server-lambda';
    import { typeDefs, resolvers } from './graphql/schema';

    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: ({ event, context }) => ({ // pass lambda context
        headers: event.headers,
        functionName: context.functionName,
        event,
        context,
      }),
    });

    const handler = server.createHandler({
      cors: {
        origin: '*',
        credentials: true,
      },
    });

    export {
      handler,
      server,
    };
  ```
