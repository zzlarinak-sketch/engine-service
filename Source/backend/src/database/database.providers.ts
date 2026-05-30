import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

export const databaseProviders = [
  {
    provide: PG_POOL,
    useFactory: () => {
      return new Pool({
        host: 'localhost',
        port: 5432,
        database: 'engine_service_db',
        user: 'arinazozulya',
      });
    },
  },
];
