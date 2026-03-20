let prisma;

const buildPrismaUrl = () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || !/^postgres(ql)?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const url = new URL(rawUrl);
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT || '15');
  }
  if (!url.searchParams.has('pool_timeout')) {
    url.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT || '30');
  }

  return url.toString();
};

const createPrismaClient = () => {
  try {
    // eslint-disable-next-line global-require
    const { PrismaClient } = require('@prisma/client');
    const databaseUrl = buildPrismaUrl();

    return new PrismaClient({
      ...(databaseUrl
        ? {
            datasources: {
              db: {
                url: databaseUrl,
              },
            },
          }
        : {}),
    });
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      return new Proxy(
        {},
        {
          get() {
            throw new Error('Prisma packages not installed. Run npm install in backend.');
          },
        }
      );
    }

    throw error;
  }
};

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

module.exports = prisma;
