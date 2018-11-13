import SchematicModel from './model';
import {
  extractTypeDefsFromQueries,
  extractResolversFromQueries,
  extractTypeDefsFromMutations,
  extractResolversFromMutations,
} from './utils/queryParsing';

export default SchematicModel; // import SchematicModel from 'schematic-graphql-model'
export {
  extractTypeDefsFromQueries, // import { extractTypeDefsFromQueries } from 'schematic-graphql-model'
  extractResolversFromQueries, // import { extractResolversFromQueries } from 'schematic-graphql-model'
  extractTypeDefsFromMutations, // import { extractTypeDefsFromMutations } from 'schematic-graphql-model'
  extractResolversFromMutations, // import { extractResolversFromMutations } from 'schematic-graphql-model'
};
