/** `envFile`'s production block repeats the staging values on purpose: the `:s` range exercise fixes them. */

export const routeTable = [
  'GET    /health          health.check',
  'GET    /sessions        sessions.list',
  'POST   /sessions        sessions.create',
  'DELETE /sessions/:id    sessions.destroy',
  'GET    /users           users.list      TODO',
  'POST   /users           users.create    TODO',
].join('\n');

export const envFile = [
  '# staging',
  'url: api.staging.local',
  'key: staging-key',
  '# production',
  'url: api.staging.local',
  'key: staging-key',
].join('\n');
