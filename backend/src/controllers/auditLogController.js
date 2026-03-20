const { apiResponse, getPagination, buildPaginationMeta } = require('../utils/helpers');
const auditLogModel = require('../models/auditLogModel');

const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, entity_type, actor_user_id } = req.query;
    const { offset, limitNum } = getPagination(page, limit);
    const filters = {
      entityType: entity_type || null,
      actorUserId: actor_user_id || null,
    };

    const logs = await auditLogModel.getAuditLogs(offset, limitNum, filters);
    const total = await auditLogModel.countAuditLogs(filters);

    res.json(
      apiResponse(
        true,
        logs,
        'Audit logs retrieved',
        buildPaginationMeta(total, page, limit)
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuditLogs,
};
