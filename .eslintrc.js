module.exports = {
  'extends': 'airbnb-base',
  'rules': {
    'max-len': ["warn", 140, { ignoreTrailingComments: true, ignoreComments: true }],
    'object-curly-newline': "off",
  },
  'plugins': [
    'graphql',
  ],
  "env" : {
    "jest": true
  }
};
