export const environment = {
  production: false,
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    accessToken: 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyZTBhZTE3ZWRlY2QwYzRkZGYwZmZmODUyMjRiNWFkNiIsIm5iZiI6MTc4NTM0NDk0OS45Mjk5OTk4LCJzdWIiOiI2YTZhMzNiNTE3NGE3MmYxZWRlYWJiNjMiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.mQYqzpuRF4_3O7wAa-OZeY9tIle21iRIX_QAwsWKSFY',
    apiKey: '2e0ae17edecd0c4ddf0fff85224b5ad6',
  },
} as const;
