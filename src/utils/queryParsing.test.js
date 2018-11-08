// TODO - fix these tests by adding good, publicizable data models

import { extractResolversFromQueries } from './queryParsing';

describe('extractResolversFromQueries', () => {
  it.skip('should be able to create one resolver object from all query models and the query itself- one query', () => {
    const resolvers = extractResolversFromQueries({ queries: [ideaQuery] });
    expect(resolvers).toHaveProperty('Constraint');
    expect(resolvers.Query).toHaveProperty('ideas');
  });
  it.skip('should be able to create one resolver object from all query models and the query itself -  two queries', () => {
    const resolvers = extractResolversFromQueries({ queries: [ideaQuery, thingToDoQuery] });
    expect(resolvers).toHaveProperty('Constraint');
    expect(resolvers.Query).toHaveProperty('ideas');
    expect(resolvers.Query).toHaveProperty('thingsToDo');
  });
});
