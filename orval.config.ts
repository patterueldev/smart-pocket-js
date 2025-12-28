module.exports = {
  smartPocketApi: {
    input: './docs/api-spec.yaml',
    output: {
      target: './apps/mobile/api/generated.ts',
      client: 'fetch',
      override: {
        mutator: {
          path: './apps/mobile/api/httpClient.ts',
          name: 'httpClient',
        },
      },
    },
  },
};
