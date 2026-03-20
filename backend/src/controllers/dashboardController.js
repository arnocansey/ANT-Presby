const prisma = require('../config/prisma');
const { apiResponse } = require('../utils/helpers');
const donationModel = require('../models/donationModel');
const prayerRequestModel = require('../models/prayerRequestModel');
const auditLogModel = require('../models/auditLogModel');
const { decimalToString } = require('../utils/prismaHelpers');

/**
 * Admin Dashboard Controller - Handles dashboard statistics and overview
 */

// Get dashboard overview
const getDashboardOverview = async (req, res, next) => {
  try {
    const now = new Date();

    const [
      totalUsers,
      totalMembers,
      totalAdmins,
      totalSermons,
      totalEvents,
      totalUpcomingEvents,
      totalRegistrations,
      donationStats,
      prayerStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'member' } }),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.sermon.count(),
      prisma.event.count(),
      prisma.event.count({
        where: {
          eventDate: { gt: now },
          status: 'active',
        },
      }),
      prisma.eventRegistration.count(),
      donationModel.getDonationStatistics(),
      prayerRequestModel.getPrayerStatistics(),
    ]);

    const overview = {
      users: {
        total: totalUsers,
        members: totalMembers,
        admins: totalAdmins,
      },
      content: {
        sermons: totalSermons,
      },
      events: {
        total: totalEvents,
        upcoming: totalUpcomingEvents,
        registrations: totalRegistrations,
      },
      donations: donationStats,
      prayers: prayerStats,
    };

    res.json(apiResponse(true, overview, 'Dashboard overview retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get recent activities
const getRecentActivities = async (req, res, next) => {
  try {
    const [auditLogs, users, donations] = await Promise.all([
      auditLogModel.getAuditLogs(0, 12, {}),
      prisma.user.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        select: {
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      }),
      prisma.donation.findMany({
        take: 4,
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        select: {
          amount: true,
          createdAt: true,
        },
      }),
    ]);

    const activities = [
      ...auditLogs.map((log) => ({
        type: `${log.entity_type}:${log.action}`,
        created_at: log.created_at,
        description: log.summary,
      })),
      ...users.map((user) => ({
        type: 'user_registration',
        created_at: user.createdAt,
        description: `${user.firstName} ${user.lastName}`.trim(),
      })),
      ...donations.map((donation) => ({
        type: 'donation',
        created_at: donation.createdAt,
        description: `Donation: GHS ${decimalToString(donation.amount)}`,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20);

    res.json(apiResponse(true, activities, 'Recent activities retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get user growth statistics
const getUserGrowthStats = async (req, res, next) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        COUNT(*)::int as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    res.json(apiResponse(true, stats, 'User growth statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get revenue statistics
const getRevenueStats = async (req, res, next) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as total,
        COUNT(*)::int as transaction_count
      FROM donations
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    res.json(apiResponse(true, stats, 'Revenue statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

const getContentStats = async (req, res, next) => {
  try {
    const [newsGrouped, featuredNews, activeEvents, sermonByMinistry, topEvents] = await Promise.all([
      prisma.newsPost.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.newsPost.count({ where: { featured: true } }),
      prisma.event.count({ where: { status: 'active' } }),
      prisma.sermon.groupBy({
        by: ['ministryId'],
        _count: { _all: true },
      }),
      prisma.event.findMany({
        take: 5,
        orderBy: {
          registrations: {
            _count: 'desc',
          },
        },
        select: {
          id: true,
          name: true,
          eventDate: true,
          status: true,
          _count: {
            select: {
              registrations: true,
            },
          },
        },
      }),
    ]);

    const news = newsGrouped.reduce((acc, row) => {
      acc[row.status] = row._count._all;
      return acc;
    }, {
      draft: 0,
      review: 0,
      scheduled: 0,
      published: 0,
      archived: 0,
    });

    const ministryIds = sermonByMinistry.map((row) => row.ministryId).filter(Boolean);
    const ministries = ministryIds.length
      ? await prisma.ministry.findMany({
          where: { id: { in: ministryIds } },
          select: { id: true, name: true },
        })
      : [];

    const ministryMap = new Map(ministries.map((item) => [item.id, item.name]));

    res.json(apiResponse(true, {
      news: {
        ...news,
        total: Object.values(news).reduce((sum, value) => sum + value, 0),
        featured: featuredNews,
      },
      events: {
        active: activeEvents,
      },
      sermons_by_ministry: sermonByMinistry.map((row) => ({
        ministry_id: row.ministryId,
        ministry_name: ministryMap.get(row.ministryId) || 'Unassigned',
        count: row._count._all,
      })),
      top_events_by_registrations: topEvents.map((event) => ({
        id: event.id,
        name: event.name,
        event_date: event.eventDate,
        status: event.status,
        registrations: event._count.registrations,
      })),
    }, 'Content statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

const getEngagementStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      unreadNotifications,
      totalNotifications,
      unreadContacts,
      totalContacts,
      registrationsLast30Days,
      donationsLast30Days,
      auditLast30Days,
      donationMix,
    ] = await Promise.all([
      prisma.notification.count({ where: { isRead: false } }),
      prisma.notification.count(),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.contactMessage.count(),
      prisma.eventRegistration.count({ where: { registeredAt: { gte: thirtyDaysAgo } } }),
      prisma.donation.count({ where: { createdAt: { gte: thirtyDaysAgo }, status: 'completed' } }),
      prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.donation.groupBy({
        by: ['donationType'],
        where: {
          status: 'completed',
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    res.json(apiResponse(true, {
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications,
      },
      contacts: {
        total: totalContacts,
        unread: unreadContacts,
      },
      registrations_last_30_days: registrationsLast30Days,
      completed_donations_last_30_days: donationsLast30Days,
      admin_actions_last_30_days: auditLast30Days,
      donations_by_type_last_30_days: donationMix.map((row) => ({
        donation_type: row.donationType,
        count: row._count._all,
        total_amount: decimalToString(row._sum.amount),
      })),
    }, 'Engagement statistics retrieved'));
  } catch (error) {
    next(error);
  }
};

// Get system health
const getSystemHealth = async (req, res) => {
  try {
    const dbConnection = await prisma.$queryRaw`SELECT 1`;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbConnection ? 'connected' : 'disconnected',
      },
    };

    res.json(apiResponse(true, health, 'System health retrieved'));
  } catch (error) {
    res.status(503).json(
      apiResponse(false, { status: 'unhealthy' }, 'System health check failed')
    );
  }
};

module.exports = {
  getDashboardOverview,
  getRecentActivities,
  getUserGrowthStats,
  getRevenueStats,
  getContentStats,
  getEngagementStats,
  getSystemHealth,
};
