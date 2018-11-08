/**
  @param query.defs - defs for query
  @param query.models - models object for query; used to extract defs from
*/
export const extractFullTypeDefsFromQuery = ({ defs, models }) => {
  // extract modelTypeDefs from each model
  const listOfListsOfSchemas = models.map(model => model.getSchema());
  const modelTypeDefs = [].concat(...listOfListsOfSchemas); // merge the lists from the listOfLists

  // merge queryDefs and modelTypeDefs
  const typeDefs = [defs, ...modelTypeDefs];
  return typeDefs;
};

/**
  @param {queries} - list of queries to merge typeDefs for
  @param {queryBaseDef} - a query base definition string, since queries extend the Query object
*/
export const extractTypeDefsFromQueries = ({ queries, queryBaseDef }) => {
  const listOfQueryTypeDefs = queries.map(extractFullTypeDefsFromQuery);
  const queryTypeDefs = [].concat(...listOfQueryTypeDefs);
  const typeDefs = [queryBaseDef, ...queryTypeDefs];
  return typeDefs;
};


/**
  @param query.resolvers - resolvers object for query
  @param query.models - models object for query; used to extract __resolveType resolvers from
*/
export const extractFullResolversFromQuery = ({ resolvers, models }) => {
  // extract resolvers from model (model will return object of its __resolveType and its dependencies __resolveType s)
  const listOfResolveTypeResolvers = models.map(model => model.getResolvers());
  const resolveTypeResolvers = Object.assign(...listOfResolveTypeResolvers);

  // define the full typedefs and resolvers needed here
  const fullResolvers = Object.assign({}, resolveTypeResolvers, resolvers);
  return fullResolvers;
};

/**
  @param {queries} - list of queries to merge resolvers for
*/
export const extractResolversFromQueries = ({ queries }) => {
  const listOfResolversForEachQuery = queries.map(extractFullResolversFromQuery);

  // take special care of the Query resolver, we need to merge each of those from the list created from each query
  const queryChildPartResolvers = listOfResolversForEachQuery.map(resolversForQuery => resolversForQuery.Query);
  const mergedQueryChildPartResolvers = Object.assign({}, ...queryChildPartResolvers);

  // get a list of resolvers that do not include the Query resolver - that way when we finally merge, we wont overwrite the merged Query resolver we took special care to create
  const nonQueryPartResolvers = listOfResolversForEachQuery.map((resolversForQuery) => {
    const resolversWithoutQuery = Object.assign({}, resolversForQuery);
    delete resolversWithoutQuery.Query;
    return resolversWithoutQuery;
  });

  const resolvers = Object.assign({}, ...nonQueryPartResolvers, { Query: mergedQueryChildPartResolvers });
  return resolvers;
};
