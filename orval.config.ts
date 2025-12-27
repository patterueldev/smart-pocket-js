module.exports = {
  smartPocketApi: {
    input: './docs/api-spec.yaml',
    output: {
      target: './apps/mobile/src/api/generated.ts',
      client: 'fetch',
      override: {
        mutator: {
          path: './apps/mobile/src/api/httpClient.ts',
          name: 'httpClient',
        },
      },
    },
  },
};
