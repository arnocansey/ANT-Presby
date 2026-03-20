const express = require('express');
const { apiResponse } = require('../utils/helpers');

const router = express.Router();

router.get('/health', async (req, res, next) => {
  try {
    const prisma = require('../config/prisma');
    await prisma.$queryRaw`SELECT 1`;
    res.json(apiResponse(true, { status: 'ok' }, 'Prisma connection healthy'));
  } catch (error) {
    if (
      error.code === 'MODULE_NOT_FOUND' ||
      error.message === 'Prisma packages not installed. Run npm install in backend.'
    ) {
      return res.status(500).json(
        apiResponse(false, null, 'Prisma packages not installed. Run npm install in backend.')
      );
    }
    next(error);
  }
});

module.exports = router;
