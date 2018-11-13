/**
  @param query.defs - defs for query
  @param query.models - models object for query; used to extract defs from
*/
const extractFullTypeDefsFromQueryOrMutation = ({ defs, models }) => {
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
const extractTypeDefsFromQueriesOrMutations = ({ data, baseDef }) => {
  const listOfTypeDefs = data.map(extractFullTypeDefsFromQueryOrMutation);
  const typeDefsWithoutBase = [].concat(...listOfTypeDefs);
  const typeDefs = [baseDef, ...typeDefsWithoutBase];
  return typeDefs;
};
export const extractTypeDefsFromQueries = ({ queries, queryBaseDef }) => extractTypeDefsFromQueriesOrMutations({ data: queries, baseDef: queryBaseDef }); // just forward the functionality
export const extractTypeDefsFromMutations = ({ mutations, mutationBaseDef }) => extractTypeDefsFromQueriesOrMutations({ data: mutations, baseDef: mutationBaseDef }); // just forward the functionality


/**
  @param query.resolvers - resolvers object for query or mutation
  @param query.models - models object for query or mutation; used to extract __resolveType resolvers from
*/
const extractFullResolversFromQueryOrMutation = ({ resolvers, models }) => {
  // extract resolvers from model (model will return object of its __resolveType and its dependencies __resolveType s)
  const listOfResolveTypeResolvers = models.map(model => model.getResolvers());
  const resolveTypeResolvers = Object.assign(...listOfResolveTypeResolvers);

  // define the full typedefs and resolvers needed here
  const fullResolvers = Object.assign({}, resolveTypeResolvers, resolvers);
  return fullResolvers;
};

/**
  @param {enum('Mutation', 'Query')} actionClass - which type to extract resolvers for
  @param data - what data to extract the resolvers for
*/
const extractResolversFromActionClass = ({ actionClass, data }) => {
  // validate action class
  if (!['Mutation', 'Query'].includes(actionClass)) throw new Error('actionClass must be Mutation or Query');

  const listOfResolversForEachObject = data.map(extractFullResolversFromQueryOrMutation);

  // take special care of the Muataion resolver, we need to merge each of those from the list created from each query
  const childPartResolvers = listOfResolversForEachObject.map(resolversForObject => resolversForObject[actionClass]);
  const mergedChildPartResolvers = Object.assign({}, ...childPartResolvers);

  // get a list of resolvers that do not include the Query resolver - that way when we finally merge, we wont overwrite the merged Query resolver we took special care to create
  const nonActionClassPartResolvers = listOfResolversForEachObject.map((resolversForQuery) => {
    const resolversWithoutActionClass = Object.assign({}, resolversForQuery);
    delete resolversWithoutActionClass[actionClass];
    return resolversWithoutActionClass;
  });

  const resolvers = Object.assign({}, ...nonActionClassPartResolvers, { [actionClass]: mergedChildPartResolvers });
  return resolvers;
};
export const extractResolversFromQueries = ({ queries }) => extractResolversFromActionClass({ actionClass: 'Query', data: queries });
export const extractResolversFromMutations = ({ mutations }) => extractResolversFromActionClass({ actionClass: 'Mutation', data: mutations });
