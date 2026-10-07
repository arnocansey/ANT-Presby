// In-memory stand-in for the single live_stream row, for model and API tests.
// $transaction callbacks run one at a time (as the row lock makes them in Postgres);
// every operation yields first, so any read done outside the transaction can interleave.
const tick = () => new Promise((resolve) => setImmediate(resolve));

const emptyRow = () => ({
  id: 1,
  isLive: false,
  title: null,
  youtubeUrl: null,
  facebookUrl: null,
  startedAt: null,
  endedAt: null,
  updatedBy: null,
  updatedAt: new Date(),
});

const createFakeLivePrisma = (initialRow = null) => {
  const state = { row: initialRow ? { ...emptyRow(), ...initialRow } : null, sql: [] };
  const sqlText = (strings) => strings.join('?');
  let queue = Promise.resolve();

  const tx = {
    $executeRaw: jest.fn(async (strings) => {
      await tick();
      state.sql.push(sqlText(strings));
      if (!state.row) state.row = emptyRow();
      return 1;
    }),
    $queryRaw: jest.fn(async (strings) => {
      await tick();
      state.sql.push(sqlText(strings));
      return state.row ? [{ is_live: state.row.isLive }] : [];
    }),
    liveStream: {
      update: jest.fn(async ({ data }) => {
        await tick();
        state.row = { ...state.row, ...data, updatedAt: new Date() };
        return { ...state.row };
      }),
    },
  };

  const prisma = {
    $transaction: jest.fn((callback) => {
      const run = queue.then(() => callback(tx));
      queue = run.catch(() => {});
      return run;
    }),
    liveStream: {
      findUnique: jest.fn(async () => {
        await tick();
        return state.row ? { ...state.row } : null;
      }),
      updateMany: jest.fn(async ({ where, data }) => {
        await tick();
        if (!state.row || (where.isLive !== undefined && state.row.isLive !== where.isLive)) {
          return { count: 0 };
        }
        state.row = { ...state.row, ...data, updatedAt: new Date() };
        return { count: 1 };
      }),
    },
  };

  return { prisma, tx, state };
};

module.exports = { createFakeLivePrisma };
