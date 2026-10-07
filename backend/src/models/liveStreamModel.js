const prisma = require('../config/prisma');
const { youtubeEmbedUrl } = require('../utils/liveLinks');

/**
 * Livestream Model - the single live_stream row (id 1) and its public shape.
 */

const LIVE_ID = 1;

const getLiveStream = () => prisma.liveStream.findUnique({ where: { id: LIVE_ID } });

// Go live, or update the links while live. The row is created if missing, then locked
// (SELECT ... FOR UPDATE), so concurrent calls run one at a time and exactly one of them
// sees the change from not-live to live. The caller notifies only when becameLive is true.
const startLive = ({ title, youtubeUrl, facebookUrl, userId }) =>
  prisma.$transaction(async (tx) => {
    await tx.$executeRaw`INSERT INTO live_stream (id, is_live, updated_at) VALUES (1, false, ${new Date()}) ON CONFLICT (id) DO NOTHING`;
    const [current] = await tx.$queryRaw`SELECT is_live FROM live_stream WHERE id = 1 FOR UPDATE`;
    const becameLive = !(current && current.is_live);

    const stream = await tx.liveStream.update({
      where: { id: LIVE_ID },
      data: {
        isLive: true,
        title,
        youtubeUrl,
        facebookUrl,
        updatedBy: userId,
        ...(becameLive ? { startedAt: new Date(), endedAt: null } : {}),
      },
    });

    return { stream, becameLive };
  });

// Safe to repeat: only a live row changes, so a second End keeps the first end time.
const endLive = async ({ userId }) => {
  const result = await prisma.liveStream.updateMany({
    where: { id: LIVE_ID, isLive: true },
    data: { isLive: false, endedAt: new Date(), updatedBy: userId },
  });
  const stream = await getLiveStream();
  return { stream, wasLive: result.count > 0 };
};

// Public shape. Only is_live is shown when not live, so no client can show a stale stream.
const toLiveState = (row) => {
  const live = Boolean(row && row.isLive);
  return {
    is_live: live,
    title: live ? row.title ?? null : null,
    youtube_url: live ? row.youtubeUrl ?? null : null,
    facebook_url: live ? row.facebookUrl ?? null : null,
    youtube_embed_url: live ? youtubeEmbedUrl(row.youtubeUrl) : null,
    started_at: live ? row.startedAt ?? null : null,
  };
};

module.exports = {
  getLiveStream,
  startLive,
  endLive,
  toLiveState,
};
